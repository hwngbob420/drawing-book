import { starPath } from '../engine/PatternGenerator';

interface P {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  size: number;
  color: string;
  life: number;
  max: number;
  star: boolean;
  g: number;
}

const COLORS = ['#ff4d4d', '#ffd93d', '#4ccb5f', '#3b9bff', '#ff7eb6', '#9b6bff', '#ff8a3d', '#3fd6c4'];

/** Lớp hạt (pháo giấy & sao lấp lánh) vẽ theo toạ độ màn hình. */
export class Particles {
  private list: P[] = [];
  private ctx: CanvasRenderingContext2D;
  private raf = 0;
  private last = 0;

  constructor(readonly canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
  }

  private fit() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.round(this.canvas.clientWidth * dpr);
    const h = Math.round(this.canvas.clientHeight * dpr);
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /** Chùm sao bắn ra từ một điểm (toạ độ client). */
  burst(cx: number, cy: number, n = 14) {
    const r = this.canvas.getBoundingClientRect();
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = 120 + Math.random() * 260;
      this.list.push({
        x: cx - r.left,
        y: cy - r.top,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v - 80,
        rot: Math.random() * 6,
        vr: (Math.random() - 0.5) * 8,
        size: 7 + Math.random() * 11,
        color: COLORS[(Math.random() * COLORS.length) | 0],
        life: 0,
        max: 0.7 + Math.random() * 0.5,
        star: true,
        g: 420,
      });
    }
    this.run();
  }

  /** Mưa pháo giấy + sao bay lên. */
  confetti(n = 120) {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    for (let i = 0; i < n; i++) {
      const up = i % 3 === 0;
      this.list.push({
        x: Math.random() * w,
        y: up ? h + 20 : -20 - Math.random() * h * 0.5,
        vx: (Math.random() - 0.5) * 120,
        vy: up ? -(260 + Math.random() * 300) : 120 + Math.random() * 220,
        rot: Math.random() * 6,
        vr: (Math.random() - 0.5) * 10,
        size: up ? 9 + Math.random() * 12 : 8 + Math.random() * 9,
        color: COLORS[(Math.random() * COLORS.length) | 0],
        life: 0,
        max: 2.4 + Math.random() * 1.6,
        star: up,
        g: up ? 60 : 90,
      });
    }
    this.run();
  }

  clear() {
    this.list = [];
  }

  private run() {
    if (this.raf) return;
    this.last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - this.last) / 1000);
      this.last = now;
      this.fit();
      const c = this.ctx;
      c.clearRect(0, 0, this.canvas.clientWidth, this.canvas.clientHeight);
      this.list = this.list.filter((p) => (p.life += dt) < p.max);
      for (const p of this.list) {
        p.vy += p.g * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;
        c.save();
        c.translate(p.x, p.y);
        c.rotate(p.rot);
        c.globalAlpha = Math.min(1, (p.max - p.life) * 2.5);
        c.fillStyle = p.color;
        if (p.star) {
          starPath(c, 0, 0, p.size);
          c.fill();
        } else {
          c.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.66);
        }
        c.restore();
      }
      if (this.list.length) this.raf = requestAnimationFrame(loop);
      else this.raf = 0;
    };
    this.raf = requestAnimationFrame(loop);
  }
}
