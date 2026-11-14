/** Tiện ích DOM nhỏ gọn. */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Record<string, any> = {},
  ...children: (Node | string | null | undefined | false)[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'style') el.style.cssText = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2).toLowerCase(), v);
    else el.setAttribute(k, v === true ? '' : String(v));
  }
  for (const c of children) if (c) el.append(c);
  return el;
}

/**
 * Parent Gate: nút phải NHẤN GIỮ `ms` mili-giây mới kích hoạt, có vòng tròn
 * tiến trình chạy quanh nút để bé không vô tình bấm mất thành quả.
 */
export function holdButton(el: HTMLElement, ms: number, onDone: () => void) {
  el.classList.add('hold');
  const ring = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  ring.setAttribute('viewBox', '0 0 40 40');
  ring.setAttribute('class', 'hold-ring');
  ring.innerHTML = '<circle cx="20" cy="20" r="17" pathLength="100"/>';
  el.append(ring);
  const circle = ring.firstElementChild as SVGCircleElement;
  let raf = 0;
  let t0 = 0;
  const stop = () => {
    cancelAnimationFrame(raf);
    raf = 0;
    el.classList.remove('holding');
    circle.style.strokeDashoffset = '100';
  };
  const tick = (now: number) => {
    const t = (now - t0) / ms;
    circle.style.strokeDashoffset = String(100 - Math.min(1, t) * 100);
    if (t >= 1) {
      stop();
      onDone();
      return;
    }
    raf = requestAnimationFrame(tick);
  };
  el.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (raf) return;
    el.classList.add('holding');
    t0 = performance.now();
    raf = requestAnimationFrame(tick);
  });
  for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) el.addEventListener(ev, stop);
  el.addEventListener('contextmenu', (e) => e.preventDefault());
}

let toastTimer = 0;
export function toast(text: string) {
  let t = document.querySelector<HTMLElement>('.toast');
  if (!t) {
    t = h('div', { class: 'toast' });
    document.body.append(t);
  }
  t.textContent = text;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => t!.classList.remove('show'), 2600);
}
