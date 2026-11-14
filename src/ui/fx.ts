import { animate, utils } from 'animejs';
import confetti from 'canvas-confetti';

/** Hiệu ứng "đồ chơi": nảy lò xo (anime.js) và mưa sao (canvas-confetti). */

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Nút nảy nhẹ khi bấm. */
export function boing(el: HTMLElement) {
  if (reduced()) return;
  animate(el, {
    scale: [
      { to: 0.86, duration: 80, ease: 'outQuad' },
      { to: 1, duration: 520, ease: 'outElastic(1, .45)' },
    ],
  });
}

const REST = 24;
const UP = 2; // bút nằm chìm trong khay bao nhiêu px

export function restCrayon(el: HTMLElement, instant = false) {
  if (instant || reduced()) utils.set(el, { translateY: REST, rotate: 0 });
  else animate(el, { translateY: REST, rotate: 0, duration: 260, ease: 'outQuad' });
}

/** Cây bút được chọn bật hẳn lên khỏi khay rồi rung nhẹ. */
export function popCrayon(el: HTMLElement, instant = false) {
  if (instant || reduced()) {
    utils.set(el, { translateY: UP, rotate: 0 });
    return;
  }
  animate(el, {
    translateY: [
      { to: UP - 9, duration: 150, ease: 'outQuad' },
      { to: UP, duration: 650, ease: 'outElastic(1, .4)' },
    ],
    rotate: [
      { to: -9, duration: 70 },
      { to: 8, duration: 80 },
      { to: -6, duration: 80 },
      { to: 4, duration: 80 },
      { to: 0, duration: 260, ease: 'outElastic(1, .5)' },
    ],
  });
}

const STAR_COLORS = ['#ffd93d', '#ff7eb6', '#8fe3ff', '#b8e04a', '#ff8a3d', '#d7a8ff', '#ffffff'];

/** Mưa ngôi sao rực rỡ từ hai góc dưới + giữa màn hình. */
export function starRain(power = 1) {
  const base = { shapes: ['star' as const], colors: STAR_COLORS, zIndex: 45, disableForReducedMotion: true, scalar: 1.5, ticks: 220 };
  void confetti({ ...base, particleCount: Math.round(60 * power), angle: 60, spread: 70, startVelocity: 62, origin: { x: 0, y: 0.95 } });
  void confetti({ ...base, particleCount: Math.round(60 * power), angle: 120, spread: 70, startVelocity: 62, origin: { x: 1, y: 0.95 } });
  void confetti({ ...base, particleCount: Math.round(40 * power), spread: 360, startVelocity: 34, gravity: 0.6, origin: { x: 0.5, y: 0.4 }, shapes: ['star', 'circle'] });
}

/** Một phần tử bay vào vị trí rồi nảy (dùng cho 3 thẻ đã chọn ở Xưởng Phép Thuật). */
export function flyIn(el: HTMLElement, fromX: number, fromY: number, delay = 0) {
  if (reduced()) return;
  animate(el, {
    translateX: [{ from: fromX, to: 0, duration: 620, ease: 'outBack(1.4)' }],
    translateY: [{ from: fromY, to: 0, duration: 620, ease: 'outBack(1.4)' }],
    scale: [{ from: 0.3, to: 1, duration: 620, ease: 'outElastic(1, .6)' }],
    rotate: [{ from: -25, to: 0, duration: 620, ease: 'outQuad' }],
    delay,
  });
}

export function stopStars() {
  confetti.reset();
}
