import { Action } from '../types';
import { PaintEngine, Snapshot } from './PaintEngine';

const KEY_EVERY = 16;
const MAX_KEYS = 5;

/**
 * TimelapseRecorder — sổ ghi lịch sử thao tác (lấy cảm hứng từ Stroke Recording
 * của Atrament): mọi thứ bé làm được lưu thành dãy Action theo thứ tự thời gian.
 *
 *  - Undo/Redo: lùi/tiến con trỏ rồi dựng lại Layer 1 từ ảnh chốt (keyframe)
 *    gần nhất, nên không tốn bộ nhớ lưu ảnh cho từng bước.
 *  - Auto-Save: chỉ cần lưu dãy Action (JSON nhỏ gọn).
 *  - Timelapse: `schedule()` chia thời lượng 5–8 giây cho từng thao tác.
 */
export class TimelapseRecorder {
  actions: Action[] = [];
  private redoStack: Action[] = [];
  private keys: { n: number; snap: Snapshot }[] = [];

  constructor(
    private paint: PaintEngine,
    /** Gọi trước khi chụp ảnh chốt để mọi hiệu ứng đang chạy ghi xong màu. */
    private settle: () => void,
  ) {}

  get canUndo() {
    return this.actions.length > 0;
  }
  get canRedo() {
    return this.redoStack.length > 0;
  }

  /** Nạp lại dãy thao tác đã lưu và dựng tranh. */
  load(actions: Action[]) {
    this.actions = actions.slice();
    this.redoStack = [];
    this.keys = [];
    this.rebuild();
  }

  /** Ghi một thao tác mới (màu do nơi gọi tự áp lên canvas). */
  record(a: Action) {
    this.actions.push(a);
    this.redoStack = [];
  }

  /** Gọi sau khi thao tác đã áp xong để chụp ảnh chốt định kỳ. */
  checkpoint() {
    const n = this.actions.length;
    const lastN = this.keys.length ? this.keys[this.keys.length - 1].n : 0;
    if (n - lastN >= KEY_EVERY) {
      this.settle();
      this.keys.push({ n, snap: this.paint.snapshot() });
      if (this.keys.length > MAX_KEYS) this.keys.shift();
    }
  }

  undo(): boolean {
    const a = this.actions.pop();
    if (!a) return false;
    this.redoStack.push(a);
    this.rebuild();
    return true;
  }

  redo(): boolean {
    const a = this.redoStack.pop();
    if (!a) return false;
    this.settle();
    this.actions.push(a);
    this.paint.apply(a);
    this.checkpoint();
    return true;
  }

  /** Dựng lại tranh từ ảnh chốt gần nhất không vượt quá số thao tác hiện tại. */
  private rebuild() {
    this.settle();
    const n = this.actions.length;
    this.keys = this.keys.filter((k) => k.n <= n);
    const key = this.keys[this.keys.length - 1];
    let from = 0;
    if (key) {
      this.paint.restore(key.snap);
      from = key.n;
    } else {
      this.paint.clear();
    }
    for (let i = from; i < n; i++) {
      this.paint.apply(this.actions[i]);
      const m = i + 1;
      if (m % KEY_EVERY === 0 && n - m < KEY_EVERY * MAX_KEYS && !this.keys.some((k) => k.n === m)) {
        this.keys.push({ n: m, snap: this.paint.snapshot() });
      }
    }
    this.keys.sort((a, b) => a.n - b.n);
    while (this.keys.length > MAX_KEYS) this.keys.shift();
  }

  /** Các thao tác sẽ được phát lại (tính từ lần "xoá toàn bộ" gần nhất). */
  replayList(): Action[] {
    let start = 0;
    for (let i = 0; i < this.actions.length; i++) if (this.actions[i].t === 'clear') start = i + 1;
    return this.actions.slice(start);
  }

  /**
   * Lịch phát Timelapse: tổng thời lượng 5–8 giây tuỳ số thao tác,
   * nét cọ được chia nhiều thời gian hơn ô đổ màu.
   */
  schedule(): { list: Action[]; slots: number[]; total: number } {
    const list = this.replayList();
    const weights = list.map((a) => (a.t === 'stroke' ? 1 + Math.min(3, a.pts.length / 60) : 1));
    const sum = weights.reduce((s, w) => s + w, 0) || 1;
    const total = Math.max(5000, Math.min(8000, list.length * 320));
    return { list, slots: weights.map((w) => (w / sum) * total), total };
  }
}
