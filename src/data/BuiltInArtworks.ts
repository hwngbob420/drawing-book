import { Artwork, AnimPart, ART_W, ART_H } from '../types';
import { SceneLayer, Pen, composeScene, sceneAnim, ground, poly } from '../engine/SceneComposer';

/**
 * Tranh mẫu theo luật bố cục sách tranh "1 chính – 1 phụ – nền thoáng":
 *  - 1 nhân vật chính lớn (~60% chiều cao khung), quay về phía bạn đồng hành;
 *  - 1 bạn đồng hành nhỏ hơn, tương tác với nhân vật chính;
 *  - nền chỉ 2–3 đường đồi/đường đi cong mềm + 1–2 đám mây (mỗi đám một dáng). Không mặt trời cười,
 *    không khóm cỏ lặp lại, không hàng hoa dàn ngang.
 * Nguồn hình: 'a:<tên>' = minh hoạ hoạ sĩ đã chuyển thành nét tô màu (scripts/artists), 's:<tên>' = hình tự vẽ
 * (scripts/storybook) cho nhân vật mà kho hoạ sĩ không có. Lớp sau che lớp trước.
 * Cách thêm tranh mới: xem README (hoặc thả SVG vào public/artworks/ — xem ArtworkManifest).
 */

/** Một dải đồi cong mềm kéo kín xuống đáy tranh; `phase` đổi dáng để các tranh không giống nhau. */
function hill(y: number, amp: number, phase: number, w = ART_W, h = ART_H): Path2D {
  const a = amp * Math.sin(phase);
  const b = amp * Math.cos(phase * 1.7);
  return ground(
    [-30, y + a],
    [
      [w * 0.22, y - amp + b, w * 0.42, y - amp * 0.3 - a, w * 0.6, y + b * 0.4],
      [w * 0.76, y + amp * 0.6 + a, w * 0.9, y - amp * 0.4, w + 30, y - b],
    ],
    w,
    h,
  );
}
/** 2–3 đường đồi xếp lớp (xa -> gần). */
const hills = (...rows: [y: number, amp: number, phase: number][]) => (p: Pen) => {
  for (const [y, amp, phase] of rows) p.shape(hill(y, amp, phase));
};

const PUPPY: SceneLayer[] = [
  { s: 's:cloud', x: 330, y: 170, size: 300, anim: 'drift' },
  { s: 's:cloud3', x: 1210, y: 140, size: 240, anim: 'drift', amp: -18 },
  hills([760, 50, 0.6], [985, 42, 2.4]),
  { s: 's:butterfly', x: 1190, y: 430, size: 320, rot: 0.22, anim: 'flutter' },
  { s: 'a:dog', x: 610, y: 700, size: 760, flip: true, anim: 'breathe' },
];

const BALLOONS: SceneLayer[] = [
  { s: 's:cloud2', x: 1240, y: 170, size: 280, anim: 'drift' },
  hills([800, 46, 1.4], [1010, 36, 3.6]),
  { s: 'a:chick', x: 1220, y: 920, size: 380, anim: 'hop', amp: 14 },
  { s: 'a:gopher_balloons', x: 620, y: 640, size: 840, anim: 'sway', amp: 6 },
];

const RAIN: SceneLayer[] = [
  { s: 's:cloud', x: 300, y: 150, size: 280, anim: 'drift' },
  { s: 's:cloud2', x: 1300, y: 120, size: 260, anim: 'drift', amp: -20 },
  hills([820, 40, 2.9], [1030, 30, 0.4]),
  (p) => p.shape(new Path2D('M1000 1090 C1000 1062 1180 1054 1300 1062 C1420 1070 1440 1100 1300 1108 C1170 1116 1000 1114 1000 1090 Z')), // vũng nước
  { s: 'a:frog', x: 1180, y: 940, size: 400, flip: true, anim: 'hop', amp: 16 },
  { s: 'a:gopher_umbrella', x: 600, y: 650, size: 820, anim: 'sway', amp: 5 },
];

const DINO: SceneLayer[] = [
  { s: 's:cloud3', x: 1250, y: 160, size: 280, anim: 'drift' },
  hills([780, 56, 4.1], [1000, 40, 1.1]),
  { s: 's:chick2', x: 1210, y: 950, size: 360, anim: 'hop', amp: 12, speed: 4 },
  { s: 's:trex', x: 640, y: 700, size: 760, flip: true, anim: 'breathe', amp: 0.03 },
];

const SPACE: SceneLayer[] = [
  (p) => {
    // chân trời một hành tinh lớn + vài tia lấp lánh
    p.shape(new Path2D('M-30 1230 L-30 1010 C300 900 1300 900 1630 1010 L1630 1230 Z'));
    for (const [x, y] of [[180, 220], [1480, 760], [880, 140]] as [number, number][]) p.line(poly([[x - 18, y], [x + 18, y]], false), poly([[x, y - 18], [x, y + 18]], false));
  },
  { s: 's:twinkle', x: 300, y: 560, size: 150, rot: 0.2, anim: 'breathe', amp: 0.12, speed: 4 },
  { s: 's:twinkle', x: 1420, y: 120, size: 130, rot: -0.3, anim: 'breathe', amp: 0.12, speed: 5 },
  { s: 'a:ufo', x: 1230, y: 400, size: 440, anim: 'drift', amp: 26, speed: 1.6 },
  { s: 'a:rocket', x: 640, y: 600, size: 860, anim: 'hop', amp: 20, speed: 2.4 },
];

const OCEAN: SceneLayer[] = [
  (p) => {
    // mặt nước gợn phía trên + đáy cát
    p.line(new Path2D('M-30 120 C200 80 400 160 640 120 C880 80 1080 160 1320 120 C1460 96 1560 110 1630 120'));
    p.shape(hill(1040, 34, 1.9));
  },
  { s: 's:bubble', x: 1000, y: 260, size: 150, anim: 'hop', amp: 16, speed: 1.8 },
  { s: 'a:narwhal', x: 1220, y: 520, size: 460, anim: 'drift', amp: 22, speed: 1.3 },
  { s: 'a:octopus', x: 590, y: 660, size: 760, anim: 'breathe', amp: 0.05 },
];

const FARM: SceneLayer[] = [
  { s: 's:cloud', x: 1180, y: 160, size: 290, anim: 'drift' },
  { s: 's:cloud2', x: 300, y: 120, size: 220, anim: 'drift', amp: 16 },
  hills([740, 48, 5.2], [880, 30, 3.3], [1040, 26, 0.9]),
  { s: 's:chick', x: 1220, y: 970, size: 330, anim: 'hop', amp: 14, speed: 5 },
  { s: 'a:cow', x: 620, y: 700, size: 780, flip: true, anim: 'breathe' },
];

const SWEETS: SceneLayer[] = [
  { s: 's:cloud3', x: 300, y: 150, size: 260, anim: 'drift' },
  { s: 's:cloud', x: 1300, y: 190, size: 300, anim: 'drift', amp: -18 },
  hills([860, 44, 2.2], [1050, 30, 4.4]),
  { s: 'a:lollipop', x: 1230, y: 720, size: 540, rot: 0.14, anim: 'sway', amp: 8 },
  { s: 'a:cupcake', x: 620, y: 650, size: 760, anim: 'breathe', amp: 0.025 },
];

const CITY: SceneLayer[] = [
  { s: 's:cloud2', x: 340, y: 160, size: 280, anim: 'drift' },
  (p) => {
    // đường phố uốn nhẹ + vạch kẻ to
    p.shape(new Path2D('M-30 860 C400 820 1200 830 1630 870 L1630 1230 L-30 1230 Z'));
    for (let x = 60; x < 1600; x += 300) p.shape(new Path2D(`M${x} 1070 h170 a17 17 0 0 1 0 34 h-170 a17 17 0 0 1 0 -34 Z`));
  },
  { s: 's:helicopter', x: 1240, y: 340, size: 420, anim: 'drift', amp: 20, speed: 1.8 },
  { s: 's:firetruck', x: 650, y: 790, size: 820, anim: 'hop', amp: 8, speed: 5 },
];

const FAIRY: SceneLayer[] = [
  { s: 's:cloud', x: 1330, y: 150, size: 280, anim: 'drift' },
  hills([780, 52, 3.8], [1000, 38, 0.2]),
  { s: 's:fairy', x: 1230, y: 430, size: 420, rot: 0.08, anim: 'drift', amp: 16 },
  { s: 's:unicorn', x: 600, y: 720, size: 780, flip: true, anim: 'breathe' },
];

const FOREST: SceneLayer[] = [
  { s: 's:cloud3', x: 1250, y: 170, size: 260, anim: 'drift' },
  { s: 's:cloud2', x: 380, y: 130, size: 230, anim: 'drift', amp: 14 },
  hills([760, 60, 2.6], [990, 40, 5.0]),
  { s: 'a:hedgehog', x: 1220, y: 960, size: 390, anim: 'hop', amp: 10 },
  { s: 'a:cat', x: 600, y: 680, size: 760, flip: true, anim: 'sway', amp: 6 },
];

function scene(id: string, title: string, titleEn: string, layers: SceneLayer[]): Artwork {
  return { id, title, titleEn, builtIn: true, anim: sceneAnim(layers), render: () => composeScene(layers) };
}

export const BUILT_IN_ARTWORKS: Artwork[] = [
  scene('s-puppy', 'Cún con và bạn bướm', 'Puppy and Butterfly', PUPPY),
  scene('s-balloons', 'Chuột chũi và bóng bay', 'Balloon Day', BALLOONS),
  scene('s-rain', 'Ngày mưa vui vẻ', 'Happy Rainy Day', RAIN),
  scene('s-dino', 'Khủng long và trứng nở', 'Dino and the Egg', DINO),
  scene('s-space', 'Du hành vũ trụ', 'Space Trip', SPACE),
  scene('s-ocean', 'Đại dương kỳ thú', 'Ocean Friends', OCEAN),
  scene('s-farm', 'Bò sữa và gà con', 'Cow and Chick', FARM),
  scene('s-sweets', 'Vương quốc bánh ngọt', 'Sweet Kingdom', SWEETS),
  scene('s-city', 'Xe cứu hoả', 'Fire Truck', CITY),
  scene('s-fairy', 'Kỳ lân và nàng tiên', 'Unicorn and Fairy', FAIRY),
  scene('s-forest', 'Mèo và nhím', 'Cat and Hedgehog', FOREST),
];

/** Chuyển động mặc định cho tranh phụ huynh tải lên (không biết trước bố cục). */
export const GENERIC_ANIM: AnimPart[] = [
  { kind: 'breathe', cx: 800, cy: 620, rx: 620, ry: 620, amp: 0.025, speed: 2.4 },
  { kind: 'sway', cx: 250, cy: 500, rx: 260, ry: 420, amp: 10, speed: 1.4 },
  { kind: 'sway', cx: 1350, cy: 500, rx: 260, ry: 420, amp: 10, speed: 1.5, phase: 2 },
];
