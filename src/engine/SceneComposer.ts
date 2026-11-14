import { AnimKind, AnimPart, ART_W, ART_H, makeCanvas, ctx2d } from '../types';

/**
 * SceneComposer — Bộ Ghép Tranh Vector.
 *
 * Mỗi bức tranh là một danh sách lớp xếp từ sau ra trước; lớp là một hình SVG
 * (Noto Emoji / OpenMoji, đã trích sẵn vào `public/svg/`) hoặc một hàm vẽ nền
 * đơn giản (đường đồi, mặt đất...). Với từng hình SVG, bộ ghép sẽ:
 *
 *  1. Chuẩn hoá: mọi mảng thành nền trắng #FFFFFF, viền đen #111111 dày đều,
 *     đầu nét bo tròn; chỉ các chi tiết nhỏ vốn tối màu (mắt, mũi) giữ mực đặc.
 *  2. Raster hoá rồi đổi "độ tối" thành kênh alpha -> lớp nét mực trong suốt.
 *  3. Tìm bóng (silhouette) của hình bằng cách loang từ mép ngoài trên bản đồ
 *     đã bịt khe hở, rồi xoá mọi nét nằm sau bóng đó -> hình trước che hình sau,
 *     các mảng luôn khép kín.
 */

export interface SceneItem {
  /** 'n:<mã>' = Noto Emoji, 'o:<mã>' = OpenMoji black. */
  s: string;
  x: number;
  y: number;
  size: number;
  rot?: number;
  flip?: boolean;
  anim?: AnimKind;
  amp?: number;
  speed?: number;
}
export type SceneLayer = SceneItem | ((p: Pen) => void);

export const INK = '#111111';
type Pt = [number, number];
const TAU = Math.PI * 2;

// ---------------------------------------------------------------- nét nền

export function circle(x: number, y: number, r: number): Path2D {
  const p = new Path2D();
  p.arc(x, y, r, 0, TAU);
  return p;
}
export function poly(pts: Pt[], closed = true): Path2D {
  const p = new Path2D();
  pts.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y)));
  if (closed) p.closePath();
  return p;
}
export function curve(pts: Pt[]): Path2D {
  const p = new Path2D();
  p.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length - 1; i++) {
    p.quadraticCurveTo(pts[i][0], pts[i][1], (pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2);
  }
  const l = pts[pts.length - 1];
  p.lineTo(l[0], l[1]);
  return p;
}
export function rrect(x: number, y: number, w: number, h: number, r: number): Path2D {
  const p = new Path2D();
  p.roundRect(x, y, w, h, r);
  return p;
}
/** Dải đất/đồi: đường cong phía trên, kéo kín xuống đáy tranh. */
export function ground(start: Pt, beziers: number[][], w = ART_W, h = ART_H): Path2D {
  const p = new Path2D();
  p.moveTo(start[0], start[1]);
  for (const b of beziers) p.bezierCurveTo(b[0], b[1], b[2], b[3], b[4], b[5]);
  p.lineTo(w + 30, h + 30);
  p.lineTo(-30, h + 30);
  p.closePath();
  return p;
}

/** Cây bút mực cho các nét nền. */
export class Pen {
  readonly c: CanvasRenderingContext2D;
  readonly w: number;
  readonly h: number;
  constructor(canvas: HTMLCanvasElement) {
    this.w = canvas.width;
    this.h = canvas.height;
    this.c = ctx2d(canvas);
    this.c.lineJoin = 'round';
    this.c.lineCap = 'round';
    this.c.strokeStyle = INK;
    this.c.fillStyle = INK;
    this.c.lineWidth = 8;
  }
  /** Hình kín: xoá nét bên dưới rồi viền đen. */
  shape(...paths: Path2D[]) {
    for (const p of paths) {
      this.c.globalCompositeOperation = 'destination-out';
      this.c.fill(p);
      this.c.globalCompositeOperation = 'source-over';
      this.c.stroke(p);
    }
  }
  line(...paths: Path2D[]) {
    for (const p of paths) this.c.stroke(p);
  }
  /** Nét chia mảng nằm gọn trong một hình. */
  lineIn(clip: Path2D, ...paths: Path2D[]) {
    this.c.save();
    this.c.clip(clip);
    for (const p of paths) this.c.stroke(p);
    this.c.restore();
  }
  grass(x: number, y: number, s = 1) {
    this.line(
      poly(
        [
          [x - 18 * s, y],
          [x - 10 * s, y - 30 * s],
          [x - 2 * s, y - 4 * s],
          [x + 6 * s, y - 36 * s],
          [x + 14 * s, y - 2 * s],
          [x + 24 * s, y - 24 * s],
        ],
        false,
      ),
    );
  }
}

// ---------------------------------------------------------------- SVG

const textCache = new Map<string, Promise<string>>();

/** Bản một-file-HTML nhúng sẵn toàn bộ SVG vào `window.__MCB_SVG__` (xem scripts/build-single.mjs). */
const embedded = (): Record<string, string> | undefined => (window as any).__MCB_SVG__;
const dataUrls = new Map<string, string>();

export function svgUrl(src: string): string {
  const text = embedded()?.[src];
  if (text) {
    let u = dataUrls.get(src);
    if (!u) dataUrls.set(src, (u = 'data:image/svg+xml;utf8,' + encodeURIComponent(text)));
    return u;
  }
  const [kind, code] = src.split(':');
  return `${import.meta.env.BASE_URL}svg/${kind === 'n' ? 'noto' : 'openmoji'}/${code}.svg`;
}

export function loadSvgText(src: string): Promise<string> {
  let p = textCache.get(src);
  if (!p) {
    const text = embedded()?.[src];
    p = text
      ? Promise.resolve(text)
      : fetch(svgUrl(src)).then((r) => {
          if (!r.ok) throw new Error('Thiếu SVG ' + src);
          return r.text();
        });
    textCache.set(src, p);
  }
  return p;
}

const SHAPES = 'path,circle,ellipse,rect,polygon,polyline,line';

function isDark(color: string): boolean {
  const m = color.match(/rgba?\(([^)]+)\)/);
  if (!m) return false;
  const [r, g, b] = m[1].split(',').map((v) => parseFloat(v));
  return r * 0.3 + g * 0.59 + b * 0.11 < 75;
}

/**
 * Chuẩn hoá một SVG về phong cách tranh tô màu.
 * @param strokePx độ dày nét mong muốn (pixel trên tranh) ở kích thước `size`
 */
export function normalizeSvg(text: string, src: string, size: number, strokePx: number): string {
  const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
  const svg = document.importNode(doc.documentElement, true) as unknown as SVGSVGElement;
  if (svg.nodeName !== 'svg') throw new Error('SVG lỗi: ' + src);
  const vb = (svg.getAttribute('viewBox') || '0 0 128 128').split(/[\s,]+/).map(Number);
  const unit = vb[2] || 128;
  const sw = ((strokePx * unit) / size).toFixed(2);
  const openmoji = src.startsWith('o:');

  // Gắn tạm vào trang để đọc được màu thật (class, style, kế thừa) và khung bao
  const host = document.createElement('div');
  host.style.cssText = 'position:absolute;left:-9999px;top:0;width:128px;height:128px;visibility:hidden;pointer-events:none';
  svg.setAttribute('width', '128');
  svg.setAttribute('height', '128');
  host.append(svg);
  document.body.append(host);
  try {
    const plan: [SVGGraphicsElement, string | null][] = [];
    svg.querySelectorAll<SVGGraphicsElement>(SHAPES).forEach((el) => {
      if (el.closest('defs,clipPath,mask,symbol,pattern,marker')) return;
      const cs = getComputedStyle(el);
      const noFill = cs.fill === 'none';
      if (noFill && cs.stroke === 'none') return plan.push([el, null]);
      let fill = '#FFFFFF';
      if (noFill) fill = 'none';
      else if (isDark(cs.fill)) {
        if (openmoji) fill = INK;
        else {
          const bb = el.getBBox();
          if (Math.max(bb.width, bb.height) < unit * 0.13) fill = INK; // mắt, mũi, chấm nhỏ
        }
      }
      plan.push([el, fill]);
    });
    for (const [el, fill] of plan) {
      if (fill === null) el.remove();
      else el.setAttribute('style', `fill:${fill};stroke:${INK};stroke-width:${sw};stroke-linecap:round;stroke-linejoin:round;opacity:1;fill-opacity:1;stroke-opacity:1`);
    }
    svg.querySelectorAll<SVGElement>('g,[opacity]').forEach((g) => {
      g.removeAttribute('opacity');
      if (g.style) g.style.opacity = '1';
    });
  } finally {
    host.remove();
  }
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.removeAttribute('style');
  return new XMLSerializer().serializeToString(svg);
}

function svgToImage(svg: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Không dựng được SVG'));
    };
    img.src = url;
  });
}

const SIL_GAP = 3;

/** Raster hoá một hình: trả về lớp nét mực trong suốt + mặt nạ bóng của hình. */
async function rasterize(src: string, size: number): Promise<{ ink: HTMLCanvasElement; sil: HTMLCanvasElement; pad: number }> {
  size = Math.round(size);
  const strokePx = Math.max(5, Math.min(8.5, size * 0.02));
  const img = await svgToImage(normalizeSvg(await loadSvgText(src), src, size, strokePx));
  const pad = 14;
  const w = size + pad * 2;
  const ink = makeCanvas(w, w);
  const c = ctx2d(ink, true);
  c.drawImage(img, pad, pad, size, size);
  const data = c.getImageData(0, 0, w, w);
  const d = data.data;
  const n = w * w;
  const open = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const lum = d[i * 4] * 0.3 + d[i * 4 + 1] * 0.59 + d[i * 4 + 2] * 0.11;
    const a = Math.round((d[i * 4 + 3] * (255 - lum)) / 238);
    d[i * 4] = 17;
    d[i * 4 + 1] = 17;
    d[i * 4 + 2] = 17;
    d[i * 4 + 3] = a > 255 ? 255 : a;
    open[i] = a < 110 ? 1 : 0;
  }
  c.putImageData(data, 0, 0);

  // bóng của hình: loang "bên ngoài" từ mép, trên bản đồ đã bịt khe hở
  let cur = open.slice();
  for (let it = 0; it < SIL_GAP; it++) {
    const nxt = cur.slice();
    for (let i = 0; i < n; i++) {
      if (!cur[i]) continue;
      const x = i % w;
      if ((x > 0 && !cur[i - 1]) || (x < w - 1 && !cur[i + 1]) || (i >= w && !cur[i - w]) || (i < n - w && !cur[i + w])) nxt[i] = 0;
    }
    cur = nxt;
  }
  const outside = new Uint8Array(n);
  const stack = new Int32Array(n);
  let sp = 0;
  const seed = (i: number) => {
    if (cur[i] && !outside[i]) {
      outside[i] = 1;
      stack[sp++] = i;
    }
  };
  for (let k = 0; k < w; k++) {
    seed(k);
    seed(n - w + k);
    seed(k * w);
    seed(k * w + w - 1);
  }
  const spread = (from: Uint8Array, limit: number) => {
    // loang 4 hướng trong `from`; limit > 0 = chỉ loang thêm `limit` bước
    let lo = 0;
    for (let step = 0; limit === 0 ? lo < sp : step < limit; step++) {
      const hi = limit === 0 ? lo + 1 : sp;
      for (; lo < hi; lo++) {
        const i = stack[lo];
        const x = i % w;
        if (x > 0 && from[i - 1] && !outside[i - 1]) (outside[i - 1] = 1), (stack[sp++] = i - 1);
        if (x < w - 1 && from[i + 1] && !outside[i + 1]) (outside[i + 1] = 1), (stack[sp++] = i + 1);
        if (i >= w && from[i - w] && !outside[i - w]) (outside[i - w] = 1), (stack[sp++] = i - w);
        if (i < n - w && from[i + w] && !outside[i + w]) (outside[i + w] = 1), (stack[sp++] = i + w);
      }
    }
  };
  spread(cur, 0);
  // nới phần "bên ngoài" trở lại sát nét mực
  sp = 0;
  for (let i = 0; i < n; i++) if (outside[i]) stack[sp++] = i;
  spread(open, SIL_GAP + 1);

  const sil = makeCanvas(w, w);
  const sc = ctx2d(sil);
  const sd = sc.createImageData(w, w);
  const px = new Uint32Array(sd.data.buffer);
  for (let i = 0; i < n; i++) if (!outside[i]) px[i] = 0xffffffff;
  sc.putImageData(sd, 0, 0);
  return { ink, sil, pad };
}

/** Ghép các lớp thành lớp nét mực hoàn chỉnh của một bức tranh. */
export async function composeScene(layers: SceneLayer[], w = ART_W, h = ART_H): Promise<HTMLCanvasElement> {
  const canvas = makeCanvas(w, h);
  const pen = new Pen(canvas);
  const c = pen.c;
  const rasters = await Promise.all(layers.map((l) => (typeof l === 'function' ? null : rasterize(l.s, l.size))));
  layers.forEach((l, i) => {
    if (typeof l === 'function') return l(pen);
    const r = rasters[i]!;
    const half = r.ink.width / 2;
    c.save();
    c.translate(l.x, l.y);
    if (l.rot) c.rotate(l.rot);
    if (l.flip) c.scale(-1, 1);
    c.globalCompositeOperation = 'destination-out';
    c.drawImage(r.sil, -half, -half);
    c.globalCompositeOperation = 'source-over';
    c.drawImage(r.ink, -half, -half);
    c.restore();
  });
  return canvas;
}

const ANIM_DEFAULTS: Record<AnimKind, [number, number]> = {
  breathe: [0.035, 2.6],
  drift: [24, 0.9],
  spin: [0.28, 1.2],
  sway: [16, 1.6],
  flutter: [0.4, 9],
  hop: [18, 3],
};

/** Sinh các "trường chuyển động" cho chế độ Thức Giấc từ vị trí các hình trong tranh. */
export function sceneAnim(layers: SceneLayer[]): AnimPart[] {
  const out: AnimPart[] = [];
  layers.forEach((l, i) => {
    if (typeof l === 'function' || !l.anim) return;
    const [amp, speed] = ANIM_DEFAULTS[l.anim];
    const r = l.size * 0.62;
    out.push({ kind: l.anim, cx: l.x, cy: l.y, rx: r, ry: r, amp: l.amp ?? amp, speed: l.speed ?? speed, phase: i * 1.3 });
  });
  // nhân vật to được ưu tiên nếu vượt quá số trường shader hỗ trợ
  return out.sort((a, b) => b.rx - a.rx).slice(0, 16);
}
