import panzoom, { PanZoom } from 'panzoom';
import interact from 'interactjs';

/**
 * ViewportController — điều hướng tờ giấy và phân xử cử chỉ.
 *
 *  - panzoom: giữ ma trận biến đổi của tờ giấy (zoom 1x–4x, kéo có quán tính,
 *    con lăn chuột, pinch 2 ngón).
 *  - interact.js: nhận diện cử chỉ NHIỀU ngón (gesturable). Ngay khi cử chỉ
 *    bắt đầu, mọi thao tác tô bị khoá và nét đang vẽ dở bị huỷ, nên không bao
 *    giờ có vệt màu rác khi bé đặt 2 ngón tay lên màn hình.
 *  - 1 ngón tay / chuột trái = tô. 2 ngón, phím Space + kéo, hoặc chuột phải = dời giấy.
 */

export interface ViewportHost {
  /** Có vẽ nét liên tục (cọ) hay chỉ chạm (đổ màu / tẩy)? */
  wantsStroke(): boolean;
  canPaint(): boolean;
  tap(x: number, y: number): void;
  strokeStart(x: number, y: number): boolean;
  strokeMove(x: number, y: number, speed: number): void;
  strokeEnd(): void;
  strokeCancel(): void;
  /** Bé đang đặt ngón tay tô (để khay công cụ tự né). */
  painting(active: boolean): void;
}

const MAX_ZOOM = 4;

export class ViewportController {
  private pz: PanZoom;
  private fitW = 1;
  private fitH = 1;
  private navigating = false;
  private space = false;
  private clamping = false;
  private cleanup: (() => void)[] = [];

  constructor(
    private stage: HTMLElement,
    private sheet: HTMLElement,
    private artW: number,
    private artH: number,
    private host: ViewportHost,
  ) {
    // panzoom mặc định coi 1 ngón là kéo trang; ta chặn touchstart 1 ngón để dành cho việc tô.
    const block = (e: TouchEvent) => {
      if (e.touches.length < 2) e.stopImmediatePropagation();
    };
    stage.addEventListener('touchstart', block, { capture: true, passive: true });
    this.cleanup.push(() => stage.removeEventListener('touchstart', block, { capture: true } as EventListenerOptions));

    this.pz = panzoom(sheet, {
      minZoom: 1,
      maxZoom: MAX_ZOOM,
      zoomSpeed: 0.12,
      pinchSpeed: 1.2,
      smoothScroll: true, // quán tính khi thả tay
      zoomDoubleClickSpeed: 1, // tắt double-click zoom
      beforeMouseDown: () => !this.space, // chuột trái chỉ kéo trang khi giữ Space
      onTouch: () => true,
      disableKeyboardInteraction: true,
    } as any);
    this.pz.on('transform', () => this.clamp());
    this.cleanup.push(() => this.pz.dispose());

    // interact.js: cử chỉ nhiều ngón -> khoá tô
    const it = interact(stage).gesturable({
      listeners: {
        start: () => this.beginNavigation(),
        end: () => (this.navigating = false),
      },
    });
    this.cleanup.push(() => it.unset());

    const key = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      this.space = e.type === 'keydown';
      stage.classList.toggle('pan-mode', this.space);
      if (this.space) e.preventDefault();
    };
    window.addEventListener('keydown', key);
    window.addEventListener('keyup', key);
    this.cleanup.push(() => (window.removeEventListener('keydown', key), window.removeEventListener('keyup', key)));

    this.bindPaint();
    const ro = new ResizeObserver(() => this.layout());
    ro.observe(stage);
    this.cleanup.push(() => ro.disconnect());
    this.layout();
  }

  dispose() {
    this.cleanup.forEach((f) => f());
  }

  get scale() {
    return this.pz.getTransform().scale;
  }

  /** Số pixel tranh trên mỗi pixel CSS ở mức zoom hiện tại. */
  get artPerCssPx() {
    return this.artW / (this.fitW * this.scale);
  }

  /**
   * Quy đổi toạ độ ngón tay trên màn hình -> toạ độ pixel trên canvas tranh.
   * Dựa trên ma trận của panzoom (x, y, scale) nên đúng ở mọi mức zoom; hệ số
   * artW/fitW đã gồm cả tỉ lệ giữa pixel nền canvas và pixel CSS (devicePixelRatio
   * không ảnh hưởng vì canvas có độ phân giải cố định, không phụ thuộc màn hình).
   */
  screenToCanvasCoords(clientX: number, clientY: number): [number, number] {
    const r = this.stage.getBoundingClientRect();
    const t = this.pz.getTransform();
    const k = this.artW / this.fitW;
    return [((clientX - r.left - t.x) / t.scale) * k, ((clientY - r.top - t.y) / t.scale) * k];
  }

  /** Tờ giấy tự căn giữa và bung rộng tối đa theo màn hình. */
  private layout() {
    const sw = this.stage.clientWidth;
    const sh = this.stage.clientHeight;
    if (!sw || !sh) return;
    const s = Math.min(sw / this.artW, sh / this.artH);
    this.fitW = this.artW * s;
    this.fitH = this.artH * s;
    this.sheet.style.width = this.fitW + 'px';
    this.sheet.style.height = this.fitH + 'px';
    this.clamp(true);
  }

  /** Giữ tờ giấy trong tầm nhìn: căn giữa khi nhỏ hơn màn hình, không kéo lố khi đã zoom. */
  private clamp(force = false) {
    if (this.clamping) return;
    const t = this.pz.getTransform();
    const sw = this.stage.clientWidth;
    const sh = this.stage.clientHeight;
    const scale = Math.max(1, Math.min(MAX_ZOOM, t.scale));
    const w = this.fitW * scale;
    const h = this.fitH * scale;
    // Khi đã zoom, cho kéo lố một đoạn để phần tranh nằm dưới các nút nổi và khay bút vẫn với tới được
    const zoomed = scale > 1.01;
    const padX = zoomed ? 24 : 0;
    const padT = zoomed ? 84 : 0;
    const padB = zoomed ? 112 : 0;
    const x = w <= sw ? (sw - w) / 2 : Math.min(padX, Math.max(sw - w - padX, t.x));
    const y = h <= sh ? (sh - h) / 2 : Math.min(padT, Math.max(sh - h - padB, t.y));
    if (!force && Math.abs(x - t.x) < 0.5 && Math.abs(y - t.y) < 0.5 && scale === t.scale) return;
    this.clamping = true;
    t.scale = scale;
    this.pz.moveTo(x, y);
    this.clamping = false;
    this.stage.classList.toggle('zoomed', scale > 1.01);
  }

  /** Thu về toàn cảnh: zoom 1x, căn giữa. */
  fit(smooth = true) {
    const t = this.pz.getTransform();
    if (!smooth || t.scale <= 1.01) {
      t.scale = 1;
      this.clamp(true);
      return;
    }
    const from = { s: t.scale, x: t.x, y: t.y };
    const tx = (this.stage.clientWidth - this.fitW) / 2;
    const ty = (this.stage.clientHeight - this.fitH) / 2;
    const t0 = performance.now();
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / 280);
      const e = 1 - (1 - k) * (1 - k);
      this.clamping = true;
      t.scale = from.s + (1 - from.s) * e;
      this.pz.moveTo(from.x + (tx - from.x) * e, from.y + (ty - from.y) * e);
      this.clamping = false;
      if (k < 1) requestAnimationFrame(step);
      else this.clamp(true);
    };
    requestAnimationFrame(step);
  }

  private beginNavigation() {
    this.navigating = true;
    this.abortPaint?.();
  }

  private abortPaint: (() => void) | null = null;

  /** Thao tác tô bằng 1 ngón tay / chuột trái. */
  private bindPaint() {
    const st = this.stage;
    const active = new Set<number>();
    type G = { k: 'tap'; id: number; x0: number; y0: number } | { k: 'stroke'; id: number; lx: number; ly: number } | { k: 'pan'; id: number; lx: number; ly: number } | { k: 'dead' };
    let g: G | null = null;

    const stop = () => {
      if (g?.k === 'stroke') this.host.strokeCancel();
      if (g && g.k !== 'dead' && g.k !== 'pan') this.host.painting(false);
      g = active.size ? { k: 'dead' } : null;
    };
    this.abortPaint = stop;

    const down = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest('.no-paint')) return;
      active.add(e.pointerId);
      if (active.size >= 2 || this.navigating) return stop(); // ngón thứ hai chạm xuống
      if (!this.host.canPaint()) return;
      if (e.pointerType === 'mouse') {
        if (e.button === 2 || e.button === 1) {
          g = { k: 'pan', id: e.pointerId, lx: e.clientX, ly: e.clientY };
          st.setPointerCapture(e.pointerId);
          return;
        }
        if (this.space) return; // panzoom đang kéo trang
      }
      try {
        st.setPointerCapture(e.pointerId);
      } catch {}
      const [x, y] = this.screenToCanvasCoords(e.clientX, e.clientY);
      if (this.host.wantsStroke()) {
        if (!this.host.strokeStart(x, y)) {
          g = { k: 'dead' };
          return;
        }
        g = { k: 'stroke', id: e.pointerId, lx: e.clientX, ly: e.clientY };
      } else g = { k: 'tap', id: e.pointerId, x0: e.clientX, y0: e.clientY };
      this.host.painting(true);
    };

    const move = (e: PointerEvent) => {
      if (!g || g.k === 'dead' || g.id !== e.pointerId) return;
      if (g.k === 'pan') {
        this.pz.moveBy(e.clientX - g.lx, e.clientY - g.ly, false);
        g.lx = e.clientX;
        g.ly = e.clientY;
      } else if (g.k === 'stroke') {
        const evs = (e as any).getCoalescedEvents?.() as PointerEvent[] | undefined;
        const speed = Math.hypot(e.clientX - g.lx, e.clientY - g.ly);
        for (const ev of evs?.length ? evs : [e]) {
          const [x, y] = this.screenToCanvasCoords(ev.clientX, ev.clientY);
          this.host.strokeMove(x, y, speed);
        }
        g.lx = e.clientX;
        g.ly = e.clientY;
      } else if (Math.hypot(e.clientX - g.x0, e.clientY - g.y0) > 24) {
        // trượt xa quá thì không tính là chạm
        this.host.painting(false);
        g = { k: 'dead' };
      }
    };

    const up = (e: PointerEvent) => {
      if (!active.delete(e.pointerId) && !g) return;
      const cur = g;
      if (cur && cur.k !== 'dead' && cur.id === e.pointerId) {
        if (cur.k === 'tap') {
          this.host.painting(false);
          if (e.type === 'pointerup') {
            const [x, y] = this.screenToCanvasCoords(e.clientX, e.clientY);
            this.host.tap(x, y);
          }
        } else if (cur.k === 'stroke') {
          this.host.painting(false);
          if (e.type === 'pointerup') this.host.strokeEnd();
          else this.host.strokeCancel();
        }
        g = null;
      }
      if (active.size === 0) g = null;
    };

    st.addEventListener('pointerdown', down);
    st.addEventListener('pointermove', move);
    st.addEventListener('pointerup', up);
    st.addEventListener('pointercancel', up);
    const noMenu = (e: Event) => e.preventDefault();
    st.addEventListener('contextmenu', noMenu);
    this.cleanup.push(() => {
      st.removeEventListener('pointerdown', down);
      st.removeEventListener('pointermove', move);
      st.removeEventListener('pointerup', up);
      st.removeEventListener('pointercancel', up);
      st.removeEventListener('contextmenu', noMenu);
    });
  }
}
