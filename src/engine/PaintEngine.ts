import { Action, Paint, makeCanvas, ctx2d } from '../types';
import { FloodFillEngine, RegionMask } from './FloodFillEngine';
import { paintStyle } from './PatternGenerator';

/** Tỉ lệ thu nhỏ của lớp "bản đồ kim tuyến" so với tranh. */
export const GLITTER_SCALE = 0.25;

export interface Snapshot {
  color: HTMLCanvasElement;
  glitter: HTMLCanvasElement;
  filled: Set<number>;
}

/**
 * PaintEngine — áp các Action lên Layer 1 (màu) và bản đồ kim tuyến.
 * Mọi thao tác đều đi qua Mask của vùng kín nên không bao giờ lem ra ngoài ô.
 */
export class PaintEngine {
  readonly glitter: HTMLCanvasElement;
  private gctx: CanvasRenderingContext2D;
  readonly w: number;
  readonly h: number;
  private cctx: CanvasRenderingContext2D;
  /** Các vùng đã có màu (để tính tiến độ hoàn thành). */
  filled = new Set<number>();
  glitterDirty = true;

  constructor(
    readonly flood: FloodFillEngine,
    readonly color: HTMLCanvasElement,
  ) {
    this.cctx = ctx2d(color);
    this.w = color.width;
    this.h = color.height;
    this.glitter = makeCanvas(Math.round(this.w * GLITTER_SCALE), Math.round(this.h * GLITTER_SCALE));
    this.gctx = ctx2d(this.glitter, true);
  }

  /** Vẽ sẵn "viên gạch" màu của cả ô (đã cắt theo mask). */
  fillTile(mask: RegionMask, p: Paint): HTMLCanvasElement {
    const tile = makeCanvas(mask.w, mask.h);
    const c = ctx2d(tile);
    c.save();
    c.translate(-mask.x, -mask.y);
    c.fillStyle = paintStyle(p);
    c.fillRect(mask.x, mask.y, mask.w, mask.h);
    c.restore();
    c.globalCompositeOperation = 'destination-in';
    c.drawImage(mask.canvas, 0, 0);
    return tile;
  }

  /**
   * Vẽ nét cọ đã khoá vùng vào `target` (cùng kích thước mask).
   * Toàn bộ đường đi được vẽ trong MỘT lần stroke để chất liệu bán trong suốt
   * (sáp dầu) không bị cộng dồn ở chỗ nét tự cắt nhau.
   */
  strokeTile(target: HTMLCanvasElement, mask: RegionMask, pts: number[], size: number, p: Paint, count = pts.length / 2) {
    if (target.width !== mask.w || target.height !== mask.h) {
      target.width = mask.w;
      target.height = mask.h;
    }
    const c = ctx2d(target);
    c.globalCompositeOperation = 'source-over';
    c.clearRect(0, 0, mask.w, mask.h);
    c.save();
    c.translate(-mask.x, -mask.y);
    const style = paintStyle(p);
    c.strokeStyle = style;
    c.fillStyle = style;
    c.lineWidth = size;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    const n = Math.max(1, Math.min(count, pts.length / 2));
    if (n === 1) {
      c.beginPath();
      c.arc(pts[0], pts[1], size / 2, 0, Math.PI * 2);
      c.fill();
    } else {
      c.beginPath();
      c.moveTo(pts[0], pts[1]);
      for (let i = 1; i < n - 1; i++) {
        const mx = (pts[i * 2] + pts[i * 2 + 2]) / 2;
        const my = (pts[i * 2 + 1] + pts[i * 2 + 3]) / 2;
        c.quadraticCurveTo(pts[i * 2], pts[i * 2 + 1], mx, my);
      }
      c.lineTo(pts[n * 2 - 2], pts[n * 2 - 1]);
      c.stroke();
    }
    c.restore();
    c.globalCompositeOperation = 'destination-in';
    c.drawImage(mask.canvas, 0, 0);
    c.globalCompositeOperation = 'source-over';
  }

  private scratch = makeCanvas(1, 1);

  private markGlitter(src: HTMLCanvasElement, mask: RegionMask, on: boolean) {
    const g = this.gctx;
    g.globalCompositeOperation = on ? 'source-over' : 'destination-out';
    g.drawImage(src, mask.x * GLITTER_SCALE, mask.y * GLITTER_SCALE, mask.w * GLITTER_SCALE, mask.h * GLITTER_SCALE);
    g.globalCompositeOperation = 'source-over';
    this.glitterDirty = true;
  }

  /** Áp một thao tác. `tile` (nếu có) là viên gạch đã dựng sẵn cho hiệu ứng loang. */
  apply(a: Action, tile?: HTMLCanvasElement, strokeCount?: number) {
    const c = this.cctx;
    if (a.t === 'clear') {
      this.clear();
      return;
    }
    const id = this.flood.regionAt(a.x, a.y);
    if (!id) return;
    const mask = this.flood.getMask(id);
    if (a.t === 'fill' || a.t === 'erase') {
      c.globalCompositeOperation = 'destination-out';
      c.drawImage(mask.canvas, mask.x, mask.y);
      c.globalCompositeOperation = 'source-over';
      if (a.t === 'fill') {
        c.drawImage(tile ?? this.fillTile(mask, a.p), mask.x, mask.y);
        this.filled.add(id);
        this.markGlitter(mask.canvas, mask, a.p.material === 'glitter');
      } else {
        this.filled.delete(id);
        this.markGlitter(mask.canvas, mask, false);
      }
    } else {
      this.strokeTile(this.scratch, mask, a.pts, a.size, a.p, strokeCount);
      c.drawImage(this.scratch, mask.x, mask.y);
      this.filled.add(id);
      this.markGlitter(this.scratch, mask, a.p.material === 'glitter');
    }
  }

  clear() {
    this.cctx.clearRect(0, 0, this.w, this.h);
    this.gctx.clearRect(0, 0, this.glitter.width, this.glitter.height);
    this.filled.clear();
    this.glitterDirty = true;
  }

  snapshot(): Snapshot {
    const color = makeCanvas(this.w, this.h);
    ctx2d(color).drawImage(this.color, 0, 0);
    const glitter = makeCanvas(this.glitter.width, this.glitter.height);
    ctx2d(glitter).drawImage(this.glitter, 0, 0);
    return { color, glitter, filled: new Set(this.filled) };
  }

  restore(s: Snapshot) {
    this.cctx.clearRect(0, 0, this.w, this.h);
    this.cctx.drawImage(s.color, 0, 0);
    this.gctx.clearRect(0, 0, this.glitter.width, this.glitter.height);
    this.gctx.drawImage(s.glitter, 0, 0);
    this.filled = new Set(s.filled);
    this.glitterDirty = true;
  }

  /** Đọc bản đồ kim tuyến: trả về danh sách ô (toạ độ tranh) đang có kim tuyến. */
  glitterCells(): number[] {
    const w = this.glitter.width;
    const h = this.glitter.height;
    const d = this.gctx.getImageData(0, 0, w, h).data;
    const cells: number[] = [];
    for (let i = 0; i < w * h; i++) if (d[i * 4 + 3] > 250) cells.push(i);
    this.glitterDirty = false;
    return cells;
  }
}
