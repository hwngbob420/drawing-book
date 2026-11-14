// Trích các SVG cần dùng từ .refs/ vào dự án (chạy lại khi muốn thêm hình):
//   node scripts/extract-assets.mjs
// - Noto Emoji (Apache-2.0)  -> public/svg/noto/      (nhân vật, cảnh vật cho SceneComposer)
// - OpenMoji black (CC BY-SA 4.0) -> public/svg/openmoji/ (đạo cụ nét đen)
// - OpenMoji color (CC BY-SA 4.0) -> src/assets/icons/    (icon giao diện)
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const refs = path.join(root, '.refs');

const NOTO = `1f415 1f31e 1f333 1f98b 1f33b 1f337 1f33c 1f41e
1f995 1f996 1f30b 1f334 1f95a
1f680 1f9d1_200d_1f680 1fa90 2b50 1f319 1f6f8 1f30d
1f42c 1f419 1f422 1fab8 1f420 1f41f 1f980 1f41a
1f408 1f407 1f425 1f424 1f308 1f3e1 1f416
1f382 1f366 1f353 1f36d 1f9c1 1f369 1f36c 1f352
1f692 2708 1f682 1f3e2 1f6a6 1f681 1f697
1f984 1f3f0 1f344
1f9da 1f431 1f451 1f43c 1f409 1f436 26d1 1f6d1 2601 1fa84 1f9f6 1f383 1f40e 1f9b4 1f426 26bd 1f6a2 1f388 1f38d 1f370 1f332 1f30a 1f33a 1f423`.split(/\s+/);
const OPENMOJI = `2601 1FAE7 E21B`.split(/\s+/);
const ICONS = `2B05 21A9 21AA 1FA84 1F58C 1FAA3 1FA8C 2699 1F3AC 1F4BE 1F50A 1F507 1F5E3 1F5D1 2795 2796 1F58A 1F58D 2728 1F36D 1F308 1F512 2B50 23F9 2716 1F4E4 1F3A8 1F92B 1F5BC 1F3B2 25B6`.split(/\s+/);

/** Làm sạch file Illustrator của Noto để thành XML hợp lệ, gọn nhẹ. */
function cleanNoto(src) {
  let s = src.slice(src.indexOf('<svg'));
  s = s.replace(/<metadata>[\s\S]*?<\/metadata>/g, '');
  s = s.replace(/&ns_[a-z_]+;/g, 'http://ns.invalid/');
  s = s.replace(/<!--[\s\S]*?-->/g, '');
  return s.trim();
}

let n = 0;
for (const c of NOTO) {
  const f = path.join(refs, 'noto-emoji/2D/svg', `emoji_u${c}.svg`);
  fs.writeFileSync(path.join(root, 'public/svg/noto', `${c}.svg`), cleanNoto(fs.readFileSync(f, 'latin1')));
  n++;
}
for (const c of OPENMOJI) {
  fs.copyFileSync(path.join(refs, 'openmoji/black/svg', `${c}.svg`), path.join(root, 'public/svg/openmoji', `${c}.svg`));
  n++;
}
for (const c of ICONS) {
  fs.copyFileSync(path.join(refs, 'openmoji/color/svg', `${c}.svg`), path.join(root, 'src/assets/icons', `${c}.svg`));
  n++;
}
console.log(`Đã trích ${n} file SVG`);
