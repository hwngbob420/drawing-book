import { AnimKind } from '../types';

/**
 * SceneDecisionTree — cây gợi ý 3 x 3 x 3 cho Xưởng Phép Thuật.
 * Bước 1: 3 nhóm (bé trai / bé gái / trung tính), mỗi nhóm 3 "ngôi sao chính".
 * Bước 2: mỗi ngôi sao có đúng 3 bạn đồng hành ăn nhập.
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
      { id: 'eggs', vi: 'Trứng nở', en: 'Hatching eggs', svgs: [{ s: 's:chick2', anim: 'hop' }, { s: 's:egg', rel: 0.7, anim: 'hop' }] },
      one('dragon', 'Thằn lằn bay', 'Flying lizard', 's:dragon', { sky: true, anim: 'drift' }),
    ],
    backdrops: ['forest', 'meadow', 'night'],
  },
  {
    group: 'boy',
    id: 'rocket',
    vi: 'Tên lửa',
    en: 'Rocket',
    svgs: [{ s: 's:rocket', anim: 'hop' }],
    sky: true,
    companions: [
      one('astronaut', 'Phi hành gia', 'Astronaut', 's:astronaut', { sky: true, anim: 'drift' }),
      one('saturn', 'Sao Thổ', 'Saturn', 's:planet', { sky: true, anim: 'spin' }),
      one('ufo', 'Đĩa bay', 'UFO', 's:ufo', { sky: true, anim: 'drift' }),
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
      { id: 'firedog', vi: 'Cún cứu hoả', en: 'Fire dog', svgs: [{ s: 's:puppy', anim: 'breathe', hat: { s: 's:helmet', rel: 0.62, dx: 0, dy: -0.4 } }] },
      { id: 'signs', vi: 'Đèn giao thông', en: 'Traffic light', svgs: [{ s: 's:trafficlight' }, { s: 's:stopsign', rel: 0.6 }] },
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
      { id: 'rainbow', vi: 'Cầu vồng', en: 'Rainbow', sky: true, svgs: [{ s: 's:rainbow' }, { s: 's:cloud', rel: 0.55, anim: 'drift' }] },
      { id: 'mushrooms', vi: 'Nấm thần tiên', en: 'Fairy mushrooms', svgs: [{ s: 's:mushroom', anim: 'hop' }, { s: 's:mushroom', rel: 0.62, anim: 'hop' }] },
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
      { id: 'butterflies', vi: 'Đàn bướm', en: 'Butterflies', sky: true, svgs: [{ s: 's:butterfly', anim: 'flutter' }, { s: 's:butterfly', rel: 0.8, anim: 'flutter' }, { s: 's:butterfly', rel: 0.7, anim: 'flutter' }] },
      { id: 'wand', vi: 'Đũa phép', en: 'Magic wand', sky: true, svgs: [{ s: 's:wand', anim: 'sway' }, { s: 's:twinkle', rel: 0.5, anim: 'breathe' }] },
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
      one('cake', 'Bánh kem', 'Birthday cake', 's:cake'),
      { id: 'yarn', vi: 'Cuộn len & cá', en: 'Yarn & fish', svgs: [{ s: 's:yarn', anim: 'spin' }, { s: 's:fish', rel: 0.7, anim: 'hop' }] },
      { id: 'pumpkin', vi: 'Xe bí ngô', en: 'Pumpkin coach', svgs: [{ s: 's:pumpkin' }, { s: 's:horse', rel: 0.95, anim: 'hop' }] },
    ],
    backdrops: ['meadow', 'night', 'forest'],
  },
  // ---------------- Trung tính: thú cưng & thiên nhiên
  {
    group: 'neutral',
    id: 'puppy',
    vi: 'Cún con',
    en: 'Puppy',
    svgs: [{ s: 's:puppy', anim: 'breathe' }],
    companions: [
      { id: 'house', vi: 'Nhà & khúc xương', en: 'House & bone', svgs: [{ s: 's:house' }, { s: 's:bone', rel: 0.4, anim: 'hop' }] },
      { id: 'birds', vi: 'Bướm & chim', en: 'Butterfly & bird', sky: true, svgs: [{ s: 's:bird', anim: 'hop' }, { s: 's:butterfly', rel: 0.75, anim: 'flutter' }] },
      { id: 'ball', vi: 'Bóng & cầu vồng', en: 'Ball & rainbow', svgs: [{ s: 's:rainbow' }, { s: 's:ball', rel: 0.45, anim: 'hop' }] },
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
      { id: 'turtle', vi: 'Rùa & bạch tuộc', en: 'Turtle & octopus', svgs: [{ s: 's:turtle', anim: 'drift' }, { s: 's:octopus', rel: 0.85, anim: 'breathe' }] },
      { id: 'ship', vi: 'Tàu khám phá', en: 'Explorer ship', sky: true, svgs: [{ s: 's:ship', anim: 'drift' }] },
      { id: 'reef', vi: 'San hô & vỏ sò', en: 'Coral & shell', svgs: [{ s: 's:coral', anim: 'sway' }, { s: 's:shell', rel: 0.55 }, { s: 's:crab', rel: 0.65, anim: 'hop' }] },
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
      { id: 'balloons', vi: 'Bóng bay', en: 'Balloons', sky: true, svgs: [{ s: 's:balloon', anim: 'sway' }, { s: 's:balloon', rel: 0.75, anim: 'sway' }] },
      { id: 'bamboo', vi: 'Tre & chim', en: 'Bamboo & bird', svgs: [{ s: 's:bamboo' }, { s: 's:bird', rel: 0.55, anim: 'hop' }] },
      { id: 'treats', vi: 'Kem & bánh', en: 'Ice cream & cake', svgs: [{ s: 's:icecream', anim: 'sway' }, { s: 's:cupcake', rel: 0.75 }] },
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
