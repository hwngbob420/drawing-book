// Chuyển bộ minh hoạ hoạ sĩ (catalog.json, nguồn trong .refs/) thành nét tô màu: public/svg/artist/<id>.svg
//   node scripts/artists/convert.mjs [--url http://localhost:5173]
// Cần dev server đang chạy (SvgLineArtConverter chạy trong trình duyệt headless) + playwright-core/Chromium.
// Sau chuyển đổi, svgo dọn mã (giữ viewBox, không gộp path, giữ data-*); ghi kèm NOTICE.md giấy phép từng nguồn.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { optimize } from 'svgo';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const i = args.indexOf('--url');
const base = i >= 0 ? args[i + 1] : 'http://localhost:5173';

async function loadPlaywright() {
  const bases = [root];
  try { bases.push(execSync('npm root -g', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()); } catch {}
  const npx = path.join(os.homedir(), 'AppData/Local/npm-cache/_npx');
  if (fs.existsSync(npx)) for (const d of fs.readdirSync(npx)) bases.push(path.join(npx, d, 'node_modules'));
  for (const b of bases) for (const n of ['playwright-core', 'playwright']) {
    try { const m = await import(pathToFileURL(createRequire(path.join(b, 'noop.js')).resolve(n)).href); return m.chromium ? m : m.default; } catch {}
  }
  throw new Error('Thiếu playwright-core');
}
function findChrome(pw) {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  try { if (fs.existsSync(pw.chromium.executablePath())) return undefined; } catch {}
  const cache = path.join(os.homedir(), process.platform === 'win32' ? 'AppData/Local/ms-playwright' : process.platform === 'darwin' ? 'Library/Caches/ms-playwright' : '.cache/ms-playwright');
  if (!fs.existsSync(cache)) return undefined;
  const exes = { win32: 'chrome-win64/chrome.exe', darwin: 'chrome-mac/Chromium.app/Contents/MacOS/Chromium', linux: 'chrome-linux/chrome' };
  return fs.readdirSync(cache).filter((d) => /^chromium-\d+$/.test(d)).sort((a, b) => b.split('-')[1] - a.split('-')[1])
    .map((d) => path.join(cache, d, exes[process.platform] || exes.linux)).find((p) => fs.existsSync(p));
}

const pw = await loadPlaywright();
const browser = await pw.chromium.launch({ headless: true, executablePath: findChrome(pw) });
const page = await browser.newPage();
await page.goto(`${base}/scripts/artists/convert.html`);
await page.waitForFunction(() => window.__done === true, null, { timeout: 300000 });
const results = await page.evaluate(() => window.__out);
await browser.close();

const catalog = JSON.parse(fs.readFileSync(path.join(root, 'scripts/artists/catalog.json'), 'utf8'));
const out = path.join(root, 'public/svg/artist');
fs.mkdirSync(out, { recursive: true });
for (const f of fs.readdirSync(out)) if (f.endsWith('.svg')) fs.unlinkSync(path.join(out, f));

const svgoConfig = {
  multipass: true,
  floatPrecision: 2,
  plugins: [
    { name: 'preset-default', params: { overrides: { removeViewBox: false, mergePaths: false, convertColors: { shorthex: false }, removeUnknownsAndDefaults: { keepDataAttrs: true } } } },
  ],
};
const names = [];
let failed = 0;
for (const r of results) {
  if (r.error) {
    console.error('LỖI', r.id, r.error);
    failed++;
    continue;
  }
  const svg = optimize(r.svg, svgoConfig).data;
  fs.writeFileSync(path.join(out, r.id + '.svg'), svg + '\n');
  names.push(r.id);
  console.log(`${r.id.padEnd(16)} ${String(r.report.kept).padStart(3)} giữ, ${String(r.report.dropped).padStart(3)} bỏ  ${(svg.length / 1024).toFixed(1)} KB`);
}
fs.writeFileSync(path.join(root, 'scripts/artists/names.json'), JSON.stringify(names.sort()));

// NOTICE: giấy phép theo nguồn (CC BY-SA yêu cầu ghi công + chia sẻ bản chuyển thể cùng giấy phép)
const bySource = {};
for (const it of catalog.items) if (names.includes(it.id)) (bySource[it.source] ??= []).push(`${it.id}.svg ← ${it.file}`);
let notice = '# Bộ hình hoạ sĩ (đã chuyển thành nét tô màu)\n\nSinh bởi `node scripts/artists/convert.mjs` từ các nguồn dưới đây; mỗi file là bản chuyển thể (đổi màu thành nền trắng, chuẩn hoá nét, bỏ chi tiết nhỏ).\n';
for (const [k, list] of Object.entries(bySource)) {
  const s = catalog.sources[k];
  notice += `\n## ${s.author} — ${s.license}\n\nNguồn: ${s.repo} · Giấy phép: ${s.licenseUrl}\n${s.license.startsWith('CC BY-SA') ? '\nCác bản chuyển thể này được phát hành theo cùng giấy phép CC BY-SA 4.0.\n' : ''}\n${list.map((l) => '- ' + l).join('\n')}\n`;
}
fs.writeFileSync(path.join(out, 'NOTICE.md'), notice);
console.log(`${names.length} hình -> ${path.relative(root, out)}${failed ? `, ${failed} lỗi` : ''}`);
process.exit(failed ? 1 : 0);
