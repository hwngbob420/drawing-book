import { Artwork, AnimPart } from '../types';
import { SceneLayer, Pen, composeScene, sceneAnim, ground, curve, poly, rrect, circle } from '../engine/SceneComposer';

/**
 * 9 bức tranh bối cảnh, ghép từ bộ hình sách tranh tự vẽ ('s:<tên>', xem scripts/storybook).
 * Mỗi lớp: { s: nguồn, x, y: tâm hình, size: cạnh khung vuông (px trên tranh
 * 1600x1200), rot, flip, anim } hoặc một hàm vẽ nét nền. Lớp sau che lớp trước.
 *
 * Bố cục 3 lớp kiểu sách tranh: hậu cảnh (trời, mây, đồi xa) — trung cảnh (1–2 đường đồi
 * cong lớn, cây/nhà làm mốc) — tiền cảnh (nhân vật chính cao ~50–65% khung, đứng trên đồi gần).
 * Hình có mặt không nhỏ hơn ~230px để mọi mảng tô >= 25px (kiểm tra: scripts/storybook/render.mjs scenes).
 * Cách thêm tranh mới: xem README.
 */

const hills = (far: number, near: number) => (p: Pen) => {
  p.shape(
    ground(
      [-30, far],
      [
        [300, far - 90, 650, far - 40, 950, far + 10],
        [1200, far + 55, 1430, far - 10, 1640, far - 50],
      ],
    ),
  );
  p.shape(
    ground(
      [-30, near],
      [
        [350, near - 75, 800, near + 5, 1200, near - 30],
        [1400, near - 48, 1500, near - 70, 1640, near - 55],
      ],
    ),
  );
};

const tufts = (...pts: [number, number, number?][]) => (p: Pen) => {
  for (const [x, y, s] of pts) p.grass(x, y, s ?? 1);
};

const PUPPY: SceneLayer[] = [
  { s: 's:sun', x: 1360, y: 200, size: 330, anim: 'spin' },
  { s: 's:cloud', x: 330, y: 160, size: 300, anim: 'drift' },
  { s: 's:cloud', x: 860, y: 130, size: 250, anim: 'drift', amp: -20 },
  hills(740, 965),
  { s: 's:tree', x: 230, y: 560, size: 560, anim: 'sway', amp: 12 },
  { s: 's:bush', x: 1480, y: 720, size: 300 },
  tufts([140, 1130, 1.3], [1000, 1160, 1.2], [1560, 1040, 1.1], [600, 860, 1]),
  { s: 's:butterfly', x: 1110, y: 430, size: 250, rot: 0.25, anim: 'flutter' },
  { s: 's:butterfly', x: 560, y: 330, size: 230, rot: -0.3, anim: 'flutter' },
  { s: 's:puppy', x: 790, y: 770, size: 680, anim: 'breathe' },
  { s: 's:ball', x: 1180, y: 1030, size: 240, anim: 'hop', amp: 14 },
  { s: 's:sunflower', x: 1430, y: 900, size: 380, anim: 'sway' },
  { s: 's:tulip', x: 400, y: 1010, size: 320, anim: 'sway' },
  { s: 's:flower', x: 150, y: 990, size: 260, anim: 'sway', amp: 8 },
  { s: 's:ladybug', x: 610, y: 1110, size: 230, rot: 0.3, anim: 'hop', amp: 10 },
];

const DINO: SceneLayer[] = [
  { s: 's:sun', x: 200, y: 180, size: 300, anim: 'spin' },
  { s: 's:cloud', x: 700, y: 140, size: 280, anim: 'drift' },
  { s: 's:volcano', x: 1270, y: 480, size: 600 },
  hills(760, 975),
  { s: 's:palm', x: 220, y: 610, size: 640, anim: 'sway', amp: 12 },
  { s: 's:pine', x: 1520, y: 780, size: 330, anim: 'sway', amp: 8 },
  tufts([520, 1140, 1.3], [1020, 1160, 1.2], [1500, 1120, 1.1]),
  { s: 's:longneck', x: 740, y: 690, size: 780, flip: true, anim: 'breathe', amp: 0.03 },
  { s: 's:trex', x: 1240, y: 930, size: 420, anim: 'hop' },
  { s: 's:egg', x: 300, y: 1030, size: 270, rot: -0.15, anim: 'hop', amp: 12, speed: 5 },
  { s: 's:rock', x: 1500, y: 1080, size: 240 },
];

const sparkles = (pts: [number, number][]) => (p: Pen) => {
  for (const [x, y] of pts) p.line(poly([[x - 16, y], [x + 16, y]], false), poly([[x, y - 16], [x, y + 16]], false));
};

const SPACE: SceneLayer[] = [
  sparkles([[760, 230], [1250, 440], [430, 660], [1480, 800], [880, 950], [90, 330], [1130, 90]]),
  { s: 's:twinkle', x: 560, y: 130, size: 160, rot: 0.2, anim: 'breathe', amp: 0.12, speed: 4 },
  { s: 's:twinkle', x: 960, y: 150, size: 130, rot: -0.3, anim: 'breathe', amp: 0.12, speed: 5 },
  { s: 's:twinkle', x: 1510, y: 600, size: 150, rot: 0.4, anim: 'breathe', amp: 0.12, speed: 4.4 },
  { s: 's:twinkle', x: 110, y: 590, size: 140, rot: -0.2, anim: 'breathe', amp: 0.12, speed: 4.8 },
  { s: 's:twinkle', x: 620, y: 1080, size: 150, rot: 0.3, anim: 'breathe', amp: 0.12, speed: 4.2 },
  { s: 's:planet', x: 310, y: 290, size: 440, anim: 'spin', amp: 0.12 },
  { s: 's:earth', x: 1350, y: 960, size: 380, anim: 'spin', amp: 0.35, speed: 0.8 },
  { s: 's:moon', x: 230, y: 920, size: 330, anim: 'sway', amp: 10 },
  { s: 's:ufo', x: 1300, y: 280, size: 400, anim: 'drift', amp: 28, speed: 1.6 },
  { s: 's:rocket', x: 690, y: 600, size: 680, anim: 'hop', amp: 22, speed: 2.4 },
  { s: 's:astronaut', x: 1080, y: 650, size: 420, rot: 0.12, anim: 'drift', amp: 16, speed: 1.3 },
];

const OCEAN: SceneLayer[] = [
  { s: 's:bubble', x: 1140, y: 180, size: 220, anim: 'hop', amp: 20, speed: 1.6 },
  { s: 's:bubble', x: 140, y: 200, size: 180, anim: 'hop', amp: 18, speed: 1.9 },
  { s: 's:bubble', x: 560, y: 110, size: 130, anim: 'hop', amp: 14, speed: 2.2 },
  (p) => {
    p.shape(
      ground(
        [-30, 1010],
        [
          [300, 950, 600, 1050, 900, 1000],
          [1200, 950, 1400, 1020, 1640, 970],
        ],
      ),
    );
    p.shape(circle(700, 1130, 26), circle(1330, 1150, 24), circle(60, 1120, 24));
  },
  { s: 's:seaweed', x: 200, y: 870, size: 480, anim: 'sway', amp: 10 },
  { s: 's:coral', x: 1440, y: 900, size: 400, anim: 'sway', amp: 8 },
  { s: 's:fish', x: 300, y: 430, size: 290, anim: 'drift' },
  { s: 's:fish', x: 1400, y: 380, size: 260, flip: true, anim: 'drift', amp: -24 },
  { s: 's:dolphin', x: 760, y: 390, size: 660, anim: 'hop', amp: 24, speed: 2.2 },
  { s: 's:octopus', x: 1130, y: 730, size: 420, anim: 'breathe', amp: 0.06 },
  { s: 's:turtle', x: 600, y: 850, size: 440, anim: 'drift', amp: 20, speed: 1.2 },
  { s: 's:crab', x: 940, y: 1060, size: 290, anim: 'hop', amp: 12, speed: 4 },
  { s: 's:shell', x: 1220, y: 1100, size: 230, rot: 0.25 },
];

const FARM: SceneLayer[] = [
  { s: 's:rainbow', x: 1060, y: 560, size: 900 },
  { s: 's:sun', x: 200, y: 190, size: 300, anim: 'spin' },
  { s: 's:cloud', x: 680, y: 140, size: 270, anim: 'drift' },
  hills(740, 960),
  { s: 's:house', x: 300, y: 560, size: 480 },
  { s: 's:tree', x: 1420, y: 590, size: 430, anim: 'sway', amp: 12 },
  tufts([70, 1130, 1.2], [1520, 1120, 1.2], [700, 880, 1]),
  { s: 's:pig', x: 1330, y: 950, size: 380, flip: true, anim: 'breathe' },
  { s: 's:kid_boy', x: 960, y: 820, size: 470, anim: 'hop', amp: 12 },
  { s: 's:cat', x: 530, y: 930, size: 410, anim: 'breathe' },
  { s: 's:bunny', x: 180, y: 980, size: 360, anim: 'hop', amp: 22 },
  { s: 's:chick', x: 760, y: 1070, size: 270, anim: 'hop', amp: 14, speed: 5 },
  { s: 's:chick', x: 1100, y: 1090, size: 240, flip: true, anim: 'hop', amp: 12, speed: 4.4 },
];

const SWEETS: SceneLayer[] = [
  (p) => {
    // dây cờ sinh nhật
    const rope = (x: number) => 70 + Math.sin((x / 1600) * Math.PI) * 90;
    p.line(curve([[-20, 60], [400, 150], [800, 165], [1200, 150], [1620, 60]]));
    for (let x = 120; x < 1560; x += 190) {
      const y = rope(x) - 6;
      p.shape(poly([[x - 56, y], [x + 56, y + (rope(x + 56) - rope(x - 56))], [x, y + 126]]));
    }
    // mặt bàn
    p.shape(new Path2D('M-30 900 H1630 V1230 H-30 Z'));
  },
  { s: 's:cherries', x: 160, y: 440, size: 270, anim: 'sway', amp: 10 },
  { s: 's:lollipop', x: 1420, y: 420, size: 340, rot: 0.2, anim: 'spin', amp: 0.2 },
  { s: 's:cake', x: 800, y: 600, size: 680, anim: 'breathe', amp: 0.025 },
  { s: 's:icecream', x: 330, y: 700, size: 480, anim: 'sway', amp: 10 },
  { s: 's:cupcake', x: 1270, y: 780, size: 440, anim: 'hop', amp: 14 },
  { s: 's:donut', x: 560, y: 1040, size: 300, anim: 'spin', amp: 0.25 },
  { s: 's:strawberry', x: 980, y: 1050, size: 280, rot: 0.15, anim: 'hop', amp: 12, speed: 4 },
  { s: 's:candy', x: 180, y: 1060, size: 250, anim: 'spin', amp: 0.3 },
  { s: 's:candy', x: 1430, y: 1070, size: 240, flip: true, anim: 'spin', amp: 0.3 },
];

const CITY: SceneLayer[] = [
  { s: 's:sun', x: 180, y: 170, size: 280, anim: 'spin' },
  { s: 's:cloud', x: 560, y: 330, size: 250, anim: 'drift' },
  { s: 's:cloud', x: 1420, y: 140, size: 260, anim: 'drift', amp: -22 },
  { s: 's:plane', x: 1040, y: 190, size: 390, anim: 'drift', amp: 30, speed: 1.2 },
  { s: 's:helicopter', x: 520, y: 140, size: 270, anim: 'drift', amp: 20, speed: 1.8 },
  (p) => {
    // dãy nhà phía xa: ít ô cửa, ô cửa to
    const b = (x: number, y: number, w: number) => {
      p.shape(new Path2D(`M${x} ${y} H${x + w} V760 H${x} Z`));
      for (let yy = y + 36; yy + 70 < 760; yy += 110) for (let xx = x + 26; xx + 56 <= x + w - 20; xx += 84) p.shape(rrect(xx, yy, 56, 64, 12));
    };
    b(620, 520, 180);
    b(800, 490, 200);
    b(1400, 470, 190);
    // vỉa hè + lòng đường
    p.shape(new Path2D('M-30 760 H1630 V1230 H-30 Z'));
    p.shape(new Path2D('M-30 900 H1630 V1230 H-30 Z'));
    for (let x = 40; x < 1600; x += 260) p.shape(rrect(x, 1044, 140, 30, 15));
  },
  { s: 's:building', x: 290, y: 510, size: 540 },
  { s: 's:train', x: 1150, y: 640, size: 520, anim: 'hop', amp: 8, speed: 6 },
  { s: 's:trafficlight', x: 690, y: 740, size: 320 },
  { s: 's:firetruck', x: 440, y: 950, size: 540, anim: 'hop', amp: 10, speed: 5 },
  { s: 's:car', x: 1200, y: 1040, size: 400, anim: 'drift', amp: 26, speed: 1.5 },
];

const FAIRY: SceneLayer[] = [
  { s: 's:rainbow', x: 560, y: 560, size: 960 },
  { s: 's:cloud', x: 1330, y: 150, size: 290, anim: 'drift' },
  { s: 's:twinkle', x: 960, y: 110, size: 140, rot: 0.2, anim: 'breathe', amp: 0.12, speed: 4 },
  { s: 's:twinkle', x: 120, y: 160, size: 120, rot: -0.3, anim: 'breathe', amp: 0.12, speed: 5 },
  hills(760, 970),
  { s: 's:castle', x: 1200, y: 530, size: 620, anim: 'breathe', amp: 0.018 },
  tufts([90, 900, 1], [920, 1150, 1.2], [1540, 1140, 1.1]),
  { s: 's:butterfly', x: 300, y: 300, size: 240, rot: -0.3, anim: 'flutter' },
  { s: 's:fairy', x: 830, y: 360, size: 400, rot: 0.08, anim: 'drift', amp: 16 },
  { s: 's:unicorn', x: 500, y: 780, size: 680, flip: true, anim: 'breathe' },
  { s: 's:mushroom', x: 1130, y: 1010, size: 300, anim: 'hop', amp: 10 },
  { s: 's:mushroom', x: 1330, y: 1060, size: 240, anim: 'hop', amp: 8, speed: 4 },
  { s: 's:tulip', x: 1490, y: 910, size: 280, anim: 'sway' },
  { s: 's:tulip', x: 130, y: 1040, size: 260, flip: true, anim: 'sway' },
];

/** Bạn bè dã ngoại: gấu đọc sách dưới gốc cây, voi con cầm bóng bay, cáo tinh nghịch, bạn nhỏ vẫy tay. */
const FRIENDS: SceneLayer[] = [
  { s: 's:sun', x: 1400, y: 180, size: 290, anim: 'spin' },
  { s: 's:cloud', x: 560, y: 150, size: 290, anim: 'drift' },
  { s: 's:cloud', x: 1000, y: 110, size: 220, anim: 'drift', amp: -18 },
  hills(720, 950),
  { s: 's:tree', x: 230, y: 520, size: 600, anim: 'sway', amp: 10 },
  { s: 's:bush', x: 1480, y: 700, size: 290 },
  tufts([620, 870, 1], [1180, 1150, 1.2], [80, 1140, 1.2]),
  { s: 's:bird', x: 760, y: 300, size: 230, flip: true, anim: 'hop', amp: 12 },
  { s: 's:balloon', x: 1000, y: 360, size: 330, anim: 'sway', amp: 10 },
  { s: 's:bear', x: 300, y: 880, size: 430, anim: 'breathe' },
  { s: 's:elephant', x: 790, y: 770, size: 580, anim: 'breathe' },
  { s: 's:kid_girl', x: 1150, y: 800, size: 470, anim: 'hop', amp: 12 },
  { s: 's:fox', x: 1430, y: 900, size: 420, flip: true, anim: 'sway', amp: 6 },
  { s: 's:flower', x: 560, y: 1080, size: 250, anim: 'sway', amp: 8 },
  { s: 's:tulip', x: 960, y: 1090, size: 250, anim: 'sway', amp: 8 },
];

function scene(id: string, title: string, titleEn: string, layers: SceneLayer[]): Artwork {
  return { id, title, titleEn, builtIn: true, anim: sceneAnim(layers), render: () => composeScene(layers) };
}

export const BUILT_IN_ARTWORKS: Artwork[] = [
  scene('s-puppy', 'Chú cún và đồng cỏ nắng', 'Sunny Meadow Puppy', PUPPY),
  scene('s-friends', 'Bạn bè dã ngoại', 'Picnic Friends', FRIENDS),
  scene('s-dino', 'Thế giới khủng long', 'Dinosaur World', DINO),
  scene('s-space', 'Du hành vũ trụ', 'Space Trip', SPACE),
  scene('s-ocean', 'Đại dương kỳ thú', 'Ocean Friends', OCEAN),
  scene('s-farm', 'Nông trại vui vẻ', 'Happy Farm', FARM),
  scene('s-sweets', 'Vương quốc bánh ngọt', 'Sweet Kingdom', SWEETS),
  scene('s-city', 'Thành phố xe cộ', 'Busy City', CITY),
  scene('s-fairy', 'Khu vườn cổ tích', 'Fairy Garden', FAIRY),
];

/** Chuyển động mặc định cho tranh phụ huynh tải lên (không biết trước bố cục). */
export const GENERIC_ANIM: AnimPart[] = [
  { kind: 'breathe', cx: 800, cy: 620, rx: 620, ry: 620, amp: 0.025, speed: 2.4 },
  { kind: 'sway', cx: 250, cy: 500, rx: 260, ry: 420, amp: 10, speed: 1.4 },
  { kind: 'sway', cx: 1350, cy: 500, rx: 260, ry: 420, amp: 10, speed: 1.5, phase: 2 },
];
