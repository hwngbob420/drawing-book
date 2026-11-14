import { AnimKind } from '../types';

/**
 * SceneDecisionTree — cây gợi ý 3 x 3 x 3 cho Xưởng Phép Thuật.
 * Bước 1: 3 nhóm (bé trai / bé gái / trung tính), mỗi nhóm 3 "ngôi sao chính".
 * Bước 2: mỗi ngôi sao có đúng 3 bạn đồng hành ăn nhập.
 * Bước 3: mỗi ngôi sao có 3 không gian nền phù hợp.
 * Nguồn hình: 'n:' = Noto Emoji, 'o:' = OpenMoji (xem scripts/extract-assets.mjs).
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
  meadow: { vi: 'Đồng cỏ hoa nắng', en: 'Sunny meadow', icon: 'n:1f33b', tint: '#d6f5c6' },
  night: { vi: 'Bầu trời sao', en: 'Starry night', icon: 'n:1f319', tint: '#d9d2ff' },
  sea: { vi: 'Đáy biển', en: 'Under the sea', icon: 'n:1fab8', tint: '#c9ecff' },
  forest: { vi: 'Khu rừng xanh', en: 'Green forest', icon: 'n:1f333', tint: '#c9f2d0' },
  city: { vi: 'Thành phố', en: 'City', icon: 'n:1f3e2', tint: '#ffe9a8' },
  beach: { vi: 'Bãi biển', en: 'Beach', icon: 'n:1f30a', tint: '#bfe9ff' },
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
    svgs: [{ s: 'n:1f996', anim: 'hop' }],
    companions: [
      one('volcano', 'Núi lửa', 'Volcano', 'n:1f30b'),
      { id: 'eggs', vi: 'Trứng nở', en: 'Hatching eggs', svgs: [{ s: 'n:1f423', anim: 'hop' }, { s: 'n:1f95a', rel: 0.7, anim: 'hop' }] },
      one('dragon', 'Thằn lằn bay', 'Flying lizard', 'n:1f409', { sky: true, anim: 'drift' }),
    ],
    backdrops: ['forest', 'meadow', 'night'],
  },
  {
    group: 'boy',
    id: 'rocket',
    vi: 'Tên lửa',
    en: 'Rocket',
    svgs: [{ s: 'n:1f680', anim: 'hop' }],
    sky: true,
    companions: [
      one('astronaut', 'Phi hành gia', 'Astronaut', 'n:1f9d1_200d_1f680', { sky: true, anim: 'drift' }),
      one('saturn', 'Sao Thổ', 'Saturn', 'n:1fa90', { sky: true, anim: 'spin' }),
      one('ufo', 'Đĩa bay', 'UFO', 'n:1f6f8', { sky: true, anim: 'drift' }),
    ],
    backdrops: ['night', 'city', 'meadow'],
  },
  {
    group: 'boy',
    id: 'firetruck',
    vi: 'Xe cứu hoả',
    en: 'Fire truck',
    svgs: [{ s: 'n:1f692', anim: 'hop' }],
    companions: [
      one('heli', 'Trực thăng', 'Helicopter', 'n:1f681', { sky: true, anim: 'drift' }),
      { id: 'firedog', vi: 'Cún cứu hoả', en: 'Fire dog', svgs: [{ s: 'n:1f436', anim: 'breathe', hat: { s: 'n:26d1', rel: 0.62, dx: 0, dy: -0.4 } }] },
      { id: 'signs', vi: 'Đèn giao thông', en: 'Traffic light', svgs: [{ s: 'n:1f6a6' }, { s: 'n:1f6d1', rel: 0.6 }] },
    ],
    backdrops: ['city', 'meadow', 'forest'],
  },
  // ---------------- Bé gái: cổ tích & mộng mơ
  {
    group: 'girl',
    id: 'unicorn',
    vi: 'Kỳ lân',
    en: 'Unicorn',
    svgs: [{ s: 'n:1f984', anim: 'breathe' }],
    companions: [
      one('castle', 'Lâu đài', 'Castle', 'n:1f3f0'),
      { id: 'rainbow', vi: 'Cầu vồng', en: 'Rainbow', sky: true, svgs: [{ s: 'n:1f308' }, { s: 'n:2601', rel: 0.55, anim: 'drift' }] },
      { id: 'mushrooms', vi: 'Nấm thần tiên', en: 'Fairy mushrooms', svgs: [{ s: 'n:1f344', anim: 'hop' }, { s: 'n:1f344', rel: 0.62, anim: 'hop' }] },
    ],
    backdrops: ['meadow', 'night', 'forest'],
  },
  {
    group: 'girl',
    id: 'fairy',
    vi: 'Nàng tiên',
    en: 'Fairy',
    svgs: [{ s: 'n:1f9da', anim: 'drift' }],
    sky: true,
    companions: [
      one('bigflower', 'Bông hoa lớn', 'Giant flower', 'n:1f33a', { anim: 'sway' }),
      { id: 'butterflies', vi: 'Đàn bướm', en: 'Butterflies', sky: true, svgs: [{ s: 'n:1f98b', anim: 'flutter' }, { s: 'n:1f98b', rel: 0.7, anim: 'flutter' }, { s: 'n:1f98b', rel: 0.55, anim: 'flutter' }] },
      { id: 'wand', vi: 'Đũa phép', en: 'Magic wand', sky: true, svgs: [{ s: 'n:1fa84', anim: 'sway' }, { s: 'n:2b50', rel: 0.5, anim: 'breathe' }] },
    ],
    backdrops: ['meadow', 'forest', 'night'],
  },
  {
    group: 'girl',
    id: 'queencat',
    vi: 'Mèo vương miện',
    en: 'Queen kitty',
    svgs: [{ s: 'n:1f431', anim: 'breathe', hat: { s: 'n:1f451', rel: 0.55, dx: 0, dy: -0.52 } }],
    companions: [
      one('cake', 'Bánh kem', 'Birthday cake', 'n:1f382'),
      { id: 'yarn', vi: 'Cuộn len & cá', en: 'Yarn & fish', svgs: [{ s: 'n:1f9f6', anim: 'spin' }, { s: 'n:1f41f', rel: 0.7, anim: 'hop' }] },
      { id: 'pumpkin', vi: 'Xe bí ngô', en: 'Pumpkin coach', svgs: [{ s: 'n:1f383' }, { s: 'n:1f40e', rel: 0.95, anim: 'hop' }] },
    ],
    backdrops: ['meadow', 'night', 'forest'],
  },
  // ---------------- Trung tính: thú cưng & thiên nhiên
  {
    group: 'neutral',
    id: 'puppy',
    vi: 'Cún con',
    en: 'Puppy',
    svgs: [{ s: 'n:1f415', anim: 'breathe' }],
    companions: [
      { id: 'house', vi: 'Nhà & khúc xương', en: 'House & bone', svgs: [{ s: 'n:1f3e1' }, { s: 'n:1f9b4', rel: 0.4, anim: 'hop' }] },
      { id: 'birds', vi: 'Bướm & chim', en: 'Butterfly & bird', sky: true, svgs: [{ s: 'n:1f426', anim: 'hop' }, { s: 'n:1f98b', rel: 0.75, anim: 'flutter' }] },
      { id: 'ball', vi: 'Bóng & cầu vồng', en: 'Ball & rainbow', svgs: [{ s: 'n:1f308' }, { s: 'n:26bd', rel: 0.45, anim: 'hop' }] },
    ],
    backdrops: ['meadow', 'forest', 'city'],
  },
  {
    group: 'neutral',
    id: 'dolphin',
    vi: 'Cá heo',
    en: 'Dolphin',
    svgs: [{ s: 'n:1f42c', anim: 'hop' }],
    sky: true,
    companions: [
      { id: 'turtle', vi: 'Rùa & bạch tuộc', en: 'Turtle & octopus', svgs: [{ s: 'n:1f422', anim: 'drift' }, { s: 'n:1f419', rel: 0.85, anim: 'breathe' }] },
      { id: 'ship', vi: 'Tàu khám phá', en: 'Explorer ship', sky: true, svgs: [{ s: 'n:1f6a2', anim: 'drift' }] },
      { id: 'reef', vi: 'San hô & vỏ sò', en: 'Coral & shell', svgs: [{ s: 'n:1fab8', anim: 'sway' }, { s: 'n:1f41a', rel: 0.45 }, { s: 'n:1f980', rel: 0.5, anim: 'hop' }] },
    ],
    backdrops: ['sea', 'beach', 'night'],
  },
  {
    group: 'neutral',
    id: 'panda',
    vi: 'Gấu trúc',
    en: 'Panda',
    svgs: [{ s: 'n:1f43c', anim: 'breathe' }],
    companions: [
      { id: 'balloons', vi: 'Bóng bay', en: 'Balloons', sky: true, svgs: [{ s: 'n:1f388', anim: 'sway' }, { s: 'n:1f388', rel: 0.75, anim: 'sway' }] },
      { id: 'bamboo', vi: 'Tre & chim', en: 'Bamboo & bird', svgs: [{ s: 'n:1f38d' }, { s: 'n:1f426', rel: 0.55, anim: 'hop' }] },
      { id: 'treats', vi: 'Kem & bánh', en: 'Ice cream & cake', svgs: [{ s: 'n:1f366', anim: 'sway' }, { s: 'n:1f370', rel: 0.75 }] },
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
