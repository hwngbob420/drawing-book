import { AnimKind, AnimPart, ART_W, ART_H, makeCanvas, ctx2d } from '../types';
import { INNER_W, OUTER_W } from './SvgLineArtConverter';

/**
 * SceneComposer — Bộ Ghép Tranh Vector.
 *
 * Mỗi bức tranh là một danh sách lớp xếp từ sau ra trước; lớp là một hình SVG
 * (bộ hình sách tranh tự vẽ `public/svg/story/`, xem scripts/storybook) hoặc một hàm vẽ nền
 * đơn giản (đường đồi, mặt đất...). Với từng hình SVG, bộ ghép sẽ:
 *
 *  1. Chuẩn hoá: mọi mảng thành nền trắng #FFFFFF, viền đen ấm #231F20 dày đều,
 *     đầu nét bo tròn; chỉ các chi tiết nhỏ vốn tối màu (mắt, mũi) giữ mực đặc.
 *  2. Raster hoá rồi đổi "độ tối" thành kênh alpha -> lớp nét mực trong suốt.
 *  3. Tìm bóng (silhouette) của hình bằng cách loang từ mép ngoài trên bản đồ
 *     đã bịt khe hở, rồi xoá mọi nét nằm sau bóng đó -> hình trước che hình sau,
 *     các mảng luôn khép kín.
 */

export interface SceneItem {
  /** 'g:<tên>' = PNG nét mực do Muse vẽ (public/gen); 's:<tên>' = hình sách tranh tự vẽ (public/svg/story, sinh bởi scripts/storybook); 'n:' Noto / 'o:' OpenMoji vẫn đọc được. */
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

export const INK = '#231F20';
const [INK_R, INK_G, INK_B] = [0x23, 0x1f, 0x20];
/** 255 - độ sáng của INK: mực đặc nhất -> alpha 255 */
const INK_SPAN = 255 - (INK_R * 0.3 + INK_G * 0.59 + INK_B * 0.11);
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
  /** Khóm cỏ: một mảng kín ba ngọn tròn (đủ to để tô, không đọc thành chữ/mũi tên). */
  grass(x: number, y: number, s = 1) {
    const p = new Path2D();
    p.moveTo(x - 34 * s, y);
    p.quadraticCurveTo(x - 36 * s, y - 22 * s, x - 26 * s, y - 36 * s);
    p.quadraticCurveTo(x - 16 * s, y - 20 * s, x - 10 * s, y - 24 * s);
    p.quadraticCurveTo(x - 4 * s, y - 46 * s, x + 4 * s, y - 50 * s);
    p.quadraticCurveTo(x + 10 * s, y - 28 * s, x + 14 * s, y - 24 * s);
    p.quadraticCurveTo(x + 22 * s, y - 34 * s, x + 30 * s, y - 38 * s);
    p.quadraticCurveTo(x + 36 * s, y - 20 * s, x + 34 * s, y);
    p.closePath();
    this.shape(p);
  }
}

// ---------------------------------------------------------------- SVG

const textCache = new Map<string, Promise<string>>();

/** Bản một-file-HTML nhúng sẵn toàn bộ SVG vào `window.__MCB_SVG__` (xem scripts/build-single.mjs). */
const embedded = (): Record<string, string> | undefined => (window as any).__MCB_SVG__;
const dataUrls = new Map<string, string>();

export function svgUrl(src: string): string {
  const text = embedded()?.[src];
  if (text && src.startsWith('g:')) return text; // bản một file: PNG nhúng sẵn dạng data URL
  if (text) {
    let u = dataUrls.get(src);
    if (!u) dataUrls.set(src, (u = 'data:image/svg+xml;utf8,' + encodeURIComponent(text)));
    return u;
  }
  const [kind, code] = src.split(':');
  if (kind === 'g') return `${import.meta.env.BASE_URL}gen/${code}.png`;
  const dir = { s: 'story', a: 'artist', n: 'noto', o: 'openmoji' }[kind] ?? 'openmoji';
  return `${import.meta.env.BASE_URL}svg/${dir}/${code}.svg`;
}

/**
 * Ảnh thẻ (phòng tranh, thẻ chọn ở Xưởng) cho một hình. Hình hoạ sĩ ('a:') dùng nét non-scaling-stroke tính
 * bằng px, nên được dựng lại theo cỡ hiển thị `px` để nét không đậm hơn hình tự vẽ bên cạnh.
 */
export function svgImg(src: string, px = 160, attrs: Record<string, string> = {}): HTMLImageElement {
  const img = document.createElement('img');
  img.alt = '';
  img.draggable = false;
  for (const [k, v] of Object.entries(attrs)) img.setAttribute(k, v);
  if (src.startsWith('g:')) img.classList.add('gimg'); // PNG nền trắng: hoà vào nền bằng multiply
  if (!src.startsWith('a:')) img.src = svgUrl(src);
  else
    void loadSvgText(src).then((text) => {
      const svg = normalizeSvg(text, src, px, Math.max(1.2, px * 0.018));
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    });
  return img;
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
  if (src.startsWith('a:')) return normalizeArtist(svg, size, strokePx);
  const vb = (svg.getAttribute('viewBox') || '0 0 128 128').split(/[\s,]+/).map(Number);
  const unit = vb[2] || 128;
  const sw = ((strokePx * unit) / size).toFixed(2);
  const story = src.startsWith('s:');
  const openmoji = src.startsWith('o:') || story; // fill tối = mực đặc (con ngươi, lỗ mũi)

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
      // Sách tranh: nét ngoài 4, nét chia mảng 2.2 (như hình hoạ sĩ) -> giữ tỉ lệ so với nét ngoài
      const ratio = story ? Math.max(0.2, (parseFloat(el.getAttribute('stroke-width') || String(OUTER_W)) || OUTER_W) / OUTER_W) : 1;
      const w = story ? (+sw * ratio).toFixed(2) : sw;
      if (fill === null) el.remove();
      else el.setAttribute('style', `fill:${fill};stroke:${INK};stroke-width:${w};stroke-linecap:round;stroke-linejoin:round;opacity:1;fill-opacity:1;stroke-opacity:1`);
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

/**
 * Hình hoạ sĩ đã qua SvgLineArtConverter ('a:'): nét non-scaling-stroke, độ dày theo vai trò
 * (`under` = đường bao ngoài, gấp đôi vì nửa trong bị mảng trắng che; `inner` = nét chia mảng mảnh).
 */
function normalizeArtist(svg: SVGSVGElement, size: number, strokePx: number): string {
  const inner = ((strokePx * INNER_W) / OUTER_W).toFixed(2);
  svg.querySelectorAll<SVGElement>('[data-role]').forEach((el) => {
    const role = el.getAttribute('data-role');
    if (role === 'under') el.setAttribute('stroke-width', (strokePx * 2).toFixed(2));
    else if (role === 'inner') el.setAttribute('stroke-width', inner);
  });
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
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

/** Hình PNG nét mực do Muse vẽ ('g:', public/gen): nền trắng, đã tách nét và căn vuông bằng scripts/gen/process.py. */
const pngCache = new Map<string, Promise<HTMLImageElement>>();
function loadPng(src: string): Promise<HTMLImageElement> {
  let p = pngCache.get(src);
  if (!p) {
    p = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Thiếu PNG ' + src));
      img.src = svgUrl(src);
    });
    pngCache.set(src, p);
  }
  return p;
}

const SIL_GAP = 3;

/** Nới nét: kênh alpha = max trong hình vuông bán kính r (tách hai chiều). */
function dilateAlpha(d: Uint8ClampedArray, w: number, h: number, r: number) {
  const tmp = new Uint8Array(w * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let m = 0;
      for (let k = Math.max(0, x - r); k <= Math.min(w - 1, x + r); k++) m = Math.max(m, d[(y * w + k) * 4 + 3]);
      tmp[y * w + x] = m;
    }
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let m = 0;
      for (let k = Math.max(0, y - r); k <= Math.min(h - 1, y + r); k++) m = Math.max(m, tmp[k * w + x]);
      d[(y * w + x) * 4 + 3] = m;
    }
}

/** Raster hoá một hình: trả về lớp nét mực trong suốt + mặt nạ bóng của hình. */
async function rasterize(src: string, size: number): Promise<{ ink: HTMLCanvasElement; sil: HTMLCanvasElement; pad: number }> {
  size = Math.round(size);
  const strokePx = Math.max(5, Math.min(8.5, size * 0.02));
  const img = src.startsWith('g:') ? await loadPng(src) : await svgToImage(normalizeSvg(await loadSvgText(src), src, size, strokePx));
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
    const a = Math.round((d[i * 4 + 3] * (255 - lum)) / INK_SPAN);
    d[i * 4] = INK_R;
    d[i * 4 + 1] = INK_G;
    d[i * 4 + 2] = INK_B;
    d[i * 4 + 3] = a > 255 ? 255 : a;
  }
  // PNG của Muse có nét mảnh khi thu nhỏ (chi tiết nền): nới nét theo cỡ để mọi hình có nét dày gần bằng nhau
  const grow = src.startsWith('g:') ? size < 200 ? 1 : 0 : 0;
  if (grow > 0) dilateAlpha(d, w, w, grow);
  for (let i = 0; i < n; i++) open[i] = d[i * 4 + 3] < 110 ? 1 : 0;
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
  canvas.dataset.sealed = String(sealTinyRegions(canvas));
  return canvas;
}

/**
 * Tranh cả trang đã chuyển nét (SvgLineArtConverter, chế độ `page`) -> lớp nét mực w x h:
 * co vừa khung, giữ tỉ lệ, căn giữa; độ tối -> alpha như các hình ghép; lấp khe < MIN_REGION_PX.
 */
export async function composeLineArt(svg: string, w = ART_W, h = ART_H): Promise<HTMLCanvasElement> {
  const vb = (svg.match(/viewBox="([^"]+)"/)?.[1] || `0 0 ${w} ${h}`).split(/[\s,]+/).map(Number);
  const k = Math.min(w / vb[2], h / vb[3]);
  const dw = Math.round(vb[2] * k);
  const dh = Math.round(vb[3] * k);
  // nét non-scaling-stroke tính theo px ở cạnh dài gốc: đặt width/height = đúng kích thước dựng
  const sized = svg.replace(/<svg /, `<svg width="${dw}" height="${dh}" `);
  const img = await svgToImage(sized);
  const canvas = makeCanvas(w, h);
  const c = ctx2d(canvas, true);
  c.drawImage(img, Math.round((w - dw) / 2), Math.round((h - dh) / 2), dw, dh);
  const data = c.getImageData(0, 0, w, h);
  const d = data.data;
  for (let i = 0; i < d.length; i += 4) {
    const lum = d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11;
    const a = Math.round((d[i + 3] * (255 - lum)) / INK_SPAN);
    d[i] = INK_R;
    d[i + 1] = INK_G;
    d[i + 2] = INK_B;
    d[i + 3] = a > 255 ? 255 : a;
  }
  c.putImageData(data, 0, 0);
  canvas.dataset.sealed = String(sealTinyRegions(canvas));
  return canvas;
}

/** Cạnh nhỏ nhất (px trên tranh) của một vùng tô: ngón tay bé 2–5 tuổi phải chạm trúng. */
export const MIN_REGION_PX = 25;
const WALL = 110; // khớp FloodFillEngine.WALL_ALPHA

/**
 * Lấp mực mọi vùng kín lọt thỏm trong khung MIN_REGION_PX x MIN_REGION_PX — các khe nhọn sinh ra
 * khi hai hình chồng lên nhau (tia nắng sau vành hành tinh, đường đồi lách giữa cánh hoa...) —
 * để bé không gặp ô li ti không tô được; nhìn như chỗ giao nét đậm lên một chút.
 * Đốm sáng trong mắt (lỗ nằm gọn trong mảng mực đặc) được giữ nguyên. Trả về số vùng đã lấp.
 */
function sealTinyRegions(canvas: HTMLCanvasElement): number {
  const w = canvas.width;
  const h = canvas.height;
  const c = ctx2d(canvas);
  const img = c.getImageData(0, 0, w, h);
  const d = img.data;
  const n = w * h;
  const seen = new Uint8Array(n);
  const stack = new Int32Array(n);
  const isInk = (x: number, y: number) => x < 0 || y < 0 || x >= w || y >= h || d[(y * w + x) * 4 + 3] >= WALL;
  let sealed = 0;
  for (let s = 0; s < n; s++) {
    if (seen[s] || d[s * 4 + 3] >= WALL) continue;
    // loang 4 hướng; `stack` vừa là hàng đợi vừa là danh sách điểm của vùng
    let top = 0;
    let len = 0;
    let x0 = w, y0 = h, x1 = 0, y1 = 0;
    let edge = false;
    seen[s] = 1;
    stack[len++] = s;
    while (top < len) {
      const i = stack[top++];
      const x = i % w;
      const y = (i / w) | 0;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1) edge = true;
      if (x > 0 && !seen[i - 1] && d[(i - 1) * 4 + 3] < WALL) (seen[i - 1] = 1), (stack[len++] = i - 1);
      if (x < w - 1 && !seen[i + 1] && d[(i + 1) * 4 + 3] < WALL) (seen[i + 1] = 1), (stack[len++] = i + 1);
      if (y > 0 && !seen[i - w] && d[(i - w) * 4 + 3] < WALL) (seen[i - w] = 1), (stack[len++] = i - w);
      if (y < h - 1 && !seen[i + w] && d[(i + w) * 4 + 3] < WALL) (seen[i + w] = 1), (stack[len++] = i + w);
    }
    if (edge || x1 - x0 + 1 >= MIN_REGION_PX || y1 - y0 + 1 >= MIN_REGION_PX) continue;
    // đốm sáng trong mắt: vành cách khung bao 3px gần như toàn mực -> giữ
    let ink = 0;
    let tot = 0;
    for (let x = x0 - 3; x <= x1 + 3; x++) for (const y of [y0 - 3, y1 + 3]) (tot++, isInk(x, y) && ink++);
    for (let y = y0 - 3; y <= y1 + 3; y++) for (const x of [x0 - 3, x1 + 3]) (tot++, isInk(x, y) && ink++);
    if (ink / tot >= 0.7) continue;
    for (let k = 0; k < len; k++) {
      const p = stack[k] * 4;
      d[p] = INK_R;
      d[p + 1] = INK_G;
      d[p + 2] = INK_B;
      d[p + 3] = 255;
    }
    sealed++;
  }
  if (sealed) c.putImageData(img, 0, 0);
  return sealed;
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
