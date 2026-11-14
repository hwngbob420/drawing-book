import { Material, PatternKind } from '../types';
import { PALETTE } from '../data/Palette';
import { sound } from '../audio/SoundManager';
import { h } from '../ui/dom';
import { icon, iconUrl, IconName } from '../ui/icons';
import { boing, popCrayon, restCrayon } from '../ui/fx';

export type Tool = 'fill' | 'brush' | 'erase';
export const BRUSH_SIZES = [26, 46, 78];

export interface DockState {
  tool: Tool;
  material: Material;
  pattern: PatternKind;
  sizeIdx: number;
  colorIdx: number; // -1 = bút cầu vồng
}

const TOOL_ICON: Record<Tool, IconName> = { fill: 'bucket', brush: 'brush', erase: 'eraser' };
const MAT_ICON: Record<Material, IconName> = { marker: 'marker', crayon: 'crayon', glitter: 'glitter', pattern: 'pattern' };

/**
 * FloatingDock — khay hoạ sĩ nổi hình viên thuốc.
 * Trên khay chỉ có: [công cụ đang chọn] [chất liệu đang chọn] [dải bút sáp].
 * Bấm vào nút công cụ / chất liệu sẽ xoè một bong bóng lựa chọn phía trên.
 * Khi bé đang tô, khay tự trượt xuống và mờ đi (`setHidden(true)`).
 */
export class FloatingDock {
  readonly el: HTMLElement;
  readonly state: DockState = { tool: 'fill', material: 'marker', pattern: 'dots', sizeIdx: 1, colorIdx: 0 };
  private toolBtn: HTMLButtonElement;
  private matBtn: HTMLButtonElement;
  private toolPop: HTMLElement;
  private matPop: HTMLElement;
  private strip: HTMLElement;
  private offOutside: () => void;

  constructor(private onChange: () => void) {
    const mk = (name: IconName | null, label: string, fn: () => void, cls = '') => {
      const b = h('button', { class: 'ibtn clay ' + cls, 'aria-label': label, title: label }, name ? icon(name) : h('span', {}));
      b.addEventListener('click', () => {
        sound.unlock();
        sound.click();
        boing(b);
        fn();
      });
      return b;
    };

    // --- bong bóng công cụ
    this.toolPop = h('div', { class: 'pop clay', hidden: true });
    const tools: [Tool, string][] = [
      ['fill', 'Thùng sơn đổ màu'],
      ['brush', 'Cọ tô tự do'],
      ['erase', 'Cục tẩy'],
    ];
    for (const [t, label] of tools) {
      const b = mk(TOOL_ICON[t], label, () => {
        this.state.tool = t;
        this.closePops();
        this.refresh();
      });
      b.dataset.tool = t;
      this.toolPop.append(b);
    }

    // --- bong bóng chất liệu (+ hoạ tiết, cỡ nét)
    this.matPop = h('div', { class: 'pop clay', hidden: true });
    const row1 = h('div', { class: 'pop-row' });
    const mats: [Material, string][] = [
      ['marker', 'Bút dạ'],
      ['crayon', 'Bút sáp'],
      ['glitter', 'Kim tuyến'],
      ['pattern', 'Hoạ tiết'],
    ];
    for (const [m, label] of mats) {
      const b = mk(MAT_ICON[m], label, () => {
        this.state.material = m;
        if (this.state.tool === 'erase') this.state.tool = 'fill';
        // hoạ tiết / cọ còn lựa chọn phụ nên giữ bong bóng mở
        if (m !== 'pattern' && this.state.tool !== 'brush') this.closePops();
        this.refresh();
      });
      b.dataset.mat = m;
      row1.append(b);
    }
    const row2 = h('div', { class: 'pop-row', 'data-row': 'pat' });
    const pats: [PatternKind, string][] = [
      ['dots', 'Chấm bi'],
      ['stripes', 'Sọc kẹo ngọt'],
      ['stars', 'Ngôi sao nhỏ'],
    ];
    for (const [k, label] of pats) {
      const b = mk(k === 'stars' ? 'star' : null, label, () => {
        this.state.pattern = k;
        if (this.state.tool !== 'brush') this.closePops();
        this.refresh();
      });
      b.dataset.pat = k;
      if (k !== 'stars') b.firstElementChild!.className = 'pat p-' + k;
      row2.append(b);
    }
    const row3 = h('div', { class: 'pop-row', 'data-row': 'size' });
    BRUSH_SIZES.forEach((_, i) => {
      const b = mk(null, 'Cỡ nét ' + (i + 1), () => {
        this.state.sizeIdx = i;
        this.closePops();
        this.refresh();
      });
      b.dataset.size = String(i);
      b.firstElementChild!.className = 'dot d' + i;
      row3.append(b);
    });
    this.matPop.append(row1, row2, row3);

    this.toolBtn = mk('bucket', 'Công cụ', () => this.toggle(this.toolPop), 'cur');
    this.matBtn = mk('marker', 'Chất liệu', () => this.toggle(this.matPop), 'cur');

    // --- dải bút sáp vuốt ngang
    this.strip = h('div', { class: 'strip' });
    const crayon = (idx: number, color: string, label: string, cls = '') => {
      const stick = h('span', { class: 'stick' }, h('i', { class: 'tip' }), h('i', { class: 'body' }));
      const c = h('button', { class: 'crayon ' + cls, style: `--c:${color}`, 'aria-label': label, title: label }, stick);
      c.dataset.idx = String(idx);
      restCrayon(stick, true);
      this.strip.append(c);
    };
    crayon(-1, '#ff7eb6', 'Bút cầu vồng', 'rainbow');
    PALETTE.forEach((c, i) => crayon(i, c.hex, `${c.vi} - ${c.en}`));
    this.strip.addEventListener('click', (e) => {
      const s = (e.target as HTMLElement).closest<HTMLElement>('.crayon');
      if (!s) return;
      sound.unlock();
      sound.click();
      this.state.colorIdx = Number(s.dataset.idx);
      if (this.state.tool === 'erase') this.state.tool = 'fill';
      this.closePops();
      this.refresh();
      if (this.state.colorIdx < 0) sound.speakColor('Bút cầu vồng', 'Rainbow');
      else sound.speakColor(PALETTE[this.state.colorIdx].vi, PALETTE[this.state.colorIdx].en);
    });

    this.el = h('div', { class: 'dock-float no-paint' }, this.toolPop, this.matPop, h('div', { class: 'pill clay' }, this.toolBtn, this.matBtn, this.strip));

    const outside = (e: Event) => {
      if (!this.el.contains(e.target as Node)) this.closePops();
    };
    document.addEventListener('pointerdown', outside, true);
    this.offOutside = () => document.removeEventListener('pointerdown', outside, true);
    this.refresh(true);
  }

  dispose() {
    this.offOutside();
  }

  /** Khay tự né ngón tay khi bé đang tô. */
  setHidden(hidden: boolean) {
    this.el.classList.toggle('ducked', hidden);
    if (hidden) this.closePops();
  }

  private toggle(pop: HTMLElement) {
    const open = pop.hidden;
    this.closePops();
    pop.hidden = !open;
    if (open) {
      const anchor = pop === this.toolPop ? this.toolBtn : this.matBtn;
      pop.style.left = anchor.offsetLeft + 'px';
    }
  }

  closePops() {
    this.toolPop.hidden = true;
    this.matPop.hidden = true;
  }

  private refresh(instant = false) {
    const s = this.state;
    const q = (sel: string) => Array.from(this.el.querySelectorAll<HTMLElement>(sel));
    (this.toolBtn.firstElementChild as HTMLImageElement).src = iconUrl(TOOL_ICON[s.tool]);
    (this.matBtn.firstElementChild as HTMLImageElement).src = iconUrl(MAT_ICON[s.material]);
    this.matBtn.classList.toggle('dim', s.tool === 'erase');
    q('[data-tool]').forEach((b) => b.classList.toggle('on', b.dataset.tool === s.tool));
    q('[data-mat]').forEach((b) => b.classList.toggle('on', b.dataset.mat === s.material));
    q('[data-pat]').forEach((b) => b.classList.toggle('on', b.dataset.pat === s.pattern));
    q('[data-size]').forEach((b) => b.classList.toggle('on', Number(b.dataset.size) === s.sizeIdx));
    q('[data-row=pat]')[0].hidden = s.material !== 'pattern';
    q('[data-row=size]')[0].hidden = s.tool !== 'brush';
    q('.crayon').forEach((b) => {
      const on = Number(b.dataset.idx) === s.colorIdx && s.tool !== 'erase';
      if (on === b.classList.contains('on') && !instant) return;
      b.classList.toggle('on', on);
      const stick = b.firstElementChild as HTMLElement;
      if (on) {
        popCrayon(stick, instant);
        if (!instant) b.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      } else restCrayon(stick, instant);
    });
    this.el.style.setProperty('--cur', s.colorIdx < 0 ? '#ff7eb6' : PALETTE[s.colorIdx].hex);
    if (!instant) this.onChange();
  }
}
