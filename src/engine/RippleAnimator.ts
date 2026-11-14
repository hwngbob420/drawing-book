import { makeCanvas, ctx2d } from '../types';

interface Ripple {
  key: number;
  tile: HTMLCanvasElement;
  x: number;
  y: number;
  cx: number;
  cy: number;
  maxR: number;
  t0: number;
  dur: number;
  done: () => void;
}

/**
 * RippleAnimator — hiệu ứng màu loang gợn sóng (Ripple Fill).
 * Viên gạch màu của cả ô đã được dựng sẵn; mỗi khung hình ta chỉ lộ dần nó
 * qua một vòng tròn mép mềm lớn dần từ điểm chạm, kèm vài gợn sóng sáng chạy
 * theo sau mép loang. Khi loang xong, `done()` ghi màu xuống Layer 1.
 */
export class RippleAnimator {
  private list: Ripple[] = [];
  private scratch = makeCanvas(1, 1);

  get active() {
    return this.list.length > 0;
  }

  start(key: number, tile: HTMLCanvasElement, x: number, y: number, cx: number, cy: number, done: () => void, speed = 1) {
    const maxR =
      Math.sqrt(Math.max((cx - x) ** 2, (x + tile.width - cx) ** 2) + Math.max((cy - y) ** 2, (y + tile.height - cy) ** 2)) + 30;
    const dur = Math.min(950, 300 + maxR * 0.5) / speed;
    this.list.push({ key, tile, x, y, cx, cy, maxR, t0: performance.now(), dur, done });
  }

  /** Kết thúc ngay các gợn sóng (của một vùng, hoặc tất cả) theo đúng thứ tự bắt đầu. */
  flush(key?: number) {
    const rest: Ripple[] = [];
    for (const r of this.list) {
      if (key === undefined || r.key === key) r.done();
      else rest.push(r);
    }
    this.list = rest;
  }

  /** Huỷ mà không ghi màu. */
  cancel() {
    this.list = [];
  }

  draw(out: CanvasRenderingContext2D, now: number) {
    const rest: Ripple[] = [];
    for (const r of this.list) {
      const t = (now - r.t0) / r.dur;
      if (t >= 1) {
        r.done();
        continue;
      }
      rest.push(r);
      const e = 1 - (1 - t) * (1 - t); // ease-out
      const rad = Math.max(1, e * r.maxR);
      const s = this.scratch;
      if (s.width < r.tile.width || s.height < r.tile.height) {
        s.width = Math.max(s.width, r.tile.width);
        s.height = Math.max(s.height, r.tile.height);
      }
      const c = ctx2d(s);
      const lx = r.cx - r.x;
      const ly = r.cy - r.y;
      c.globalCompositeOperation = 'source-over';
      c.clearRect(0, 0, r.tile.width, r.tile.height);
      c.drawImage(r.tile, 0, 0);
      // các gợn sóng sáng chạy sau mép loang
      c.globalCompositeOperation = 'source-atop';
      c.strokeStyle = '#fff';
      for (let k = 0; k < 3; k++) {
        const rr = rad - 10 - k * 38 - ((now / 14) % 38);
        if (rr <= 4) continue;
        c.globalAlpha = (0.42 - k * 0.12) * (1 - t);
        c.lineWidth = 12 - k * 3;
        c.beginPath();
        c.arc(lx, ly, rr, 0, Math.PI * 2);
        c.stroke();
      }
      c.globalAlpha = 1;
      // mặt nạ tròn mép mềm
      c.globalCompositeOperation = 'destination-in';
      const g = c.createRadialGradient(lx, ly, Math.max(0, rad - 22), lx, ly, rad);
      g.addColorStop(0, 'rgba(0,0,0,1)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g;
      c.fillRect(0, 0, r.tile.width, r.tile.height);
      c.globalCompositeOperation = 'source-over';
      out.drawImage(s, 0, 0, r.tile.width, r.tile.height, r.x, r.y, r.tile.width, r.tile.height);
    }
    this.list = rest;
  }
}
