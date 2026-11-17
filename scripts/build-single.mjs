// Đóng gói toàn bộ ứng dụng thành MỘT file HTML (JS, CSS và mọi SVG nhúng sẵn):
//   npm run build:single
// Kết quả: dist-single/magic-coloring-book.html — mở trực tiếp hoặc đưa lên bất kỳ host tĩnh nào.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const assets = fs.readdirSync(path.join(dist, 'assets'));
const js = fs.readFileSync(path.join(dist, 'assets', assets.find((f) => f.endsWith('.js'))), 'utf8');
const css = fs.readFileSync(path.join(dist, 'assets', assets.find((f) => f.endsWith('.css'))), 'utf8');

const svgs = {};
// chỉ nhúng bộ hình sách tranh — tranh mẫu và Xưởng Phép Thuật không còn dùng Noto/OpenMoji
for (const [dir, prefix] of [['story', 's:']]) {
  if (!fs.existsSync(path.join(root, 'public/svg', dir))) continue;
  for (const f of fs.readdirSync(path.join(root, 'public/svg', dir))) {
    svgs[prefix + f.replace('.svg', '')] = fs.readFileSync(path.join(root, 'public/svg', dir, f), 'utf8');
  }
}
// không để chuỗi "</script" hay "<!--" xuất hiện thô trong thẻ <script>
const safe = (s) => s.replace(/<\/(script)/gi, '<\\/$1').replace(/<!--/g, '<\\!--');
const data = safe(JSON.stringify(svgs));

const head = `<title>Sách Tô Màu Phép Thuật</title>
<meta name="theme-color" content="#ffd166" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="mobile-web-app-capable" content="yes" />
<style>${css}</style>`;
const body = `<div id="app"></div>
<script>window.__MCB_SVG__=${data};</script>
<script type="module">${safe(js)}</script>`;

fs.mkdirSync(path.join(root, 'dist-single'), { recursive: true });
const full = `<!doctype html>
<html lang="vi">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
${head}
</head>
<body>
${body}
</body>
</html>
`;
fs.writeFileSync(path.join(root, 'dist-single/magic-coloring-book.html'), full);
// bản không có khung <html>/<head> cho nơi tự bọc trang (ví dụ Claude Artifact)
fs.writeFileSync(path.join(root, 'dist-single/artifact.html'), `${head}\n${body}\n`);
console.log('magic-coloring-book.html', (full.length / 1024 / 1024).toFixed(2) + ' MB');
