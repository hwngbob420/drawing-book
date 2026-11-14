import { ART_W, ART_H, makeCanvas, ctx2d } from '../types';

/**
 * LineArtProcessor — biến một ảnh tranh tô màu đen trắng bất kỳ (PNG/JPG)
 * thành lớp nét mực trong suốt cho Layer 3.
 *
 *  1. Đặt ảnh vừa khít khung 4:3 trên nền trắng.
 *  2. Tính ngưỡng sáng/tối tự động bằng phương pháp Otsu.
 *  3. Chuyển độ sáng thành kênh alpha (có dải chuyển mềm quanh ngưỡng để giữ
 *     mép nét mượt), màu mực luôn là đen. Cách làm này gần với bước lượng tử
 *     hoá 2 màu của imagetracerjs nhưng giữ nguyên dữ liệu raster.
 */

export function loadImage(src: Blob | string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = typeof src === 'string' ? src : URL.createObjectURL(src);
    img.onload = () => {
      if (typeof src !== 'string') URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => reject(new Error('Không đọc được ảnh'));
    img.src = url;
  });
}

function otsu(hist: Uint32Array, total: number): number {
  let sum = 0;
  for (let i = 0; i < 256; i++) sum += i * hist[i];
  let sumB = 0;
  let wB = 0;
  let best = 0;
  let thr = 128;
  for (let i = 0; i < 256; i++) {
    wB += hist[i];
    if (!wB) continue;
    const wF = total - wB;
    if (!wF) break;
    sumB += i * hist[i];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const v = wB * wF * (mB - mF) * (mB - mF);
    if (v > best) {
      best = v;
      thr = i;
    }
  }
  return thr;
}

export function processLineArt(img: CanvasImageSource & { width: number; height: number }): HTMLCanvasElement {
  const out = makeCanvas(ART_W, ART_H);
  const c = ctx2d(out, true);
  c.fillStyle = '#fff';
  c.fillRect(0, 0, ART_W, ART_H);
  const margin = 24;
  const s = Math.min((ART_W - margin * 2) / img.width, (ART_H - margin * 2) / img.height);
  const dw = img.width * s;
  const dh = img.height * s;
  c.imageSmoothingQuality = 'high';
  c.drawImage(img, (ART_W - dw) / 2, (ART_H - dh) / 2, dw, dh);

  const data = c.getImageData(0, 0, ART_W, ART_H);
  const d = data.data;
  const n = ART_W * ART_H;
  const lum = new Uint8Array(n);
  const hist = new Uint32Array(256);
  for (let i = 0; i < n; i++) {
    const l = (d[i * 4] * 77 + d[i * 4 + 1] * 150 + d[i * 4 + 2] * 29) >> 8;
    lum[i] = l;
    hist[l]++;
  }
  // Giữ ngưỡng trong khoảng an toàn để ảnh xám nhạt/scan ố vàng vẫn tách được nét
  const thr = Math.max(70, Math.min(200, otsu(hist, n)));
  const soft = 36;
  const lo = thr - soft;
  const hi = thr + soft;
  for (let i = 0; i < n; i++) {
    const l = lum[i];
    const a = l <= lo ? 255 : l >= hi ? 0 : Math.round(((hi - l) / (hi - lo)) * 255);
    d[i * 4] = 20;
    d[i * 4 + 1] = 18;
    d[i * 4 + 2] = 24;
    d[i * 4 + 3] = a;
  }
  c.putImageData(data, 0, 0);
  return out;
}

export function canvasToBlob(c: HTMLCanvasElement, type = 'image/png', q?: number): Promise<Blob> {
  return new Promise((resolve, reject) => c.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob'))), type, q));
}
