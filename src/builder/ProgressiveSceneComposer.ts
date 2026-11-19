import { SVG } from '@svgdotjs/svg.js';
import potpack from 'potpack';
import { AnimKind, Artwork, Orient, sheetSize } from '../types';
import { SceneItem, SceneLayer, Pen, composeScene, sceneAnim, loadSvgText, ground, circle, rrect } from '../engine/SceneComposer';
import { mulberry32 } from '../engine/PatternGenerator';
import { BackdropId, Piece, PieceSvg, findHero, BACKDROPS } from './SceneDecisionTree';

/**
 * ProgressiveSceneComposer — lắp 3 lựa chọn của bé thành một bức tranh.
 *
 *  - svg.js đo khung bao THỰC (`bbox()`) của từng hình SVG (hình luôn có lề
 *    thừa quanh hình), nhờ đó nhân vật đứng đúng trên mặt đất và việc kiểm tra
 *    va chạm dùng kích thước thật.
 *  - potpack xếp các hình trong MỘT mảnh ghép nhiều hình (ví dụ rùa + bạch
 *    tuộc, đàn bướm) thành cụm gọn, không chồng nhau.
 *  - Anchor Zones riêng cho khổ ngang và khổ dọc quyết định vị trí nhân vật
 *    chính, bạn đồng hành và các chi tiết nền; chi tiết nền nào chạm vào nhân
 *    vật thì bị loại.
 *  - Mọi thứ phụ thuộc vào `seed`, nên bấm xúc xắc là có bố cục khác và cùng
 *    một công thức luôn dựng lại đúng bức tranh cũ.
 */

export interface Recipe {
  orient: Orient;
  hero: string;
  comp: string;
  bg: BackdropId;
  seed: number;
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

// ---------------------------------------------------------------- đo hình bằng svg.js

/** Khung bao thực của hình, tính theo tỉ lệ so với khung vuông viewBox (0..1). */
const tightCache = new Map<string, Promise<Rect>>();

function measure(src: string): Promise<Rect> {
  let p = tightCache.get(src);
  if (!p) {
    p = loadSvgText(src).then((text) => {
      const host = document.createElement('div');
      host.style.cssText = 'position:absolute;left:-9999px;top:0;width:128px;height:128px;visibility:hidden';
      document.body.append(host);
      try {
        const draw = SVG().addTo(host).size(128, 128);
        draw.svg(text);
        const root = draw.findOne('svg') as any;
        const vb = root.viewbox();
        let box: any = null;
        for (const child of root.children()) {
          if (['defs', 'style', 'metadata', 'title', 'desc'].includes(child.type)) continue;
          const b = child.bbox();
          if (!b.width || !b.height) continue;
          box = box ? box.merge(b) : b;
        }
        if (!box) return { x: 0, y: 0, w: 1, h: 1 };
        const m = vb.width * 0.02; // chừa chỗ cho nét viền
        const x0 = Math.max(0, (box.x - vb.x - m) / vb.width);
        const y0 = Math.max(0, (box.y - vb.y - m) / vb.height);
        const x1 = Math.min(1, (box.x2 - vb.x + m) / vb.width);
        const y1 = Math.min(1, (box.y2 - vb.y + m) / vb.height);
        return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
      } catch {
        return { x: 0, y: 0, w: 1, h: 1 };
      } finally {
        host.remove();
      }
    });
    tightCache.set(src, p);
  }
  return p;
}

// ---------------------------------------------------------------- mảnh ghép -> cụm hình

interface Part {
  s: string;
  /** vị trí khung vuông của hình trong hệ toạ độ cụm (đơn vị: rel=1 -> 1) */
  sq: Rect;
  tight: Rect;
  anim?: AnimKind;
}

interface Cluster {
  parts: Part[];
  w: number;
  h: number;
}

async function clusterOf(piece: Piece, rnd: () => number): Promise<Cluster> {
  // 1. mỗi hình (kèm món đội đầu nếu có) thành một khối có khung bao thực
  const blocks: { parts: Part[]; w: number; h: number; x?: number; y?: number }[] = [];
  for (const sv of piece.svgs) blocks.push(await blockOf(sv));
  // 2. potpack xếp các khối thành cụm gọn (có khe hở giữa các khối)
  const gap = 0.06;
  if (blocks.length > 1 && rnd() < 0.5) blocks.reverse();
  const boxes = blocks.map((b) => ({ w: b.w + gap, h: b.h + gap, x: 0, y: 0, b }));
  const stats = potpack(boxes);
  const parts: Part[] = [];
  for (const box of boxes) {
    // potpack dồn lên trên; ta thả từng khối xuống đáy hàng để chúng cùng "đứng" trên một mặt đất
    const dy = stats.h - gap - (box.y + box.b.h);
    const sameRow = boxes.every((o) => o === box || o.x >= box.x + box.w - 1e-6 || o.x + o.w <= box.x + 1e-6);
    for (const p of box.b.parts) {
      const sq = { ...p.sq, x: p.sq.x + box.x, y: p.sq.y + box.y + (sameRow ? dy : 0) };
      parts.push({ ...p, sq, tight: { ...p.tight, x: p.tight.x + box.x, y: p.tight.y + box.y + (sameRow ? dy : 0) } });
    }
  }
  return { parts, w: stats.w - gap, h: stats.h - gap };
}

async function blockOf(sv: PieceSvg): Promise<{ parts: Part[]; w: number; h: number }> {
  const rel = sv.rel ?? 1;
  const t = await measure(sv.s);
  const list: Part[] = [{ s: sv.s, sq: { x: 0, y: 0, w: rel, h: rel }, tight: { x: t.x * rel, y: t.y * rel, w: t.w * rel, h: t.h * rel }, anim: sv.anim }];
  if (sv.hat) {
    const ht = await measure(sv.hat.s);
    const hs = rel * sv.hat.rel;
    const cx = rel * (0.5 + sv.hat.dx);
    const cy = rel * (0.5 + sv.hat.dy);
    const sq = { x: cx - hs / 2, y: cy - hs / 2, w: hs, h: hs };
    list.push({ s: sv.hat.s, sq, tight: { x: sq.x + ht.x * hs, y: sq.y + ht.y * hs, w: ht.w * hs, h: ht.h * hs }, anim: sv.anim });
  }
  // dời về gốc theo khung bao thực của cả khối
  const x0 = Math.min(...list.map((p) => p.tight.x));
  const y0 = Math.min(...list.map((p) => p.tight.y));
  const x1 = Math.max(...list.map((p) => p.tight.x + p.tight.w));
  const y1 = Math.max(...list.map((p) => p.tight.y + p.tight.h));
  for (const p of list) {
    p.sq.x -= x0;
    p.sq.y -= y0;
    p.tight.x -= x0;
    p.tight.y -= y0;
  }
  return { parts: list, w: x1 - x0, h: y1 - y0 };
}

/** Đặt cụm vào tranh: scale k (px cho 1 đơn vị), góc trên trái (ox, oy). */
function place(c: Cluster, k: number, ox: number, oy: number, flip: boolean): { items: SceneItem[]; boxes: Rect[]; bounds: Rect } {
  const items: SceneItem[] = [];
  const boxes: Rect[] = [];
  for (const p of c.parts) {
    const sqx = flip ? c.w - (p.sq.x + p.sq.w) : p.sq.x;
    const tx = flip ? c.w - (p.tight.x + p.tight.w) : p.tight.x;
    items.push({ s: p.s, x: ox + (sqx + p.sq.w / 2) * k, y: oy + (p.sq.y + p.sq.h / 2) * k, size: p.sq.w * k, flip, anim: p.anim });
    boxes.push({ x: ox + tx * k, y: oy + p.tight.y * k, w: p.tight.w * k, h: p.tight.h * k });
  }
  return { items, boxes, bounds: { x: ox, y: oy, w: c.w * k, h: c.h * k } };
}

const hit = (a: Rect, b: Rect, pad = 0) => a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;

// ---------------------------------------------------------------- không gian nền

interface Backdrop {
  back: SceneLayer[];
  /** chi tiết nhỏ: chỉ giữ lại nếu không chạm nhân vật */
  props: SceneItem[];
  /** mặt đất phía trước (nơi nhân vật chính đứng) và phía xa */
  groundY: number;
  farY: number;
}

function hill(w: number, h: number, y: number, amp: number, phase: number): Path2D {
  const a = amp * Math.sin(phase);
  const b = amp * Math.cos(phase * 1.7);
  return ground(
    [-30, y + a],
    [
      [w * 0.2, y - amp + b, w * 0.4, y - amp * 0.4 - a, w * 0.6, y + b * 0.5],
      [w * 0.75, y + amp * 0.5 + a, w * 0.9, y - amp * 0.3, w + 30, y - b],
    ],
    w,
    h,
  );
}

function backdrop(id: BackdropId, w: number, h: number, rnd: () => number): Backdrop {
  const u = Math.min(w, h) / 1200;
  const portrait = h > w;
  const near = h * (portrait ? 0.74 : 0.8);
  const far = h * (portrait ? 0.5 : 0.62);
  const ph = rnd() * 6;
  const sunLeft = rnd() < 0.5;
  /** toạ độ x tính từ phía có mặt trời/trăng (f = 0.84 là sát mép phía đó) */
  const sx = (f: number) => (sunLeft ? 1 - f : f) * w;
  const it = (s: string, fx: number, fy: number, size: number, anim?: AnimKind, extra: Partial<SceneItem> = {}): SceneItem => ({ s, x: fx * w, y: fy * h, size: size * u, anim, ...extra });
  const hills = (p: Pen) => {
    p.shape(hill(w, h, far, 46 * u, ph));
    p.shape(hill(w, h, near, 40 * u, ph + 2));
  };
  // Nền sách tranh "thoáng": 2–3 đường đồi + 1–2 đám mây khác dáng; không mặt trời cười, không hàng hoa dàn ngang.
  const clouds = (n: number): SceneItem[] =>
    ['s:cloud', 's:cloud2', 's:cloud3']
      .sort(() => rnd() - 0.5)
      .slice(0, n)
      .map((s, i) => ({ s, x: sx(i ? 0.24 + rnd() * 0.1 : 0.78 - rnd() * 0.1), y: h * ((portrait ? 0.07 : 0.11) + rnd() * 0.06), size: (230 + rnd() * 70) * u, anim: 'drift' as AnimKind }));

  switch (id) {
    case 'meadow':
      return {
        back: [...clouds(2), hills],
        props: [],
        groundY: near + (h - near) * 0.22,
        farY: far + 12 * u,
      };
    case 'forest':
      return {
        back: [
          ...clouds(1),
          (p) => p.shape(hill(w, h, far, 46 * u, ph)),
          // rừng = hai cây khác dáng ở xa, hai bên khung (không lặp một hình)
          { s: rnd() < 0.5 ? 's:tree2' : 's:tree3', x: w * 0.1, y: far - 120 * u, size: 460 * u, anim: 'sway' },
          { s: 's:pine', x: w * 0.9, y: far - 100 * u, size: 400 * u, anim: 'sway' },
          (p) => p.shape(hill(w, h, near, 40 * u, ph + 2)),
        ],
        props: [],
        groundY: near + (h - near) * 0.22,
        farY: far + 12 * u,
      };
    case 'night': {
      const stars: SceneItem[] = [];
      const cols = portrait ? 3 : 5;
      for (let i = 0; i < cols; i++) {
        const cx = ((i % cols) + 0.5) / cols + (rnd() - 0.5) * 0.1;
        const cy = (portrait ? 0.06 : 0.08) + Math.floor(i / cols) * (portrait ? 0.17 : 0.2) + rnd() * 0.06;
        stars.push({ s: 's:twinkle', x: cx * w, y: cy * h, size: (110 + rnd() * 70) * u, rot: (rnd() - 0.5) * 0.8, anim: 'breathe', amp: 0.12, speed: 4 + rnd() * 2 });
      }
      return {
        back: [(p) => p.shape(hill(w, h, near + 30 * u, 50 * u, ph))],
        // trăng đứng đầu danh sách để các ngôi sao tự tránh nó
        props: [{ s: 's:moon', x: sx(0.86), y: h * (portrait ? 0.09 : 0.15), size: 300 * u, anim: 'sway' }, ...stars],
        groundY: near + (h - near) * 0.5,
        farY: near + 40 * u,
      };
    }
    case 'sea':
      return {
        back: [
          (p) => {
            p.shape(hill(w, h, h * 0.86, 30 * u, ph));
            for (let i = 0; i < 4; i++) p.shape(circle(w * (0.12 + i * 0.26 + rnd() * 0.05), h * (0.93 + rnd() * 0.04), (16 + rnd() * 8) * u));
          },
        ],
        props: [
          { s: 's:seaweed', x: w * 0.9, y: h * 0.82, size: 340 * u, anim: 'sway' },
          it('s:bubble', 0.14, 0.12, 190, 'hop'),
        ],
        groundY: h * 0.9,
        farY: h * 0.88,
      };
    case 'beach': {
      const sea = h * (portrait ? 0.46 : 0.5);
      const sand = h * (portrait ? 0.76 : 0.78);
      return {
        back: [
          ...clouds(2),
          (p) => {
            // mặt biển lượn sóng + bãi cát
            const wave = new Path2D();
            wave.moveTo(-30, sea);
            const n = portrait ? 5 : 7;
            for (let i = 0; i < n; i++) {
              const x0 = (w / n) * i;
              wave.quadraticCurveTo(x0 + w / n / 4, sea - 34 * u, x0 + w / n / 2, sea);
              wave.quadraticCurveTo(x0 + (w / n) * 0.75, sea + 34 * u, x0 + w / n, sea);
            }
            wave.lineTo(w + 30, sea);
            wave.lineTo(w + 30, h + 30);
            wave.lineTo(-30, h + 30);
            wave.closePath();
            p.shape(wave);
            p.shape(hill(w, h, sand, 34 * u, ph));
          },
          { s: 's:palm', x: sx(0.9), y: sand - 150 * u, size: 520 * u, flip: !sunLeft, anim: 'sway' },
        ],
        props: [],
        groundY: sand + (h - sand) * 0.5,
        farY: sand + 10 * u,
      };
    }
    case 'city': {
      const road = h * (portrait ? 0.74 : 0.76);
      const street = h * (portrait ? 0.5 : 0.56);
      return {
        back: [
          ...clouds(1),
          (p) => {
            const b = (x: number, top: number, bw: number) => {
              p.shape(new Path2D(`M${x} ${top} H${x + bw} V${street} H${x} Z`));
              for (let yy = top + 30 * u; yy + 52 * u < street - 20 * u; yy += 85 * u) for (let xx = x + 24 * u; xx + 46 * u <= x + bw - 16 * u; xx += 70 * u) p.shape(rrect(xx, yy, 46 * u, 52 * u, 8 * u));
            };
            const n = portrait ? 4 : 6;
            for (let i = 0; i < n; i++) b((w / n) * i + 14 * u, street - (220 + rnd() * 200) * u, w / n - 28 * u);
            p.shape(new Path2D(`M-30 ${street} H${w + 30} V${h + 30} H-30 Z`));
            p.shape(new Path2D(`M-30 ${road} H${w + 30} V${h + 30} H-30 Z`));
            const mid = road + (h - road) * 0.78;
            for (let x = 40 * u; x < w; x += 260 * u) p.shape(rrect(x, mid, 130 * u, 26 * u, 13 * u));
          },
        ],
        props: [],
        groundY: road + (h - road) * 0.55,
        farY: road - 6 * u,
      };
    }
  }
}

// ---------------------------------------------------------------- lắp ráp

export async function buildScene(r: Recipe): Promise<{ layers: SceneLayer[]; w: number; h: number }> {
  const hero = findHero(r.hero);
  if (!hero) throw new Error('Không có nhân vật ' + r.hero);
  const comp = hero.companions.find((c) => c.id === r.comp) ?? hero.companions[0];
  const [w, h] = sheetSize(r.orient);
  const portrait = r.orient === 'p';
  const rnd = mulberry32(r.seed * 7919 + 13);
  const mirror = rnd() < 0.5;
  const bg = backdrop(r.bg, w, h, rnd);
  const hc = await clusterOf(hero, rnd);
  const cc = await clusterOf(comp, rnd);
  const heroFly = !!hero.sky;
  const compFly = !!comp.sky;
  const floaty = r.bg === 'sea';

  // --- Anchor Zones: [tâm x, vùng rộng, vùng cao] theo tỉ lệ khung hình
  const jx = (rnd() - 0.5) * 0.05;
  let hz: { cx: number; zw: number; zh: number };
  let cz: { cx: number; zw: number; zh: number };
  if (portrait) {
    hz = { cx: 0.46 + jx, zw: 0.74, zh: 0.38 };
    cz = { cx: 0.58 - jx, zw: 0.6, zh: 0.25 };
  } else {
    hz = { cx: 0.33 + jx, zw: 0.44, zh: 0.66 };
    cz = { cx: 0.77 - jx * 0.5, zw: 0.32, zh: 0.46 };
  }
  const X = (f: number) => (mirror ? 1 - f : f) * w;
  const fitK = (c: Cluster, z: { zw: number; zh: number }) => Math.min((z.zw * w) / c.w, (z.zh * h) / c.h);

  let hk = fitK(hc, hz);
  let ck = fitK(cc, cz) * (0.9 + rnd() * 0.1);
  // Khổ dọc, cả hai cùng đứng trên mặt đất: bạn đồng hành đứng trên đồi xa phía sau.
  // Nếu khoảng giữa hai tầng đất quá hẹp so với nhân vật thì chuyển sang đứng cạnh nhau.
  let sideBySide = false;
  if (portrait && !heroFly && !compFly && !floaty) {
    const room = bg.groundY - bg.farY - 30;
    if (room >= h * 0.24) hk = Math.min(hk, room / hc.h);
    else {
      sideBySide = true;
      hz = { cx: 0.33 + jx, zw: 0.56, zh: 0.36 };
      cz = { cx: 0.79, zw: 0.34, zh: 0.24 };
      hk = fitK(hc, hz);
      ck = fitK(cc, cz);
    }
  }

  const heroPos = (k: number): [number, number] => {
    const bw = hc.w * k;
    const bh = hc.h * k;
    let y: number;
    if (portrait) {
      if (heroFly || floaty) y = h * (compFly || !floaty ? 0.6 : 0.36) - bh / 2;
      else y = bg.groundY - bh;
      if (heroFly && !compFly && !floaty) y = h * 0.3 - bh / 2; // nhân vật bay phía trên, bạn đứng dưới đất
    } else y = heroFly || floaty ? h * 0.47 - bh / 2 : bg.groundY - bh;
    return [X(hz.cx) - bw / 2, y];
  };
  const compPos = (k: number): [number, number] => {
    const bw = cc.w * k;
    const bh = cc.h * k;
    let y: number;
    if (portrait) {
      if (heroFly && !compFly && !floaty) y = bg.groundY - bh;
      else if (compFly) y = h * 0.2 - bh / 2;
      else if (floaty) y = (heroFly ? bg.groundY : h * 0.2 + bh / 2) - bh;
      else y = (sideBySide ? bg.groundY : bg.farY) - bh; // đứng trên ngọn đồi phía xa (hoặc cạnh nhân vật chính)
      if (floaty && !compFly) y = bg.groundY - bh;
    } else y = compFly ? h * 0.3 - bh / 2 : bg.groundY - h * 0.02 - bh;
    return [X(cz.cx) - bw / 2, y];
  };

  // --- chống chồng lấn: đẩy bạn đồng hành ra xa / thu nhỏ dần cho tới khi hai khung bao rời nhau
  const pad = 14;
  let H = place(hc, hk, ...heroPos(hk), mirror);
  let C = place(cc, ck, ...compPos(ck), mirror);
  const clampIn = (b: { bounds: Rect }, pos: [number, number]): [number, number] => [Math.max(pad, Math.min(w - b.bounds.w - pad, pos[0])), Math.max(pad, Math.min(h - b.bounds.h - pad, pos[1]))];
  let cpos = clampIn(C, compPos(ck));
  let hpos = clampIn(H, heroPos(hk));
  H = place(hc, hk, ...hpos, mirror);
  C = place(cc, ck, ...cpos, mirror);
  const overlaps = () => H.boxes.some((a) => C.boxes.some((b) => hit(a, b, pad)));
  for (let i = 0; i < 40 && overlaps(); i++) {
    // đẩy ra phía xa nhân vật chính theo chiều còn chỗ, hết chỗ thì thu nhỏ
    const dcx = C.bounds.x + C.bounds.w / 2 - (H.bounds.x + H.bounds.w / 2);
    const dir = Math.abs(dcx) < w * 0.05 ? 0 : dcx > 0 ? 1 : -1;
    const room = dir > 0 ? w - pad - (C.bounds.x + C.bounds.w) : dir < 0 ? C.bounds.x - pad : 0;
    if (dir !== 0 && room > 4) cpos = [cpos[0] + dir * Math.min(room, w * 0.03), cpos[1]];
    else {
      ck *= 0.93;
      if (i > 20) hk *= 0.96;
      hpos = clampIn(place(hc, hk, 0, 0, mirror), heroPos(hk));
      const np = compPos(ck);
      cpos = clampIn(place(cc, ck, 0, 0, mirror), dir === 0 ? np : [cpos[0], np[1]]);
    }
    H = place(hc, hk, ...hpos, mirror);
    C = place(cc, ck, ...cpos, mirror);
  }

  // --- chi tiết nền: bỏ những món chạm vào nhân vật hoặc chạm nhau
  const taken: Rect[] = [...H.boxes, ...C.boxes];
  const props: SceneItem[] = [];
  for (const p of bg.props) {
    const box = { x: p.x - p.size * 0.4, y: p.y - p.size * 0.4, w: p.size * 0.8, h: p.size * 0.8 };
    if (taken.some((t) => hit(t, box, 6))) continue;
    taken.push(box);
    props.push(p);
  }

  // nhân vật chính luôn có chuyển động; đồng hành dùng chuyển động khai báo sẵn
  const layers: SceneLayer[] = [...bg.back, ...props, ...C.items, ...H.items];
  return { layers, w, h };
}

export function recipeTitle(r: Recipe): string {
  const hero = findHero(r.hero);
  return hero ? `${hero.vi} · ${BACKDROPS[r.bg].vi}` : 'Tranh của bé';
}

/** Biến công thức thành một Artwork tô được (dựng lại y hệt mỗi lần mở). */
export function recipeToArtwork(id: string, r: Recipe): Artwork {
  let cache: Promise<{ layers: SceneLayer[]; w: number; h: number }> | null = null;
  const built = () => (cache ??= buildScene(r));
  const art: Artwork = {
    id,
    title: recipeTitle(r),
    titleEn: 'My scene',
    builtIn: false,
    orient: r.orient,
    anim: [],
    render: async () => {
      const s = await built();
      art.anim = sceneAnim(s.layers);
      return composeScene(s.layers, s.w, s.h);
    },
  };
  return art;
}
