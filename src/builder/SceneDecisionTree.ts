import { AnimKind } from '../types';

/**
 * SceneDecisionTree — cây gợi ý 3 x 3 x 3 cho Xưởng Phép Thuật.
 * Bước 1: 3 nhóm (bé trai / bé gái / trung tính), mỗi nhóm 3 "ngôi sao chính".
 * Bước 2: mỗi ngôi sao có đúng 3 bạn đồng hành ăn nhập — mỗi bạn là MỘT hình (luật 1 chính – 1 phụ).
 * Bước 3: mỗi ngôi sao có 3 không gian nền phù hợp.
 * Nguồn hình: 's:<tên>' = bộ hình sách tranh tự vẽ (public/svg/story, sinh bằng: node scripts/storybook/index.mjs).
 */

export interface PieceSvg {
  s: string;
  /** Kích thước tương đối so với các hình khác trong cùng mảnh ghép (mặc định 1). */
  rel?: number;
  anim?: AnimKind;
  /** Món đồ đội lên đầu (vương miện, mũ...). */
  hat?: { s: string; rel: number; dx: number; dy: number };
}

export interface Piece {
  id: string;
  vi: string;
  en: string;
  svgs: PieceSvg[];
  /** Bay lơ lửng trên cao thay vì đứng trên mặt đất. */
  sky?: boolean;
}

export type BackdropId = 'meadow' | 'night' | 'sea' | 'forest' | 'city' | 'beach';

export interface Hero extends Piece {
  group: 'boy' | 'girl' | 'neutral';
  companions: [Piece, Piece, Piece];
  backdrops: [BackdropId, BackdropId, BackdropId];
}

export const BACKDROPS: Record<BackdropId, { vi: string; en: string; icon: string; tint: string }> = {
  meadow: { vi: 'Đồng cỏ hoa nắng', en: 'Sunny meadow', icon: 'g:flower', tint: '#d6f5c6' },
  night: { vi: 'Bầu trời sao', en: 'Starry night', icon: 'g:moon', tint: '#d9d2ff' },
  sea: { vi: 'Đáy biển', en: 'Under the sea', icon: 'g:turtle', tint: '#c9ecff' },
  forest: { vi: 'Khu rừng xanh', en: 'Green forest', icon: 'g:tree', tint: '#c9f2d0' },
  city: { vi: 'Thành phố', en: 'City', icon: 'g:house', tint: '#ffe9a8' },
  beach: { vi: 'Bãi biển', en: 'Beach', icon: 'g:sun', tint: '#bfe9ff' },
};

const one = (id: string, vi: string, en: string, s: string, extra: Partial<Piece> & { anim?: AnimKind } = {}): Piece => ({
  id,
  vi,
  en,
  svgs: [{ s, anim: extra.anim }],
  sky: extra.sky,
});

const C = {
  butterfly: () => one('butterfly', 'Bạn bướm', 'Butterfly', 'g:butterfly', { sky: true, anim: 'flutter' }),
  bird: () => one('bird', 'Chim nhỏ', 'Little bird', 'g:bird', { anim: 'hop' }),
  hedgehog: () => one('hedgehog', 'Nhím con', 'Hedgehog', 'g:hedgehog', { anim: 'breathe' }),
  duckling: () => one('duckling', 'Vịt con', 'Duckling', 'g:duckling', { anim: 'hop' }),
  snail: () => one('snail', 'Ốc sên', 'Snail', 'g:snail', { anim: 'sway' }),
  ladybug: () => one('ladybug', 'Bọ rùa', 'Ladybug', 'g:ladybug', { anim: 'hop' }),
  turtle: () => one('turtle', 'Rùa con', 'Turtle', 'g:turtle', { anim: 'breathe' }),
  frog: () => one('frog', 'Ếch con', 'Frog', 'g:frog', { anim: 'hop' }),
  flower: () => one('flower', 'Bông hoa lớn', 'Giant flower', 'g:flower', { anim: 'sway' }),
  tree: () => one('tree', 'Cây táo', 'Apple tree', 'g:tree', { anim: 'sway' }),
  mushroom: () => one('mushroom', 'Nấm thần tiên', 'Fairy mushroom', 'g:mushroom', { anim: 'hop' }),
  star: () => one('star', 'Ngôi sao', 'Star', 'g:star', { sky: true, anim: 'breathe' }),
  moon: () => one('moon', 'Trăng khuyết', 'Moon', 'g:moon', { sky: true, anim: 'sway' }),
  balloon: () => one('balloon', 'Bóng bay', 'Balloon', 'g:balloon', { sky: true, anim: 'sway' }),
  rainbow: () => one('rainbow', 'Cầu vồng', 'Rainbow', 'g:rainbow', { sky: true }),
  house: () => one('house', 'Ngôi nhà', 'House', 'g:house'),
};

export const HEROES: Hero[] = [
  // ---------------- Nhóm 1: phiêu lưu
  { group: 'boy', id: 'dino', vi: 'Khủng long', en: 'Dino', svgs: [{ s: 'g:dino', anim: 'hop' }], companions: [C.turtle(), C.butterfly(), C.mushroom()], backdrops: ['forest', 'meadow', 'night'] },
  { group: 'boy', id: 'astronaut', vi: 'Phi hành gia', en: 'Astronaut', svgs: [{ s: 'g:astronaut', anim: 'drift' }], sky: true, companions: [C.star(), C.moon(), C.balloon()], backdrops: ['night', 'city', 'meadow'] },
  { group: 'boy', id: 'elephant', vi: 'Voi con', en: 'Elephant', svgs: [{ s: 'g:elephant', anim: 'breathe' }], companions: [C.balloon(), C.bird(), C.snail()], backdrops: ['meadow', 'beach', 'forest'] },
  // ---------------- Nhóm 2: cổ tích
  { group: 'girl', id: 'bunny', vi: 'Thỏ con', en: 'Bunny', svgs: [{ s: 'g:bunny', anim: 'hop' }], companions: [C.ladybug(), C.flower(), C.butterfly()], backdrops: ['meadow', 'forest', 'night'] },
  { group: 'girl', id: 'kitten', vi: 'Mèo con', en: 'Kitten', svgs: [{ s: 'g:kitten', anim: 'breathe' }], companions: [C.duckling(), C.house(), C.balloon()], backdrops: ['meadow', 'night', 'city'] },
  { group: 'girl', id: 'fox', vi: 'Cáo con', en: 'Fox', svgs: [{ s: 'g:fox', anim: 'sway' }], companions: [C.hedgehog(), C.tree(), C.bird()], backdrops: ['forest', 'meadow', 'night'] },
  // ---------------- Nhóm 3: thú cưng & thiên nhiên
  { group: 'neutral', id: 'puppy', vi: 'Cún con', en: 'Puppy', svgs: [{ s: 'g:puppy', anim: 'breathe' }], companions: [C.house(), C.duckling(), C.balloon()], backdrops: ['meadow', 'forest', 'city'] },
  { group: 'neutral', id: 'bear', vi: 'Gấu con', en: 'Bear cub', svgs: [{ s: 'g:bear', anim: 'breathe' }], companions: [C.flower(), C.bird(), C.rainbow()], backdrops: ['forest', 'meadow', 'beach'] },
  { group: 'neutral', id: 'panda', vi: 'Gấu trúc', en: 'Panda', svgs: [{ s: 'g:panda', anim: 'breathe' }], companions: [C.frog(), C.balloon(), C.mushroom()], backdrops: ['forest', 'meadow', 'night'] },
];

export const GROUPS: Hero['group'][] = ['boy', 'girl', 'neutral'];

export function heroesOf(group: Hero['group']): Hero[] {
  return HEROES.filter((h) => h.group === group);
}

export function findHero(id: string): Hero | undefined {
  return HEROES.find((h) => h.id === id);
}

/** Bộ 3 thẻ ở Bước 1: mỗi nhóm một nhân vật, xoay vòng theo `rotation`. */
export function heroTrio(rotation: number): Hero[] {
  return GROUPS.map((g) => {
    const list = heroesOf(g);
    return list[((rotation % list.length) + list.length) % list.length];
  });
}
