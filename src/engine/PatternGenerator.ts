import { Paint, makeCanvas, ctx2d } from '../types';

/**
 * PatternGenerator — sinh "chất liệu" cho 4 loại bút dưới dạng CanvasPattern
 * lát liền mạch. Pattern luôn neo theo toạ độ tranh, nên nét cọ và ô đổ màu
 * cùng chất liệu sẽ khớp vân với nhau.
 */

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.replace(/(.)/g, '$1$1') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function mix(hex: string, target: [number, number, number], t: number): string {
  const [r, g, b] = hexToRgb(hex);
  const m = (a: number, z: number) => Math.round(a + (z - a) * t);
  return `rgb(${m(r, target[0])},${m(g, target[1])},${m(b, target[2])})`;
}
export const lighten = (hex: string, t: number) => mix(hex, [255, 255, 255], t);
export const darken = (hex: string, t: number) => mix(hex, [0, 0, 0], t);

/** PRNG có hạt giống để vân chất liệu luôn giống nhau giữa các lần phát lại. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function starPath(c: CanvasRenderingContext2D, x: number, y: number, r: number, inner = 0.45, points = 5, rot = -Math.PI / 2) {
  c.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const rr = i % 2 === 0 ? r : r * inner;
    const a = rot + (i * Math.PI) / points;
    const px = x + Math.cos(a) * rr;
    const py = y + Math.sin(a) * rr;
    if (i === 0) c.moveTo(px, py);
    else c.lineTo(px, py);
  }
  c.closePath();
}

const cache = new Map<string, CanvasPattern | string>();
const host = ctx2d(makeCanvas(1, 1));

function crayonTile(color: string): HTMLCanvasElement {
  const S = 256;
  const tile = makeCanvas(S, S);
  const c = ctx2d(tile);
  const img = c.createImageData(S, S);
  const [r, g, b] = hexToRgb(color);
  const rnd = mulberry32(7);
  // Vệt sáp chạy chéo: nhiễu thô (lặp theo ô lát) + hạt mịn từng pixel
  const coarse = new Float32Array(64 * 64);
  for (let i = 0; i < coarse.length; i++) coarse[i] = rnd();
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const streak = coarse[(((x + y) >> 2) & 63) + ((((y - x) >> 4) & 63) << 6)];
      const grain = rnd();
      let a = 0.62 + 0.38 * grain;
      if (streak < 0.2 && grain < 0.55) a *= 0.3; // lộ vân giấy
      else if (grain < 0.07) a *= 0.4;
      const shade = 1 - 0.1 * rnd();
      const i = (y * S + x) * 4;
      img.data[i] = r * shade;
      img.data[i + 1] = g * shade;
      img.data[i + 2] = b * shade;
      img.data[i + 3] = 255 * a;
    }
  }
  c.putImageData(img, 0, 0);
  return tile;
}

function glitterTile(color: string): HTMLCanvasElement {
  const S = 256;
  const tile = makeCanvas(S, S);
  const c = ctx2d(tile);
  c.fillStyle = color;
  c.fillRect(0, 0, S, S);
  const rnd = mulberry32(21);
  for (let i = 0; i < 2600; i++) {
    const x = rnd() * S;
    const y = rnd() * S;
    const k = rnd();
    c.fillStyle = k < 0.5 ? lighten(color, 0.35 + rnd() * 0.5) : k < 0.8 ? darken(color, 0.12 + rnd() * 0.2) : 'rgba(255,255,255,0.9)';
    const s = 1 + rnd() * 2.2;
    c.fillRect(x, y, s, s);
  }
  return tile;
}

function dotsTile(color: string): HTMLCanvasElement {
  const S = 56;
  const tile = makeCanvas(S, S);
  const c = ctx2d(tile);
  c.fillStyle = lighten(color, 0.62);
  c.fillRect(0, 0, S, S);
  c.fillStyle = color;
  for (const [x, y] of [
    [14, 14],
    [42, 42],
  ]) {
    c.beginPath();
    c.arc(x, y, 10.5, 0, Math.PI * 2);
    c.fill();
  }
  return tile;
}

function stripesTile(color: string): HTMLCanvasElement {
  const S = 48;
  const tile = makeCanvas(S, S);
  const c = ctx2d(tile);
  c.fillStyle = lighten(color, 0.8);
  c.fillRect(0, 0, S, S);
  c.strokeStyle = color;
  c.lineWidth = 17;
  c.lineCap = 'square';
  c.beginPath();
  for (const k of [0, S, S * 2]) {
    c.moveTo(k - S - 10, S + 10);
    c.lineTo(k + 10, -10);
  }
  c.stroke();
  return tile;
}

function starsTile(color: string): HTMLCanvasElement {
  const S = 72;
  const tile = makeCanvas(S, S);
  const c = ctx2d(tile);
  c.fillStyle = color;
  c.fillRect(0, 0, S, S);
  c.fillStyle = lighten(color, 0.78);
  starPath(c, 19, 20, 13);
  c.fill();
  starPath(c, 54, 55, 9, 0.45, 5, -Math.PI / 2 + 0.4);
  c.fill();
  return tile;
}

/** Trả về fillStyle/strokeStyle tương ứng với loại bút. */
export function paintStyle(p: Paint): CanvasPattern | string {
  if (p.material === 'marker') return p.color;
  const key = `${p.material}|${p.pattern ?? ''}|${p.color}`;
  let s = cache.get(key);
  if (!s) {
    let tile: HTMLCanvasElement;
    if (p.material === 'crayon') tile = crayonTile(p.color);
    else if (p.material === 'glitter') tile = glitterTile(p.color);
    else if (p.pattern === 'stripes') tile = stripesTile(p.color);
    else if (p.pattern === 'stars') tile = starsTile(p.color);
    else tile = dotsTile(p.color);
    s = host.createPattern(tile, 'repeat')!;
    cache.set(key, s);
    if (cache.size > 120) cache.delete(cache.keys().next().value!);
  }
  return s;
}

export const PAPER = '#FDFBF7';

/** Nền giấy mỹ thuật ngả kem, có vân rất nhẹ (Layer 0). */
export function drawPaper(c: CanvasRenderingContext2D, w: number, h: number) {
  c.fillStyle = PAPER;
  c.fillRect(0, 0, w, h);
  const S = 200;
  const tile = makeCanvas(S, S);
  const t = ctx2d(tile);
  const img = t.createImageData(S, S);
  const rnd = mulberry32(99);
  for (let i = 0; i < S * S; i++) {
    const v = rnd();
    const dark = v < 0.5;
    img.data[i * 4] = dark ? 120 : 255;
    img.data[i * 4 + 1] = dark ? 95 : 255;
    img.data[i * 4 + 2] = dark ? 60 : 255;
    img.data[i * 4 + 3] = dark ? 9 * rnd() : 40 * rnd();
  }
  t.putImageData(img, 0, 0);
  c.fillStyle = c.createPattern(tile, 'repeat')!;
  c.fillRect(0, 0, w, h);
  // các sợi giấy thưa
  c.strokeStyle = 'rgba(150,120,80,0.05)';
  c.lineWidth = 1;
  for (let i = 0; i < 260; i++) {
    const x = rnd() * w;
    const y = rnd() * h;
    const a = rnd() * Math.PI;
    const l = 6 + rnd() * 16;
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
    c.stroke();
  }
}

let paperUrl = '';
/** Ô lát vân giấy (data URL) để phủ nền cho cả màn hình tràn viền. */
export function paperTileUrl(): string {
  if (!paperUrl) {
    const t = makeCanvas(256, 256);
    drawPaper(ctx2d(t), 256, 256);
    paperUrl = t.toDataURL('image/png');
  }
  return paperUrl;
}
