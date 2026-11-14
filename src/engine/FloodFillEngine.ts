import { makeCanvas, ctx2d } from '../types';

/**
 * FloodFillEngine
 * ---------------
 * Kết hợp ý tưởng của 3 repo tham khảo trong `.refs/`:
 *
 *  - q-floodfill: thuật toán quét dòng (scan-line) dùng hàng đợi các đoạn
 *    [x1, x2, y, hướng]. Ở đây được viết lại trên TypedArray (không tạo object
 *    cho từng pixel) nên dán nhãn toàn bộ tranh 1600x1200 chỉ mất vài chục ms.
 *    Thay cho `collectModifiedPixels`, mỗi vùng kín được dán nhãn sẵn vào
 *    `labels` — danh sách pixel của một vùng chính là các pixel mang nhãn đó.
 *  - FloodFill2D: `toleranceFade` + `getMask`. Mask của vùng được nới rộng vài
 *    pixel XUỐNG DƯỚI nét mực (chỉ lấn vào pixel "tường"), nên màu ăn sát vào
 *    mép khử răng cưa của nét đen và không còn viền trắng (halo).
 *  - Vì nét đen nằm ở Layer 3 phía trên, phần màu lấn dưới nét luôn bị mực che.
 */

export interface RegionMask {
  id: number;
  canvas: HTMLCanvasElement;
  x: number;
  y: number;
  w: number;
  h: number;
}

const WALL_ALPHA = 110; // alpha mực >= ngưỡng này được coi là "tường"
const SPECK_AREA = 24; // vùng nhỏ hơn mức này là nhiễu khử răng cưa -> nhập vào tường
const GAP_PX = 3; // bịt mọi khe hở hẹp hơn ~2*GAP_PX pixel giữa các nét
const FADE_PX = 3; // số pixel màu lấn dưới nét mực (tương đương toleranceFade)
const MASK_CACHE_BUDGET = 7_000_000; // tổng số pixel mask được giữ trong bộ đệm

export class FloodFillEngine {
  readonly w: number;
  readonly h: number;
  /** 0 = tường/nét đen, >0 = mã vùng kín. */
  readonly labels: Uint16Array;
  /** area[id], và bbox[id*4..] = minX, minY, maxX, maxY */
  area: Uint32Array = new Uint32Array(1);
  bbox: Int32Array = new Int32Array(4);
  regionCount = 0;

  private maskCache = new Map<number, RegionMask>();
  private maskPixels = 0;

  constructor(lineArt: HTMLCanvasElement) {
    this.w = lineArt.width;
    this.h = lineArt.height;
    this.labels = new Uint16Array(this.w * this.h);
    const img = ctx2d(lineArt, true).getImageData(0, 0, this.w, this.h);
    this.labelAll(img.data);
  }

  /**
   * Dán nhãn mọi vùng kín, có ĐÓNG KHE HỞ (gap closing):
   *  1. Co vùng tô được lại GAP_PX pixel (tương đương làm dày nét mực) — mọi
   *     khe hở hẹp hơn 2*GAP_PX giữa các nét bị bịt kín.
   *  2. Dán nhãn bằng scan-line flood fill trên bản đồ đã bịt khe.
   *  3. Loang nhãn ngược trở lại (BFS đa nguồn) vào phần pixel bị co ở bước 1,
   *     nên vùng vẫn ăn sát nét mực nhưng không bao giờ tràn qua khe.
   *  4. Những mảng quá hẹp không còn "hạt giống" sau khi co được dán nhãn riêng.
   */
  private labelAll(rgba: Uint8ClampedArray) {
    const { w, h, labels } = this;
    const n = w * h;
    const open = new Uint8Array(n);
    for (let i = 0; i < n; i++) open[i] = rgba[i * 4 + 3] < WALL_ALPHA ? 1 : 0;

    // 1. co vùng mở (xen kẽ lân cận 4 và 8 để khe chéo cũng được bịt)
    let cur = open.slice();
    for (let it = 0; it < GAP_PX; it++) {
      const nxt = cur.slice();
      const diag = it % 2 === 1;
      for (let y = 0; y < h; y++) {
        const row = y * w;
        for (let x = 0; x < w; x++) {
          const i = row + x;
          if (!cur[i]) continue;
          const l = x > 0,
            r = x < w - 1,
            u = y > 0,
            d = y < h - 1;
          if ((l && !cur[i - 1]) || (r && !cur[i + 1]) || (u && !cur[i - w]) || (d && !cur[i + w])) nxt[i] = 0;
          else if (diag && ((l && u && !cur[i - w - 1]) || (r && u && !cur[i - w + 1]) || (l && d && !cur[i + w - 1]) || (r && d && !cur[i + w + 1]))) nxt[i] = 0;
        }
      }
      cur = nxt;
    }

    // 2. dán nhãn trên bản đồ đã bịt khe
    let next = this.scanLabel(cur, 1, SPECK_AREA);

    // 3. loang nhãn trở lại các pixel mở chưa có nhãn
    const queue = new Int32Array(n);
    let qh = 0;
    let qt = 0;
    for (let i = 0; i < n; i++) if (labels[i]) queue[qt++] = i;
    while (qh < qt) {
      const i = queue[qh++];
      const id = labels[i];
      const x = i % w;
      if (x > 0 && open[i - 1] && !labels[i - 1]) (labels[i - 1] = id), (queue[qt++] = i - 1);
      if (x < w - 1 && open[i + 1] && !labels[i + 1]) (labels[i + 1] = id), (queue[qt++] = i + 1);
      if (i >= w && open[i - w] && !labels[i - w]) (labels[i - w] = id), (queue[qt++] = i - w);
      if (i < n - w && open[i + w] && !labels[i + w]) (labels[i + w] = id), (queue[qt++] = i + w);
    }

    // 4. mảng hẹp còn sót
    for (let i = 0; i < n; i++) cur[i] = open[i] && !labels[i] ? 1 : 0;
    next = this.scanLabel(cur, next, SPECK_AREA);

    // thống kê diện tích + khung bao
    this.regionCount = next - 1;
    const area = new Uint32Array(next);
    const bbox = new Int32Array(next * 4);
    for (let id = 1; id < next; id++) {
      bbox[id * 4] = w;
      bbox[id * 4 + 1] = h;
    }
    for (let y = 0; y < h; y++) {
      const row = y * w;
      for (let x = 0; x < w; x++) {
        const id = labels[row + x];
        if (!id) continue;
        area[id]++;
        const b = id * 4;
        if (x < bbox[b]) bbox[b] = x;
        if (y < bbox[b + 1]) bbox[b + 1] = y;
        if (x > bbox[b + 2]) bbox[b + 2] = x;
        if (y > bbox[b + 3]) bbox[b + 3] = y;
      }
    }
    this.area = area;
    this.bbox = bbox;
  }

  /** Scan-line flood fill (kiểu q-floodfill) dán nhãn mọi thành phần liên thông của `open`. */
  private scanLabel(open: Uint8Array, firstId: number, minArea: number): number {
    const { w, h, labels } = this;
    const n = w * h;
    let stack = new Int32Array(4096);
    let next = firstId;

    for (let start = 0; start < n; start++) {
      if (!open[start] || next >= 65535) continue;
      const id = next;
      let sp = 0;
      let area = 0;
      let minX = w,
        minY = h,
        maxX = 0,
        maxY = 0;
      const sx = start % w;
      const sy = (start / w) | 0;
      // Mỗi phần tử: [x1, x2, y, dy]
      stack[sp++] = sx;
      stack[sp++] = sx;
      stack[sp++] = sy;
      stack[sp++] = 0;

      while (sp > 0) {
        const dy = stack[--sp];
        const y = stack[--sp];
        const x2 = stack[--sp];
        const x1 = stack[--sp];
        const row = y * w;
        let x = x1;
        while (x <= x2) {
          if (!open[row + x]) {
            x++;
            continue;
          }
          // nới đoạn sang trái & phải
          let l = x;
          while (l > 0 && open[row + l - 1]) l--;
          let r = x;
          while (r < w - 1 && open[row + r + 1]) r++;
          for (let i = l; i <= r; i++) {
            open[row + i] = 0;
            labels[row + i] = id;
          }
          area += r - l + 1;
          if (l < minX) minX = l;
          if (r > maxX) maxX = r;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;

          if (sp + 8 > stack.length) {
            const bigger = new Int32Array(stack.length * 2);
            bigger.set(stack);
            stack = bigger;
          }
          // Hàng đợi dòng trên & dưới (bỏ qua phần đã được dòng cha phủ kín)
          if (y > 0 && !(dy === 1 && l >= x1 && r <= x2)) {
            stack[sp++] = l;
            stack[sp++] = r;
            stack[sp++] = y - 1;
            stack[sp++] = -1;
          }
          if (y < h - 1 && !(dy === -1 && l >= x1 && r <= x2)) {
            stack[sp++] = l;
            stack[sp++] = r;
            stack[sp++] = y + 1;
            stack[sp++] = 1;
          }
          x = r + 2;
        }
      }

      if (area < minArea) {
        // Nhiễu: bỏ nhãn, dùng lại mã vùng
        for (let yy = minY; yy <= maxY; yy++) {
          const rr = yy * w;
          for (let xx = minX; xx <= maxX; xx++) if (labels[rr + xx] === id) labels[rr + xx] = 0;
        }
        continue;
      }
      next++;
    }
    return next;
  }

  regionAt(x: number, y: number): number {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return 0;
    return this.labels[y * this.w + x];
  }

  /**
   * Smart Hit-Test: nếu chạm trúng nét đen, tìm pixel tô được gần nhất trong
   * bán kính cho trước. Trả về toạ độ đã "bắt dính" hoặc null.
   */
  smartHit(x: number, y: number, radius: number): { x: number; y: number; id: number } | null {
    x = Math.round(x);
    y = Math.round(y);
    const direct = this.regionAt(x, y);
    if (direct) return { x, y, id: direct };
    const R = Math.ceil(radius);
    let best = Infinity;
    let hit: { x: number; y: number; id: number } | null = null;
    for (let dy = -R; dy <= R; dy++) {
      for (let dx = -R; dx <= R; dx++) {
        const d = dx * dx + dy * dy;
        if (d >= best || d > R * R) continue;
        const id = this.regionAt(x + dx, y + dy);
        if (id) {
          best = d;
          hit = { x: x + dx, y: y + dy, id };
        }
      }
    }
    return hit;
  }

  /**
   * Trích xuất Mask của một vùng kín (canvas alpha) — có nới FADE_PX pixel vào
   * dưới nét mực để chống viền trắng. Kết quả được cache theo LRU.
   */
  getMask(id: number): RegionMask {
    const cached = this.maskCache.get(id);
    if (cached) {
      this.maskCache.delete(id);
      this.maskCache.set(id, cached);
      return cached;
    }
    const { w, labels } = this;
    const x0 = Math.max(0, this.bbox[id * 4] - FADE_PX);
    const y0 = Math.max(0, this.bbox[id * 4 + 1] - FADE_PX);
    const x1 = Math.min(this.w - 1, this.bbox[id * 4 + 2] + FADE_PX);
    const y1 = Math.min(this.h - 1, this.bbox[id * 4 + 3] + FADE_PX);
    const mw = x1 - x0 + 1;
    const mh = y1 - y0 + 1;
    const m = new Uint8Array(mw * mh);
    for (let y = 0; y < mh; y++) {
      const src = (y + y0) * w + x0;
      const dst = y * mw;
      for (let x = 0; x < mw; x++) if (labels[src + x] === id) m[dst + x] = 1;
    }
    // Nới mask vào pixel tường (nhãn 0), mỗi vòng 1 pixel
    for (let it = 1; it <= FADE_PX; it++) {
      for (let y = 0; y < mh; y++) {
        const src = (y + y0) * w + x0;
        const dst = y * mw;
        for (let x = 0; x < mw; x++) {
          const i = dst + x;
          if (m[i] || labels[src + x] !== 0) continue;
          if (
            (x > 0 && m[i - 1] === it) ||
            (x < mw - 1 && m[i + 1] === it) ||
            (y > 0 && m[i - mw] === it) ||
            (y < mh - 1 && m[i + mw] === it)
          )
            m[i] = it + 1;
        }
      }
    }
    const canvas = makeCanvas(mw, mh);
    const c = ctx2d(canvas);
    const img = c.createImageData(mw, mh);
    const px = new Uint32Array(img.data.buffer);
    for (let i = 0; i < m.length; i++) if (m[i]) px[i] = 0xffffffff;
    c.putImageData(img, 0, 0);

    const mask: RegionMask = { id, canvas, x: x0, y: y0, w: mw, h: mh };
    this.maskCache.set(id, mask);
    this.maskPixels += mw * mh;
    for (const [key, old] of this.maskCache) {
      if (this.maskPixels <= MASK_CACHE_BUDGET || key === id) break;
      this.maskCache.delete(key);
      this.maskPixels -= old.w * old.h;
    }
    return mask;
  }

  /** Các vùng đủ lớn để tính vào tiến độ hoàn thành. */
  significantRegions(minArea = 320): number[] {
    const out: number[] = [];
    for (let id = 1; id <= this.regionCount; id++) if (this.area[id] >= minArea) out.push(id);
    return out;
  }
}
