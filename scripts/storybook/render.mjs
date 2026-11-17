// Vòng lặp tự kiểm tra thị giác: chụp PNG headless (không mở cửa sổ) từ dev server.
//
//   node scripts/storybook/render.mjs stickers out/stickers.png [--only a,b] [--url http://localhost:5173]
//   node scripts/storybook/render.mjs scenes   out/scenes      [--only s-puppy]   -> 1 PNG / tranh
//   node scripts/storybook/render.mjs builder  out/builder                        -> 1 PNG / anh hùng x nền (27 tổ hợp)
//   node scripts/storybook/render.mjs full     out/full                           -> toàn bộ 162 tổ hợp Xưởng Phép Thuật
//
// Cần playwright-core + Chromium (tự tìm trong node_modules, npm root -g, hoặc cache npx; hoặc đặt PLAYWRIGHT_CORE).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { execSync } from 'node:child_process';

async function loadPlaywright() {
  const bases = [process.cwd()];
  try { bases.push(execSync('npm root -g', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()); } catch {}
  const npx = path.join(os.homedir(), 'AppData/Local/npm-cache/_npx');
  if (fs.existsSync(npx)) for (const d of fs.readdirSync(npx)) bases.push(path.join(npx, d, 'node_modules'));
  const cands = [process.env.PLAYWRIGHT_CORE].filter(Boolean);
  for (const b of bases) for (const n of ['playwright-core', 'playwright']) {
    try { cands.push(createRequire(path.join(b, 'noop.js')).resolve(n)); } catch {}
  }
  for (const c of cands) {
    try { const m = await import(pathToFileURL(c).href); return m.chromium ? m : m.default; } catch {}
  }
  console.error('Thiếu playwright-core: npm i -g playwright-core && npx playwright install chromium');
  process.exit(1);
}

const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf(name); if (i < 0) return def; const v = args[i + 1]; args.splice(i, 2); return v; };
const base = opt('--url', 'http://localhost:5173');
const only = opt('--only', '');
const [mode, out] = args;
if (!mode || !out) {
  console.error('node render.mjs stickers|scenes|builder <out> [--only a,b] [--url ...]');
  process.exit(1);
}

const pw = await loadPlaywright();
// Chromium: $CHROME_PATH, bản đúng phiên bản của playwright, rồi bản mới nhất trong cache ms-playwright
function findChrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  try { if (fs.existsSync(pw.chromium.executablePath())) return undefined; } catch {}
  const cache = path.join(os.homedir(), process.platform === 'win32' ? 'AppData/Local/ms-playwright' : process.platform === 'darwin' ? 'Library/Caches/ms-playwright' : '.cache/ms-playwright');
  if (!fs.existsSync(cache)) return undefined;
  const exes = { win32: 'chrome-win64/chrome.exe', darwin: 'chrome-mac/Chromium.app/Contents/MacOS/Chromium', linux: 'chrome-linux/chrome' };
  const dirs = fs.readdirSync(cache).filter((d) => /^chromium-\d+$/.test(d)).sort((a, b) => b.split('-')[1] - a.split('-')[1]);
  return dirs.map((d) => path.join(cache, d, exes[process.platform] || exes.linux)).find((p) => fs.existsSync(p));
}
const browser = await pw.chromium.launch({ headless: true, executablePath: findChrome() });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: 1 });
const errors = [];
page.on('console', (m) => m.type() === 'error' && !m.text().startsWith('Failed to load resource') && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(String(e)));
page.on('response', (r) => r.status() >= 400 && !r.url().endsWith('favicon.ico') && errors.push(`${r.status()} ${r.url()}`));

const px = opt('--px', '');
const q = '?' + [only && 'only=' + only, px && 'px=' + px].filter(Boolean).join('&');
if (mode === 'stickers') {
  await page.goto(`${base}/scripts/storybook/preview.html${q}`);
  await page.waitForFunction(() => document.querySelectorAll('#g img').length > 0 && [...document.images].every((i) => i.complete));
  await page.waitForTimeout(300);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await page.screenshot({ path: out, fullPage: true });
  console.log('stickers ->', out);
  const lint = await page.evaluate(() => (window).__lint || []);
  console.log(lint.length ? `LINT (${lint.length} hình):\n` + lint.join('\n') : 'LINT: sạch');
} else {
  const full = mode === 'full';
  await page.goto(`${base}/scripts/storybook/scenes.html?mode=${full ? 'builder&full=1' : mode}${only ? '&only=' + only : ''}`);
  await page.waitForFunction(() => (window).__done === true, null, { timeout: 900000 });
  const shots = await page.evaluate(() => (window).__shots);
  fs.mkdirSync(out, { recursive: true });
  for (const [name, url] of shots) {
    fs.writeFileSync(path.join(out, name + '.png'), Buffer.from(url.split(',')[1], 'base64'));
  }
  console.log(shots.length, 'PNG ->', out);
  console.log((await page.evaluate(() => (window).__report)).join('\n'));
}
if (errors.length) console.error('Lỗi trong trang:\n' + errors.join('\n'));
await browser.close();
