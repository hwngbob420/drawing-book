import { Artwork, AnimPart, ART_W, ART_H } from '../types';
import { SceneLayer, Pen, composeScene, sceneAnim, ground } from '../engine/SceneComposer';
import { TEMPLATES, Template } from '../builder/LayoutTemplates';
import { AnimKind } from '../types';

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


type Slot = Template['props'][number]['slot'];
const SLOT_STICKER: Record<Slot, string> = { sun: 'g:sun', cloud: 'g:cloud2', flower: 'g:flower', tree: 'g:tree', star: 'g:star', butterfly: 'g:butterfly', balloon: 'g:balloon' };
const SLOT_ANIM: Record<Slot, AnimKind> = { sun: 'spin', cloud: 'drift', flower: 'sway', tree: 'sway', star: 'breathe', butterfly: 'flutter', balloon: 'sway' };

/**
 * Dựng một bức tranh từ khung bố cục Codex (LayoutTemplates): mây -> đồi -> chi tiết nền -> bạn đồng hành -> nhân vật chính.
 * `swap` đổi hình của một loại chi tiết (ví dụ ban đêm: sun -> moon).
 */
function fromTemplate(t: Template, main: [string, AnimKind], comp: [string, AnimKind], swap: Partial<Record<Slot, string>> = {}, drop: Slot[] = []): SceneLayer[] {
  const layers: SceneLayer[] = [];
  t.clouds.forEach((c, i) => layers.push({ s: i % 2 ? 'g:cloud2' : 'g:cloud1', x: c.x, y: c.y, size: Math.max(250, c.size * 1.6), anim: 'drift', amp: i % 2 ? -18 : 22 }));
  layers.push((p: Pen) => t.hills.forEach((hl, i) => p.shape(hill(hl.y, hl.amp * 2, hl.tilt / 9 + i * 1.3))));
  // nền thoáng: tối đa 2 chi tiết nền để vùng tô to và không rối
  t.props.filter((pr) => !drop.includes(pr.slot) && pr.slot !== 'cloud').slice(0, 2).forEach((pr) => {
    layers.push({ s: swap[pr.slot] ?? SLOT_STICKER[pr.slot], x: pr.x, y: pr.y, size: Math.max(230, pr.size * 1.9), anim: SLOT_ANIM[pr.slot], rot: pr.slot === 'butterfly' ? 0.2 : 0 });
  });
  layers.push({ s: comp[0], x: t.companion.x, y: t.companion.y, size: t.companion.size * 1.05, flip: t.companion.flip, anim: comp[1] });
  layers.push({ s: main[0], x: t.main.x, y: t.main.y, size: t.main.size, flip: t.main.flip, anim: main[1] });
  return layers;
}
const L = TEMPLATES.landscape;

function scene(id: string, title: string, titleEn: string, layers: SceneLayer[]): Artwork {
  return { id, title, titleEn, builtIn: true, anim: sceneAnim(layers), render: () => composeScene(layers) };
}

export const BUILT_IN_ARTWORKS: Artwork[] = [
  scene('g-bunny', 'Thỏ con và bọ rùa', 'Bunny and Ladybug', fromTemplate(L[0], ['g:bunny', 'hop'], ['g:ladybug', 'hop'])),
  scene('g-fox', 'Cáo con và nhím', 'Fox and Hedgehog', fromTemplate(L[1], ['g:fox', 'sway'], ['g:hedgehog', 'breathe'], { star: 'g:flower' })),
  scene('g-bear', 'Gấu con dưới vườn táo', 'Bear in the Orchard', fromTemplate(L[2], ['g:bear', 'breathe'], ['g:bird', 'hop'])),
  scene('g-elephant', 'Voi con và bóng bay', 'Elephant and Balloons', fromTemplate(L[3], ['g:elephant', 'breathe'], ['g:duckling', 'hop'])),
  scene('g-puppy', 'Cún con và ếch xanh', 'Puppy and Frog', fromTemplate(L[4], ['g:puppy', 'breathe'], ['g:frog', 'hop'])),
  scene('g-panda', 'Gấu trúc và ốc sên', 'Panda and Snail', fromTemplate(L[5], ['g:panda', 'breathe'], ['g:snail', 'sway'])),
  scene('g-kitten', 'Mèo con và rùa', 'Kitten and Turtle', fromTemplate(L[6], ['g:kitten', 'breathe'], ['g:turtle', 'breathe'])),
  scene('g-dino', 'Khủng long dưới trăng', 'Dino Under the Moon', fromTemplate(L[7], ['g:dino', 'hop'], ['g:mushroom', 'hop'], { sun: 'g:moon', flower: 'g:star' })),
  scene('g-astronaut', 'Phi hành gia và vì sao', 'Astronaut and Star', fromTemplate(L[1], ['g:astronaut', 'drift'], ['g:star', 'breathe'], { sun: 'g:moon', star: 'g:star', butterfly: 'g:star', flower: 'g:star' }, ['tree'])),
  scene('g-duck', 'Vịt con ngày nắng', 'Sunny Duckling', fromTemplate(TEMPLATES.landscape[2], ['g:duckling', 'hop'], ['g:ladybug', 'hop'], { tree: 'g:flower' })),
  scene('g-hedgehog', 'Nhím con và nấm', 'Hedgehog and Mushroom', fromTemplate(TEMPLATES.landscape[5], ['g:hedgehog', 'breathe'], ['g:mushroom', 'hop'])),
];

/** Chuyển động mặc định cho tranh phụ huynh tải lên (không biết trước bố cục). */
export const GENERIC_ANIM: AnimPart[] = [
  { kind: 'breathe', cx: 800, cy: 620, rx: 620, ry: 620, amp: 0.025, speed: 2.4 },
  { kind: 'sway', cx: 250, cy: 500, rx: 260, ry: 420, amp: 10, speed: 1.4 },
  { kind: 'sway', cx: 1350, cy: 500, rx: 260, ry: 420, amp: 10, speed: 1.5, phase: 2 },
];
