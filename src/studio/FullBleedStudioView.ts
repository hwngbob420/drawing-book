import { Action, Artwork, Paint, makeCanvas, ctx2d } from '../types';
import { FloodFillEngine, RegionMask } from '../engine/FloodFillEngine';
import { PaintEngine, GLITTER_SCALE } from '../engine/PaintEngine';
import { RippleAnimator } from '../engine/RippleAnimator';
import { TimelapseRecorder } from '../engine/TimelapseRecorder';
import { WakeUpRenderer } from '../engine/WakeUpRenderer';
import { drawPaper, starPath, paperTileUrl } from '../engine/PatternGenerator';
import { canvasToBlob } from '../engine/LineArtProcessor';
import { sound } from '../audio/SoundManager';
import { PALETTE, nextRainbow } from '../data/Palette';
import { Storage, loadSettings, saveSettings } from '../data/Storage';
import { GENERIC_ANIM } from '../data/BuiltInArtworks';
import { Particles } from '../ui/Particles';
import { h, holdButton, toast } from '../ui/dom';
import { icon, iconUrl, IconName } from '../ui/icons';
import { boing, starRain, stopStars } from '../ui/fx';
import { ViewportController } from './ViewportController';
import { FloatingDock, BRUSH_SIZES } from './FloatingDock';

interface LiveStroke {
  mask: RegionMask;
  pts: number[];
  size: number;
  p: Paint;
  count?: number;
  dirty: boolean;
  sx: number;
  sy: number;
  seedX: number;
  seedY: number;
}

interface Sparkle {
  x: number;
  y: number;
  phase: number;
  speed: number;
  size: number;
}

/**
 * FullBleedStudioView — màn hình tô màu tràn viền.
 * Cả màn hình là giấy vẽ; tờ tranh (4 lớp canvas) nằm giữa, không khung viền.
 * Công cụ là các cụm nút nổi ở góc và một khay viên thuốc nổi phía dưới.
 */
export class FullBleedStudioView {
  readonly el: HTMLElement;
  private stage!: HTMLElement;
  private sheet!: HTMLElement;
  private W = 1600;
  private H = 1200;
  private paper = makeCanvas(1, 1); // Layer 0
  private color = makeCanvas(1, 1); // Layer 1
  private fx = makeCanvas(1, 1); // Layer 2
  private line = makeCanvas(1, 1); // Layer 3
  private fxCtx!: CanvasRenderingContext2D;
  private liveCanvas = makeCanvas(1, 1);

  private flood!: FloodFillEngine;
  private paint!: PaintEngine;
  private recorder!: TimelapseRecorder;
  private ripples = new RippleAnimator();
  private particles!: Particles;
  private wake!: WakeUpRenderer;
  private viewport!: ViewportController;
  private dock: FloatingDock;

  private live: LiveStroke | null = null;
  private sparkles: Sparkle[] = [];
  private fxDrawn = false;
  private raf = 0;
  private significant: number[] = [];
  private wasDone = false;
  private replaying = false;
  private cancelReplay = false;
  private waking = false;
  private wakeTimer = 0;
  private saveTimer = 0;
  private destroyed = false;
  private settings = loadSettings();
  private cleanup: (() => void)[] = [];

  private undoBtn!: HTMLButtonElement;
  private redoBtn!: HTMLButtonElement;
  private meter!: HTMLElement;
  private wakeFrame!: HTMLElement;

  constructor(
    private artwork: Artwork,
    private onExit: () => void,
  ) {
    this.el = h('div', { class: 'studio' });
    sound.enabled = this.settings.sound;
    sound.voiceEnabled = this.settings.voice;
    this.dock = new FloatingDock(() => this.refreshTools());
    this.cleanup.push(() => this.dock.dispose());
    this.build();
  }

  // ------------------------------------------------------------------ DOM

  private build() {
    const btn = (name: IconName, label: string, fn?: () => void, cls = '') => {
      const b = h('button', { class: 'ibtn clay ' + cls, 'aria-label': label, title: label }, icon(name));
      b.addEventListener('click', () => {
        sound.unlock();
        if (!fn) return;
        sound.click();
        boing(b);
        fn();
      });
      return b;
    };
    const setIcon = (b: HTMLElement, name: IconName) => ((b.firstElementChild as HTMLImageElement).src = iconUrl(name));

    // góc trên trái
    this.undoBtn = btn('undo', 'Hoàn tác', () => this.undo(), 'c-yellow');
    this.redoBtn = btn('redo', 'Làm lại', () => this.redo(), 'c-yellow');
    const tl = h('div', { class: 'corner tl' }, btn('back', 'Quay lại', () => this.exit(), 'c-blue'), this.undoBtn, this.redoBtn);

    // góc trên phải: toàn cảnh, đũa thần (trong vòng tiến trình), cài đặt
    this.meter = h('div', { class: 'ring' }, btn('wand', 'Đũa thần: đánh thức bức tranh', () => this.wakeUp(), 'c-pink'));
    const voiceBtn = btn(this.settings.voice ? 'voice' : 'voiceOff', 'Bật/tắt giọng đọc tên màu', () => {
      this.settings.voice = sound.voiceEnabled = !this.settings.voice;
      if (!this.settings.voice) sound.stopSpeech();
      setIcon(voiceBtn, this.settings.voice ? 'voice' : 'voiceOff');
      voiceBtn.classList.toggle('off', !this.settings.voice);
      saveSettings(this.settings);
    });
    voiceBtn.classList.toggle('off', !this.settings.voice);
    const soundBtn = btn(this.settings.sound ? 'soundOn' : 'soundOff', 'Bật/tắt âm thanh', () => {
      this.settings.sound = sound.enabled = !this.settings.sound;
      setIcon(soundBtn, this.settings.sound ? 'soundOn' : 'soundOff');
      soundBtn.classList.toggle('off', !this.settings.sound);
      saveSettings(this.settings);
    });
    soundBtn.classList.toggle('off', !this.settings.sound);
    const resetBtn = btn('trash', 'Nhấn giữ để xoá toàn bộ tranh', undefined, 'c-red');
    holdButton(resetBtn, 2500, () => {
      this.resetAll();
      menu.hidden = true;
    });
    const closing = (fn: () => void) => () => {
      menu.hidden = true;
      fn();
    };
    const menu = h(
      'div',
      { class: 'menu clay', hidden: true },
      btn('film', 'Xem lại quá trình tô', closing(() => this.playTimelapse()), 'c-blue'),
      btn('save', 'Tải ảnh PNG', closing(() => this.savePng()), 'c-green'),
      voiceBtn,
      soundBtn,
      resetBtn,
    );
    const menuBtn = btn('menu', 'Cài đặt', () => (menu.hidden = !menu.hidden));
    const outside = (e: Event) => {
      if (!menu.hidden && !menu.contains(e.target as Node) && !menuBtn.contains(e.target as Node)) menu.hidden = true;
    };
    document.addEventListener('pointerdown', outside, true);
    this.cleanup.push(() => document.removeEventListener('pointerdown', outside, true));
    const tr = h('div', { class: 'corner tr' }, btn('fit', 'Thu về toàn cảnh', () => this.viewport?.fit()), this.meter, menuBtn, menu);

    for (const [c, name] of [
      [this.paper, 'l-paper'],
      [this.color, 'l-color'],
      [this.fx, 'l-fx'],
      [this.line, 'l-line'],
    ] as const)
      c.className = 'layer ' + name;
    this.sheet = h('div', { class: 'sheet' }, this.paper, this.color, this.fx, this.line);
    this.stage = h('div', { class: 'stage' }, this.sheet, h('div', { class: 'loading' }, icon('palette')));
    this.stage.style.backgroundImage = `url(${paperTileUrl()})`;

    // lớp phủ: Thức Giấc + Timelapse + hạt
    const wakeCanvas = h('canvas', { class: 'wake-canvas' });
    this.wake = new WakeUpRenderer(wakeCanvas);
    this.wakeFrame = h('div', { class: 'wake-frame' }, wakeCanvas);
    const wakeEl = h('div', { class: 'wake' }, this.wakeFrame, btn('close', 'Đóng', () => this.wakeStop(), 'close c-yellow'));
    wakeEl.addEventListener('pointerdown', (e) => {
      if ((e.target as HTMLElement).closest('.close')) return;
      this.particles.burst(e.clientX, e.clientY, 16);
      sound.sparkle();
    });
    const stopReplay = btn('stop', 'Dừng phát lại', () => (this.cancelReplay = true), 'stop-replay c-yellow');
    const pcanvas = h('canvas', { class: 'particles' });
    this.particles = new Particles(pcanvas);

    this.el.append(this.stage, tl, tr, this.dock.el, wakeEl, stopReplay, pcanvas);
    this.refreshTools();
  }

  private refreshTools() {
    this.stage.dataset.tool = this.dock.state.tool;
    this.undoBtn.disabled = !this.recorder?.canUndo;
    this.redoBtn.disabled = !this.recorder?.canRedo;
  }

  // ------------------------------------------------------------------ vòng đời

  async start() {
    const lineArt = await this.artwork.render();
    if (this.destroyed) return;
    const W = (this.W = lineArt.width);
    const H = (this.H = lineArt.height);
    for (const c of [this.paper, this.color, this.fx, this.line]) {
      c.width = W;
      c.height = H;
    }
    this.fxCtx = ctx2d(this.fx);
    drawPaper(ctx2d(this.paper), W, H);
    ctx2d(this.line).drawImage(lineArt, 0, 0);
    this.flood = new FloodFillEngine(lineArt);
    this.paint = new PaintEngine(this.flood, this.color);
    this.recorder = new TimelapseRecorder(this.paint, () => this.ripples.flush());
    this.significant = this.flood.significantRegions();
    const saved = await Storage.getProgress(this.artwork.id);
    if (this.destroyed) return;
    if (saved?.actions?.length) this.recorder.load(saved.actions);
    this.wasDone = this.progress() >= 1;
    this.updateMeter();
    this.refreshTools();
    this.stage.querySelector('.loading')?.remove();
    this.wakeFrame.style.setProperty('--ar', String(W / H));

    this.viewport = new ViewportController(this.stage, this.sheet, W, H, {
      wantsStroke: () => this.dock.state.tool === 'brush',
      canPaint: () => !this.replaying && !this.waking,
      tap: (x, y) => this.tap(x, y),
      strokeStart: (x, y) => this.beginStroke(x, y),
      strokeMove: (x, y, speed) => {
        this.moveStroke(x, y);
        sound.scribbleMove(speed, this.dock.state.material === 'crayon');
      },
      strokeEnd: () => this.endStroke(),
      strokeCancel: () => this.cancelStroke(),
      painting: (on) => this.dock.setHidden(on),
    });
    this.cleanup.push(() => this.viewport.dispose());
    this.stage.addEventListener('pointerdown', () => sound.unlock());

    const key = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const k = e.key.toLowerCase();
      if (k === 'z' && !e.shiftKey) (e.preventDefault(), this.undo());
      else if (k === 'y' || (k === 'z' && e.shiftKey)) (e.preventDefault(), this.redo());
    };
    window.addEventListener('keydown', key);
    this.cleanup.push(() => window.removeEventListener('keydown', key));
    const hide = () => document.hidden && this.saveNow();
    document.addEventListener('visibilitychange', hide);
    this.cleanup.push(() => document.removeEventListener('visibilitychange', hide));

    const loop = (now: number) => {
      this.raf = requestAnimationFrame(loop);
      this.frame(now);
    };
    this.raf = requestAnimationFrame(loop);
  }

  private async exit() {
    this.cancelReplay = true;
    this.wakeStop();
    await this.saveNow();
    this.destroy();
    this.onExit();
  }

  destroy() {
    this.destroyed = true;
    cancelAnimationFrame(this.raf);
    clearTimeout(this.saveTimer);
    clearInterval(this.wakeTimer);
    this.wake.stop();
    stopStars();
    sound.musicStop();
    sound.scribbleStop();
    sound.stopSpeech();
    this.cleanup.forEach((f) => f());
    this.el.remove();
  }

  private hitRadius() {
    // 8px trên màn hình, quy đổi sang toạ độ tranh ở mức zoom hiện tại
    return Math.max(8, Math.min(40, 8 * this.viewport.artPerCssPx));
  }

  private currentPaint(): Paint {
    const s = this.dock.state;
    const color = s.colorIdx < 0 ? nextRainbow() : PALETTE[s.colorIdx].hex;
    return s.material === 'pattern' ? { color, material: 'pattern', pattern: s.pattern } : { color, material: s.material };
  }

  // ------------------------------------------------------------------ thao tác tô

  private tap(wx: number, wy: number) {
    const hit = this.flood.smartHit(wx, wy, this.hitRadius());
    if (!hit) return;
    this.ripples.flush(hit.id);
    if (this.dock.state.tool === 'erase') {
      if (!this.paint.filled.has(hit.id)) return;
      const a: Action = { t: 'erase', x: hit.x, y: hit.y };
      this.recorder.record(a);
      this.paint.apply(a);
      sound.unpop();
      this.afterChange();
      return;
    }
    const p = this.currentPaint();
    const a: Action = { t: 'fill', x: hit.x, y: hit.y, p };
    const mask = this.flood.getMask(hit.id);
    const tile = this.paint.fillTile(mask, p);
    this.recorder.record(a);
    this.ripples.start(hit.id, tile, mask.x, mask.y, hit.x, hit.y, () => {
      this.paint.apply(a, tile);
      this.afterChange();
    });
    sound.pop();
    this.refreshTools();
  }

  private beginStroke(wx: number, wy: number): boolean {
    const hit = this.flood.smartHit(wx, wy, this.hitRadius());
    if (!hit) return false;
    this.ripples.flush(hit.id);
    // Khoá vùng: lấy mask của ô ngay khi ngón tay chạm xuống
    const mask = this.flood.getMask(hit.id);
    this.live = {
      mask,
      pts: [hit.x, hit.y],
      size: BRUSH_SIZES[this.dock.state.sizeIdx],
      p: this.currentPaint(),
      dirty: true,
      sx: wx,
      sy: wy,
      seedX: hit.x,
      seedY: hit.y,
    };
    sound.scribbleStart(this.dock.state.material === 'crayon');
    return true;
  }

  private moveStroke(wx: number, wy: number) {
    const l = this.live;
    if (!l) return;
    // Làm mượt nét (kiểu Atrament): điểm vẽ bám theo ngón tay có quán tính
    l.sx += (wx - l.sx) * 0.55;
    l.sy += (wy - l.sy) * 0.55;
    const n = l.pts.length;
    if (Math.hypot(l.sx - l.pts[n - 2], l.sy - l.pts[n - 1]) < 3) return;
    l.pts.push(Math.round(l.sx), Math.round(l.sy));
    l.dirty = true;
  }

  private endStroke() {
    const l = this.live;
    this.live = null;
    sound.scribbleStop();
    if (!l) return;
    const a: Action = { t: 'stroke', x: l.seedX, y: l.seedY, pts: l.pts, size: l.size, p: l.p };
    this.recorder.record(a);
    this.paint.apply(a);
    this.afterChange();
  }

  private cancelStroke() {
    this.live = null;
    sound.scribbleStop();
  }

  private undo() {
    if (this.replaying || !this.recorder?.undo()) return;
    this.afterChange(false);
  }

  private redo() {
    if (this.replaying || !this.recorder?.redo()) return;
    this.afterChange(false);
  }

  private resetAll() {
    if (!this.recorder || this.replaying) return;
    this.ripples.flush();
    const a: Action = { t: 'clear' };
    this.recorder.record(a);
    this.paint.apply(a);
    sound.unpop();
    toast('Đã xoá tranh — bấm nút quay lại nếu muốn lấy lại nhé!');
    this.afterChange(false);
  }

  private progress(): number {
    if (!this.significant.length) return 0;
    let n = 0;
    for (const id of this.significant) if (this.paint.filled.has(id)) n++;
    const p = n / this.significant.length;
    return p >= 0.97 ? 1 : p;
  }

  private updateMeter() {
    const p = this.progress();
    this.meter.style.setProperty('--p', String(p));
    this.meter.classList.toggle('done', p >= 1);
  }

  private afterChange(celebrate = true) {
    this.refreshTools();
    this.updateMeter();
    if (this.replaying) return;
    const done = this.progress() >= 1;
    if (done && !this.wasDone && celebrate) {
      sound.chime();
      starRain(1.2);
      toast('Tuyệt vời! Bé đã tô xong bức tranh!');
    }
    this.wasDone = done;
    clearTimeout(this.saveTimer);
    this.saveTimer = window.setTimeout(() => this.saveNow(), 900);
  }

  // ------------------------------------------------------------------ Layer 2: vòng lặp hiệu ứng

  private frame(now: number) {
    if (!this.paint || this.waking) return;
    if (this.paint.glitterDirty && !this.ripples.active) this.rebuildSparkles();
    const need = this.ripples.active || !!this.live || this.sparkles.length > 0;
    if (!need && !this.fxDrawn) {
      if (!this.replaying) this.recorder.checkpoint();
      return;
    }
    const c = this.fxCtx;
    c.clearRect(0, 0, this.W, this.H);
    this.fxDrawn = need;
    if (this.live) {
      const l = this.live;
      if (l.dirty) {
        this.paint.strokeTile(this.liveCanvas, l.mask, l.pts, l.size, l.p, l.count);
        l.dirty = false;
      }
      c.drawImage(this.liveCanvas, l.mask.x, l.mask.y);
    }
    this.ripples.draw(c, now);
    this.drawSparkles(c, now / 1000);
    if (!this.ripples.active && !this.live && !this.replaying) this.recorder.checkpoint();
  }

  private rebuildSparkles() {
    const cells = this.paint.glitterCells();
    const gw = this.paint.glitter.width;
    const n = Math.min(380, Math.ceil(cells.length / 5));
    this.sparkles = [];
    for (let i = 0; i < n; i++) {
      const cell = cells[(Math.random() * cells.length) | 0];
      this.sparkles.push({
        x: ((cell % gw) + Math.random()) / GLITTER_SCALE,
        y: (Math.floor(cell / gw) + Math.random()) / GLITTER_SCALE,
        phase: Math.random() * 6.28,
        speed: 2 + Math.random() * 4,
        size: 7 + Math.random() * 12,
      });
    }
  }

  private drawSparkles(c: CanvasRenderingContext2D, t: number, frozen = false) {
    if (!this.sparkles.length) return;
    c.fillStyle = '#fff';
    for (const s of this.sparkles) {
      let a = frozen ? 0.35 + 0.65 * Math.abs(Math.sin(s.phase * 3)) : Math.sin(t * s.speed + s.phase);
      if (a <= 0.05) continue;
      a = a * a;
      c.globalAlpha = a;
      starPath(c, s.x, s.y, s.size * (0.5 + a * 0.5), 0.22, 4, 0);
      c.fill();
    }
    c.globalAlpha = 1;
  }

  /** Gộp 4 lớp thành một ảnh phẳng. */
  private flatten(target: CanvasRenderingContext2D, x = 0, y = 0, w = this.W, hh = this.H, withSparkles = true) {
    this.ripples.flush();
    target.drawImage(this.paper, x, y, w, hh);
    target.drawImage(this.color, x, y, w, hh);
    if (withSparkles && this.sparkles.length) {
      const tmp = makeCanvas(this.W, this.H);
      this.drawSparkles(ctx2d(tmp), 0, true);
      target.drawImage(tmp, x, y, w, hh);
    }
    target.drawImage(this.line, x, y, w, hh);
  }

  // ------------------------------------------------------------------ Auto-Save

  private async saveNow() {
    clearTimeout(this.saveTimer);
    if (!this.recorder || this.replaying) return;
    const thumb = makeCanvas(Math.round(this.W * 0.3), Math.round(this.H * 0.3));
    this.flatten(ctx2d(thumb), 0, 0, thumb.width, thumb.height, false);
    await Storage.saveProgress({
      id: this.artwork.id,
      actions: this.recorder.actions,
      thumb: this.recorder.replayList().length ? thumb.toDataURL('image/jpeg', 0.8) : undefined,
      done: this.progress() >= 1,
      updated: Date.now(),
    });
  }

  // ------------------------------------------------------------------ Timelapse

  private async playTimelapse() {
    if (this.replaying || !this.recorder) return;
    const { list, slots } = this.recorder.schedule();
    if (!list.length) {
      toast('Bé hãy tô vài ô trước đã nhé!');
      return;
    }
    await this.saveNow();
    this.ripples.flush();
    this.replaying = true;
    this.cancelReplay = false;
    this.el.classList.add('replaying');
    this.viewport.fit(false);
    this.dock.closePops();
    this.paint.clear();
    this.updateMeter();
    const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
    const nextFrame = () => new Promise<number>((r) => requestAnimationFrame(r));
    await wait(350);
    for (let i = 0; i < list.length && !this.cancelReplay && !this.destroyed; i++) {
      const a = list[i];
      const slot = slots[i];
      if (a.t === 'fill') {
        const id = this.flood.regionAt(a.x, a.y);
        if (id) {
          this.ripples.flush(id);
          const mask = this.flood.getMask(id);
          const tile = this.paint.fillTile(mask, a.p);
          this.ripples.start(id, tile, mask.x, mask.y, a.x, a.y, () => this.paint.apply(a, tile), 1.6);
          if (slot > 90) sound.pop();
        }
        await wait(slot);
      } else if (a.t === 'stroke') {
        const id = this.flood.regionAt(a.x, a.y);
        if (id) {
          this.ripples.flush(id);
          const total = a.pts.length / 2;
          this.live = { mask: this.flood.getMask(id), pts: a.pts, size: a.size, p: a.p, count: 1, dirty: true, sx: 0, sy: 0, seedX: a.x, seedY: a.y };
          const t0 = performance.now();
          while (!this.cancelReplay && !this.destroyed) {
            const t = (performance.now() - t0) / slot;
            if (t >= 1) break;
            this.live.count = Math.max(1, Math.ceil(t * total));
            this.live.dirty = true;
            await nextFrame();
          }
          this.live = null;
          this.paint.apply(a);
        }
      } else {
        this.paint.apply(a);
        await wait(slot);
      }
      this.updateMeter();
    }
    if (this.destroyed) return;
    await wait(this.cancelReplay ? 0 : 500);
    // trả tranh về đúng trạng thái hiện tại
    this.live = null;
    this.ripples.cancel();
    this.recorder.load(this.recorder.actions);
    this.replaying = false;
    this.el.classList.remove('replaying');
    this.updateMeter();
    this.refreshTools();
    if (!this.cancelReplay) {
      sound.sparkle();
      starRain(0.6);
    }
  }

  // ------------------------------------------------------------------ Bức Tranh Thức Giấc

  private wakeUp() {
    if (this.waking || this.replaying || !this.paint) return;
    const flat = makeCanvas(this.W, this.H);
    this.flatten(ctx2d(flat));
    this.waking = true;
    this.el.classList.add('waking');
    this.wake.start(flat, this.artwork.anim.length ? this.artwork.anim : GENERIC_ANIM);
    sound.chime();
    setTimeout(() => this.waking && sound.musicStart(), 700);
    starRain(1.4);
    this.wakeTimer = window.setInterval(() => starRain(0.5), 2800);
  }

  private wakeStop() {
    if (!this.waking) return;
    this.waking = false;
    clearInterval(this.wakeTimer);
    this.wake.stop();
    sound.musicStop();
    this.particles.clear();
    stopStars();
    this.el.classList.remove('waking');
    this.fxDrawn = true;
  }

  // ------------------------------------------------------------------ Lưu ảnh PNG

  private async savePng() {
    if (!this.paint) return;
    const M = 90;
    const B = 170;
    const ART_W = this.W;
    const ART_H = this.H;
    const W = ART_W + M * 2;
    const H = ART_H + M + B;
    const out = makeCanvas(W, H);
    const c = ctx2d(out);
    // khung tranh
    const g = c.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, '#ffd166');
    g.addColorStop(0.5, '#ff9ecb');
    g.addColorStop(1, '#8fd3ff');
    c.fillStyle = g;
    c.beginPath();
    c.roundRect(0, 0, W, H, 70);
    c.fill();
    c.fillStyle = 'rgba(255,255,255,0.55)';
    const dots: [number, number, number][] = [];
    for (let x = 45; x < W; x += 118) dots.push([x, 45, 13]);
    for (let y = 150; y < H - 120; y += 118) dots.push([45, y, 13], [W - 45, y + 59, 13]);
    for (const [x, y, r] of dots) {
      starPath(c, x, y, r);
      c.fill();
    }
    c.fillStyle = '#fff';
    c.beginPath();
    c.roundRect(M - 16, M - 16, ART_W + 32, ART_H + 32, 36);
    c.fill();
    c.save();
    c.beginPath();
    c.roundRect(M, M, ART_W, ART_H, 24);
    c.clip();
    this.flatten(c, M, M);
    c.restore();
    // chữ ký ngày tháng
    const d = new Date();
    const date = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    c.textAlign = 'center';
    c.fillStyle = '#5a3d7a';
    c.font = '700 54px "Baloo 2", "Nunito", "Comic Sans MS", "Segoe UI", sans-serif';
    c.fillText(this.artwork.title, W / 2, H - 92);
    c.font = '600 34px "Nunito", "Comic Sans MS", "Segoe UI", sans-serif';
    c.fillStyle = 'rgba(90,61,122,0.8)';
    c.fillText(`Sách Tô Màu Phép Thuật  •  ${date}`, W / 2, H - 42);

    const blob = await canvasToBlob(out);
    const url = URL.createObjectURL(blob);
    const a = h('a', { href: url, download: `to-mau-${this.artwork.id}-${d.toISOString().slice(0, 10)}.png` });
    document.body.append(a);
    a.click();
    a.remove();
    // Điện thoại và trang nhúng thường chặn tải file tự động: hiện luôn ảnh để nhấn giữ và lưu
    const view = h('div', { class: 'png-view no-paint' }, h('img', { src: url, alt: this.artwork.title }), h('p', {}, 'Nhấn giữ vào ảnh để lưu nếu máy chưa tự tải về'));
    const close = h('button', { class: 'ibtn clay c-yellow close', 'aria-label': 'Đóng' }, icon('close'));
    close.addEventListener('click', () => {
      view.remove();
      URL.revokeObjectURL(url);
    });
    view.append(close);
    this.el.append(view);
  }
}
