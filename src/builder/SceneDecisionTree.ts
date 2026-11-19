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
  meadow: { vi: 'Đồng cỏ hoa nắng', en: 'Sunny meadow', icon: 's:sunflower', tint: '#d6f5c6' },
  night: { vi: 'Bầu trời sao', en: 'Starry night', icon: 's:moon', tint: '#d9d2ff' },
  sea: { vi: 'Đáy biển', en: 'Under the sea', icon: 's:coral', tint: '#c9ecff' },
  forest: { vi: 'Khu rừng xanh', en: 'Green forest', icon: 's:tree', tint: '#c9f2d0' },
  city: { vi: 'Thành phố', en: 'City', icon: 's:building', tint: '#ffe9a8' },
  beach: { vi: 'Bãi biển', en: 'Beach', icon: 's:wave', tint: '#bfe9ff' },
};

const one = (id: string, vi: string, en: string, s: string, extra: Partial<Piece> & { anim?: AnimKind } = {}): Piece => ({
  id,
  vi,
  en,
  svgs: [{ s, anim: extra.anim }],
  sky: extra.sky,
});

export const HEROES: Hero[] = [
  // ---------------- Bé trai: phiêu lưu & sức mạnh
  {
    group: 'boy',
    id: 'trex',
    vi: 'Khủng long',
    en: 'T-Rex',
    svgs: [{ s: 's:trex', anim: 'hop' }],
    companions: [
      one('volcano', 'Núi lửa', 'Volcano', 's:volcano'),
      one('eggs', 'Trứng nở', 'Hatching egg', 's:chick2', { anim: 'hop' }),
      one('dragon', 'Thằn lằn bay', 'Flying lizard', 's:dragon', { sky: true, anim: 'drift' }),
    ],
    backdrops: ['forest', 'meadow', 'night'],
  },
  {
    group: 'boy',
    id: 'rocket',
    vi: 'Tên lửa',
    en: 'Rocket',
    svgs: [{ s: 'a:rocket', anim: 'hop' }],
    sky: true,
    companions: [
      one('astronaut', 'Phi hành gia', 'Astronaut', 's:astronaut', { sky: true, anim: 'drift' }),
      one('saturn', 'Sao Thổ', 'Saturn', 's:planet', { sky: true, anim: 'spin' }),
      one('ufo', 'Đĩa bay', 'UFO', 'a:ufo', { sky: true, anim: 'drift' }),
    ],
    backdrops: ['night', 'city', 'meadow'],
  },
  {
    group: 'boy',
    id: 'firetruck',
    vi: 'Xe cứu hoả',
    en: 'Fire truck',
    svgs: [{ s: 's:firetruck', anim: 'hop' }],
    companions: [
      one('heli', 'Trực thăng', 'Helicopter', 's:helicopter', { sky: true, anim: 'drift' }),
      one('firedog', 'Cún con', 'Puppy', 'a:dog', { anim: 'breathe' }),
      one('signs', 'Đèn giao thông', 'Traffic light', 's:trafficlight'),
    ],
    backdrops: ['city', 'meadow', 'forest'],
  },
  // ---------------- Bé gái: cổ tích & mộng mơ
  {
    group: 'girl',
    id: 'unicorn',
    vi: 'Kỳ lân',
    en: 'Unicorn',
    svgs: [{ s: 's:unicorn', anim: 'breathe' }],
    companions: [
      one('castle', 'Lâu đài', 'Castle', 's:castle'),
      one('rainbow', 'Cầu vồng', 'Rainbow', 'a:rainbow', { sky: true }),
      one('mushrooms', 'Nấm thần tiên', 'Fairy mushroom', 'a:mushroom', { anim: 'hop' }),
    ],
    backdrops: ['meadow', 'night', 'forest'],
  },
  {
    group: 'girl',
    id: 'fairy',
    vi: 'Nàng tiên',
    en: 'Fairy',
    svgs: [{ s: 's:fairy', anim: 'drift' }],
    sky: true,
    companions: [
      one('bigflower', 'Bông hoa lớn', 'Giant flower', 's:flower', { anim: 'sway' }),
      one('butterflies', 'Bạn bướm', 'Butterfly', 's:butterfly', { sky: true, anim: 'flutter' }),
      one('wand', 'Đũa phép', 'Magic wand', 's:wand', { sky: true, anim: 'sway' }),
    ],
    backdrops: ['meadow', 'forest', 'night'],
  },
  {
    group: 'girl',
    id: 'queencat',
    vi: 'Mèo vương miện',
    en: 'Queen kitty',
    svgs: [{ s: 's:cat', anim: 'breathe', hat: { s: 's:crown', rel: 0.55, dx: 0, dy: -0.52 } }],
    companions: [
      one('cake', 'Bánh cupcake', 'Cupcake', 'a:cupcake'),
      one('yarn', 'Cuộn len', 'Yarn ball', 's:yarn', { anim: 'spin' }),
      one('pumpkin', 'Xe bí ngô', 'Pumpkin coach', 's:pumpkin'),
    ],
    backdrops: ['meadow', 'night', 'forest'],
  },
  // ---------------- Trung tính: thú cưng & thiên nhiên
  {
    group: 'neutral',
    id: 'puppy',
    vi: 'Cún con',
    en: 'Puppy',
    svgs: [{ s: 'a:dog', anim: 'breathe' }],
    companions: [
      one('house', 'Ngôi nhà', 'House', 's:house'),
      one('birds', 'Gà con', 'Chick', 'a:chick', { anim: 'hop' }),
      one('ball', 'Quả bóng', 'Ball', 's:ball', { anim: 'hop' }),
    ],
    backdrops: ['meadow', 'forest', 'city'],
  },
  {
    group: 'neutral',
    id: 'dolphin',
    vi: 'Cá heo',
    en: 'Dolphin',
    svgs: [{ s: 's:dolphin', anim: 'hop' }],
    sky: true,
    companions: [
      one('turtle', 'Bạch tuộc', 'Octopus', 'a:octopus', { anim: 'breathe' }),
      { id: 'ship', vi: 'Tàu khám phá', en: 'Explorer ship', sky: true, svgs: [{ s: 's:ship', anim: 'drift' }] },
      one('reef', 'Kỳ lân biển', 'Narwhal', 'a:narwhal', { anim: 'drift' }),
    ],
    backdrops: ['sea', 'beach', 'night'],
  },
  {
    group: 'neutral',
    id: 'panda',
    vi: 'Gấu trúc',
    en: 'Panda',
    svgs: [{ s: 's:panda', anim: 'breathe' }],
    companions: [
      one('balloons', 'Bóng bay', 'Balloon', 's:balloon', { sky: true, anim: 'sway' }),
      one('bamboo', 'Gấu mèo', 'Raccoon', 'a:raccoon', { anim: 'breathe' }),
      one('treats', 'Bánh vòng', 'Donut', 'a:donut', { anim: 'spin' }),
    ],
    backdrops: ['forest', 'meadow', 'night'],
  },
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
