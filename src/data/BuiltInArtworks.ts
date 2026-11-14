import { Artwork, AnimPart } from '../types';
import { SceneLayer, Pen, composeScene, sceneAnim, ground, curve, poly, rrect, circle } from '../engine/SceneComposer';

/**
 * 8 bức tranh bối cảnh, ghép từ SVG Noto Emoji ('n:') và OpenMoji ('o:').
 * Mỗi lớp: { s: nguồn, x, y: tâm hình, size: cạnh khung vuông (px trên tranh
 * 1600x1200), rot, flip, anim } hoặc một hàm vẽ nét nền. Lớp sau che lớp trước.
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

const PUPPY: SceneLayer[] = [
  { s: 'n:1f31e', x: 1350, y: 210, size: 360, anim: 'spin' },
  { s: 'o:2601', x: 340, y: 180, size: 320, anim: 'drift' },
  { s: 'o:2601', x: 860, y: 140, size: 250, anim: 'drift', amp: -20 },
  hills(750, 965),
  { s: 'n:1f333', x: 235, y: 570, size: 540, anim: 'sway', amp: 12 },
  (p) => {
    p.grass(120, 1120, 1.2);
    p.grass(900, 1150, 1.1);
    p.grass(1560, 1020, 1);
    p.grass(1240, 860, 0.9);
    p.grass(520, 850, 0.9);
  },
  { s: 'n:1f98b', x: 1140, y: 470, size: 230, rot: 0.3, anim: 'flutter' },
  { s: 'n:1f98b', x: 560, y: 370, size: 170, rot: -0.35, anim: 'flutter' },
  { s: 'n:1f415', x: 800, y: 790, size: 640, anim: 'breathe' },
  { s: 'n:1f33b', x: 1410, y: 900, size: 360, anim: 'sway' },
  { s: 'n:1f337', x: 390, y: 1010, size: 280, anim: 'sway' },
  { s: 'n:1f33c', x: 1130, y: 1060, size: 210, anim: 'sway', amp: 8 },
  { s: 'n:1f33c', x: 150, y: 960, size: 170, anim: 'sway', amp: 8 },
  { s: 'n:1f41e', x: 640, y: 1110, size: 140, rot: 0.4, anim: 'hop', amp: 10 },
];

const DINO: SceneLayer[] = [
  { s: 'n:1f31e', x: 200, y: 190, size: 310, anim: 'spin' },
  { s: 'o:2601', x: 700, y: 150, size: 270, anim: 'drift' },
  { s: 'n:1f30b', x: 1260, y: 500, size: 600 },
  hills(760, 975),
  { s: 'n:1f334', x: 240, y: 620, size: 640, anim: 'sway', amp: 12 },
  { s: 'n:1f334', x: 1500, y: 800, size: 400, flip: true, anim: 'sway', amp: 12 },
  (p) => {
    p.grass(520, 1130, 1.2);
    p.grass(1000, 1150, 1.1);
    p.grass(1440, 1110, 1);
  },
  { s: 'n:1f995', x: 770, y: 700, size: 780, anim: 'breathe', amp: 0.03 },
  { s: 'n:1f996', x: 1250, y: 960, size: 340, flip: true, anim: 'hop' },
  { s: 'n:1f95a', x: 330, y: 1040, size: 210, rot: -0.2, anim: 'hop', amp: 12, speed: 5 },
];

const SPACE: SceneLayer[] = [
  (p) => {
    for (const [x, y] of [
      [760, 230],
      [1180, 480],
      [430, 660],
      [1480, 780],
      [880, 930],
      [90, 330],
      [1130, 90],
    ]) {
      p.line(poly([[x - 15, y], [x + 15, y]], false), poly([[x, y - 15], [x, y + 15]], false));
    }
  },
  { s: 'n:2b50', x: 560, y: 130, size: 150, rot: 0.2, anim: 'breathe', amp: 0.12, speed: 4 },
  { s: 'n:2b50', x: 940, y: 150, size: 120, rot: -0.3, anim: 'breathe', amp: 0.12, speed: 5 },
  { s: 'n:2b50', x: 1500, y: 600, size: 150, rot: 0.4, anim: 'breathe', amp: 0.12, speed: 4.4 },
  { s: 'n:2b50', x: 110, y: 590, size: 130, rot: -0.2, anim: 'breathe', amp: 0.12, speed: 4.8 },
  { s: 'n:2b50', x: 610, y: 1080, size: 150, rot: 0.3, anim: 'breathe', amp: 0.12, speed: 4.2 },
  { s: 'n:2b50', x: 1010, y: 1090, size: 120, rot: -0.4 },
  { s: 'n:1fa90', x: 310, y: 290, size: 440, anim: 'spin', amp: 0.12 },
  { s: 'n:1f30d', x: 1350, y: 950, size: 380, anim: 'spin', amp: 0.35, speed: 0.8 },
  { s: 'n:1f319', x: 230, y: 910, size: 320, anim: 'sway', amp: 10 },
  { s: 'n:1f6f8', x: 1310, y: 290, size: 390, anim: 'drift', amp: 28, speed: 1.6 },
  { s: 'n:1f680', x: 690, y: 580, size: 660, anim: 'hop', amp: 22, speed: 2.4 },
  { s: 'n:1f9d1_200d_1f680', x: 1090, y: 650, size: 350, rot: 0.15, anim: 'drift', amp: 16, speed: 1.3 },
];

const OCEAN: SceneLayer[] = [
  { s: 'o:1FAE7', x: 1130, y: 190, size: 230, anim: 'hop', amp: 20, speed: 1.6 },
  { s: 'o:1FAE7', x: 130, y: 200, size: 190, flip: true, anim: 'hop', amp: 18, speed: 1.9 },
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
    p.shape(circle(700, 1130, 22), circle(1320, 1150, 18), circle(60, 1120, 20));
  },
  { s: 'n:1fab8', x: 220, y: 900, size: 440, anim: 'sway', amp: 10 },
  { s: 'n:1fab8', x: 1430, y: 930, size: 380, flip: true, anim: 'sway', amp: 10 },
  { s: 'n:1f420', x: 300, y: 430, size: 270, anim: 'drift' },
  { s: 'n:1f41f', x: 1400, y: 380, size: 230, anim: 'drift', amp: -24 },
  { s: 'n:1f42c', x: 740, y: 400, size: 640, anim: 'hop', amp: 24, speed: 2.2 },
  { s: 'n:1f419', x: 1130, y: 720, size: 400, anim: 'breathe', amp: 0.06 },
  { s: 'n:1f422', x: 600, y: 850, size: 420, anim: 'drift', amp: 20, speed: 1.2 },
  { s: 'n:1f980', x: 930, y: 1080, size: 240, anim: 'hop', amp: 12, speed: 4 },
  { s: 'n:1f41a', x: 1180, y: 1100, size: 170, rot: 0.3 },
];

const FARM: SceneLayer[] = [
  { s: 'n:1f308', x: 1090, y: 560, size: 980 },
  { s: 'n:1f31e', x: 210, y: 200, size: 310, anim: 'spin' },
  { s: 'o:2601', x: 700, y: 150, size: 270, anim: 'drift' },
  hills(740, 960),
  { s: 'n:1f3e1', x: 310, y: 570, size: 470 },
  { s: 'n:1f333', x: 1400, y: 610, size: 420, anim: 'sway', amp: 12 },
  (p) => {
    p.grass(80, 1120, 1.1);
    p.grass(1500, 1100, 1.1);
    p.grass(700, 870, 0.9);
  },
  { s: 'n:1f416', x: 1340, y: 950, size: 360, flip: true, anim: 'breathe' },
  { s: 'n:1f408', x: 540, y: 930, size: 410, anim: 'breathe' },
  { s: 'n:1f407', x: 930, y: 880, size: 400, anim: 'hop', amp: 22 },
  { s: 'n:1f425', x: 730, y: 1070, size: 220, anim: 'hop', amp: 14, speed: 5 },
  { s: 'n:1f424', x: 1130, y: 1090, size: 190, anim: 'hop', amp: 12, speed: 4.4 },
  { s: 'n:1f33c', x: 200, y: 1050, size: 190, anim: 'sway', amp: 8 },
];

const SWEETS: SceneLayer[] = [
  (p) => {
    // dây cờ sinh nhật
    const rope = (x: number) => 70 + Math.sin((x / 1600) * Math.PI) * 90;
    p.line(curve([[-20, 60], [400, 150], [800, 165], [1200, 150], [1620, 60]]));
    for (let x = 120; x < 1560; x += 190) {
      const y = rope(x) - 6;
      p.shape(poly([[x - 52, y], [x + 52, y + (rope(x + 52) - rope(x - 52)) + 0], [x, y + 120]]));
    }
    // mặt bàn
    p.shape(new Path2D('M-30 900 H1630 V1230 H-30 Z'));
  },
  { s: 'n:1f352', x: 150, y: 440, size: 250, anim: 'sway', amp: 10 },
  { s: 'n:1f36d', x: 1420, y: 420, size: 340, rot: 0.2, anim: 'spin', amp: 0.2 },
  { s: 'n:1f382', x: 800, y: 600, size: 680, anim: 'breathe', amp: 0.025 },
  { s: 'n:1f366', x: 330, y: 700, size: 480, anim: 'sway', amp: 10 },
  { s: 'n:1f9c1', x: 1270, y: 780, size: 440, anim: 'hop', amp: 14 },
  { s: 'n:1f369', x: 560, y: 1040, size: 290, anim: 'spin', amp: 0.25 },
  { s: 'n:1f353', x: 980, y: 1050, size: 260, rot: 0.15, anim: 'hop', amp: 12, speed: 4 },
  { s: 'n:1f36c', x: 170, y: 1060, size: 230, anim: 'spin', amp: 0.3 },
  { s: 'n:1f36c', x: 1440, y: 1080, size: 200, flip: true, anim: 'spin', amp: 0.3 },
];

const CITY: SceneLayer[] = [
  { s: 'n:1f31e', x: 180, y: 170, size: 280, anim: 'spin' },
  { s: 'o:2601', x: 560, y: 330, size: 250, anim: 'drift' },
  { s: 'o:2601', x: 1420, y: 140, size: 260, anim: 'drift', amp: -22 },
  { s: 'n:2708', x: 1050, y: 190, size: 390, anim: 'drift', amp: 30, speed: 1.2 },
  { s: 'n:1f681', x: 520, y: 130, size: 270, anim: 'drift', amp: 20, speed: 1.8 },
  (p) => {
    // dãy nhà phía xa
    const b = (x: number, y: number, w: number) => {
      const body = new Path2D(`M${x} ${y} H${x + w} V760 H${x} Z`);
      p.shape(body);
      for (let yy = y + 30; yy < 700; yy += 85) for (let xx = x + 24; xx + 46 <= x + w - 16; xx += 70) p.shape(rrect(xx, yy, 46, 52, 8));
    };
    b(620, 520, 170);
    b(790, 500, 190);
    b(1400, 480, 180);
    // đường ray + đường phố
    p.shape(new Path2D('M-30 760 H1630 V1230 H-30 Z'));
    p.shape(new Path2D('M-30 900 H1630 V1230 H-30 Z'));
    for (let x = 40; x < 1600; x += 260) p.shape(rrect(x, 1048, 130, 26, 13));
  },
  { s: 'n:1f3e2', x: 290, y: 510, size: 540 },
  { s: 'n:1f682', x: 1130, y: 660, size: 520, anim: 'hop', amp: 8, speed: 6 },
  { s: 'n:1f6a6', x: 660, y: 760, size: 300 },
  { s: 'n:1f692', x: 430, y: 960, size: 520, anim: 'hop', amp: 10, speed: 5 },
  { s: 'n:1f697', x: 1200, y: 1040, size: 380, anim: 'drift', amp: 26, speed: 1.5 },
];

const FAIRY: SceneLayer[] = [
  { s: 'n:1f308', x: 560, y: 560, size: 980, flip: true },
  { s: 'o:2601', x: 1330, y: 150, size: 290, anim: 'drift' },
  { s: 'n:2b50', x: 900, y: 120, size: 130, rot: 0.2, anim: 'breathe', amp: 0.12, speed: 4 },
  { s: 'n:2b50', x: 1080, y: 250, size: 100, rot: -0.3, anim: 'breathe', amp: 0.12, speed: 5 },
  hills(760, 970),
  { s: 'n:1f3f0', x: 1180, y: 540, size: 620, anim: 'breathe', amp: 0.018 },
  (p) => {
    p.grass(90, 900, 0.9);
    p.grass(900, 1140, 1.1);
    p.grass(1540, 1130, 1);
  },
  { s: 'n:1f98b', x: 330, y: 330, size: 210, rot: -0.3, anim: 'flutter' },
  { s: 'n:1f98b', x: 860, y: 430, size: 160, rot: 0.3, anim: 'flutter' },
  { s: 'n:1f984', x: 520, y: 780, size: 680, anim: 'breathe' },
  { s: 'n:1f344', x: 1130, y: 1010, size: 300, anim: 'hop', amp: 10 },
  { s: 'n:1f344', x: 1330, y: 1070, size: 190, anim: 'hop', amp: 8, speed: 4 },
  { s: 'n:1f337', x: 1480, y: 920, size: 270, anim: 'sway' },
  { s: 'n:1f337', x: 130, y: 1040, size: 240, flip: true, anim: 'sway' },
];

function scene(id: string, title: string, titleEn: string, layers: SceneLayer[]): Artwork {
  return { id, title, titleEn, builtIn: true, anim: sceneAnim(layers), render: () => composeScene(layers) };
}

export const BUILT_IN_ARTWORKS: Artwork[] = [
  scene('s-puppy', 'Chú cún và đồng cỏ nắng', 'Sunny Meadow Puppy', PUPPY),
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
