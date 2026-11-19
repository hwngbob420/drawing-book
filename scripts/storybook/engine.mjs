// Storybook SVG engine — vẽ nhân vật/vật thể bằng đường cong mượt (Catmull-Rom -> Bezier).
// Quy ước nét tô màu (khớp SceneComposer.normalizeSvg):
//  - viewBox 256x256. Mọi mảng fill="#FFFFFF", viền stroke="#231F20" 4 (nét ngoài) / 2.2 (nét chia mảng),
//    đầu nét & góc nối bo tròn. Bộ ghép giữ tỉ lệ 4 : 2.2 (khớp SvgLineArtConverter) và tô lại độ dày thật theo kích thước trên tranh.
//  - Mực đặc chỉ cho mắt/mũi (gắn data-eye / data-nose để lint miễn kiểm tra kích thước).
//  - Không mảng kín nào nhỏ hơn MIN_REGION (đơn vị viewBox) ngoài mắt/mũi: ngón tay bé 2–5 tuổi phải chạm trúng.
//  - Thứ tự vẽ = thứ tự che khuất: hình vẽ sau đè hình vẽ trước (nền trắng đặc).

export const INK = '#231F20';
export const FILL = '#FFFFFF';
export const W_OUT = 4;
export const W_IN = 2.2;
export const MIN_REGION = 28;

const f = (n) => +n.toFixed(2);
const pt = ([x, y]) => `${f(x)} ${f(y)}`;

/** Đường cong Catmull-Rom đi qua mọi điểm; `closed` = khép kín. t = độ căng (1 = chuẩn). */
export function spline(pts, closed = true, t = 1) {
  const n = pts.length;
  const P = (i) => (closed ? pts[((i % n) + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  let d = `M${pt(pts[0])}`;
  const segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    const c1 = [p1[0] + ((p2[0] - p0[0]) / 6) * t, p1[1] + ((p2[1] - p0[1]) / 6) * t];
    const c2 = [p2[0] - ((p3[0] - p1[0]) / 6) * t, p2[1] - ((p3[1] - p1[1]) / 6) * t];
    d += `C${pt(c1)} ${pt(c2)} ${pt(p2)}`;
  }
  return closed ? d + 'Z' : d;
}

/** Lật đối xứng qua trục dọc x = cx (giữ chiều đi vòng ngược để vẫn là đường khép kín hợp lệ). */
export const mirror = (pts, cx = 128) => pts.map(([x, y]) => [2 * cx - x, y]).reverse();

/** Elip bằng 4 cung Bezier (tránh <ellipse> để xoay/biến đổi dễ). */
export function ellipsePath(cx, cy, rx, ry, rot = 0) {
  const k = 0.5522847498;
  const pts = [
    [rx, 0], [rx, ry * k, rx * k, ry, 0, ry],
    [-rx * k, ry, -rx, ry * k, -rx, 0],
    [-rx, -ry * k, -rx * k, -ry, 0, -ry],
    [rx * k, -ry, rx, -ry * k, rx, 0],
  ];
  const c = Math.cos(rot), s = Math.sin(rot);
  const T = (x, y) => [cx + x * c - y * s, cy + x * s + y * c];
  let d = `M${pt(T(pts[0][0], pts[0][1]))}`;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i];
    d += `C${pt(T(a[0], a[1]))} ${pt(T(a[2], a[3]))} ${pt(T(a[4], a[5]))}`;
  }
  return d + 'Z';
}

/** Hình hạt đậu/quả lê hữu cơ: elip có đường bao gợn nhẹ, ổn định theo `seed`. */
export function blob(cx, cy, rx, ry, { n = 10, amp = 0.06, seed = 1, rot = 0 } = {}) {
  let s = seed * 9301 + 49297;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280) - 0.5;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = 1 + rnd() * 2 * amp;
    pts.push([Math.cos(a) * rx * k, Math.sin(a) * ry * k]);
  }
  const c = Math.cos(rot), sn = Math.sin(rot);
  return spline(pts.map(([x, y]) => [cx + x * c - y * sn, cy + x * sn + y * c]));
}

/** Đám mây/tán cây: nhiều búi tròn xếp dọc một đường, đáy phẳng hoặc tròn. */
export function lumps(centers, flatY = null) {
  // centers: [[x, y, r], ...] theo thứ tự đi vòng; dựng bằng Catmull-Rom trên các điểm nhô ra của từng búi
  const pts = [];
  for (const [x, y, r, a0, a1] of centers) {
    const steps = 3;
    for (let i = 0; i <= steps; i++) {
      const a = a0 + ((a1 - a0) * i) / steps;
      pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r]);
    }
  }
  return spline(pts, true, 0.9);
}


/** Đa giác bo góc: mỗi đỉnh được bo bằng cung Bezier bậc 2 với bán kính r (nhà, mái, bảng hiệu, vương miện...). */
export function rpoly(pts, r = 14) {
  const n = pts.length;
  let d = '';
  for (let i = 0; i < n; i++) {
    const p = pts[i], a = pts[(i + n - 1) % n], b = pts[(i + 1) % n];
    const la = Math.hypot(a[0] - p[0], a[1] - p[1]) || 1;
    const lb = Math.hypot(b[0] - p[0], b[1] - p[1]) || 1;
    const ra = Math.min(r, la / 2.2), rb = Math.min(r, lb / 2.2);
    const p1 = [p[0] + ((a[0] - p[0]) / la) * ra, p[1] + ((a[1] - p[1]) / la) * ra];
    const p2 = [p[0] + ((b[0] - p[0]) / lb) * rb, p[1] + ((b[1] - p[1]) / lb) * rb];
    d += (i ? 'L' : 'M') + pt(p1) + 'Q' + pt(p) + ' ' + pt(p2);
  }
  return d + 'Z';
}

/** Hình chữ nhật bo tròn (đồ vật, KHÔNG dùng cho sinh vật). */
export const rrect = (x, y, w, h, r = 14) => rpoly([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], r);

/** Lấy mẫu điểm trên một cung elip (rad), tuỳ chọn xoay quanh tâm. */
export function arcPts(cx, cy, rx, ry, a0, a1, n = 12, rot = 0) {
  const c = Math.cos(rot), s = Math.sin(rot);
  const out = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    const x = Math.cos(a) * rx, y = Math.sin(a) * ry;
    out.push([cx + x * c - y * s, cy + x * s + y * c]);
  }
  return out;
}

/** Ngôi sao nhiều cánh bo tròn: đường bao qua các đỉnh ngoài/trong (Catmull-Rom, t nhỏ = cánh nhọn hơn). */
export function starPts(cx, cy, ro, ri, n = 5, rot = -Math.PI / 2) {
  const out = [];
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 ? ri : ro;
    const a = rot + (i * Math.PI) / n;
    out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return out;
}

/**
 * Ống uốn cong theo đường tâm (đuôi, vòi voi, xúc tu, chân tay, cổ, thân cá...):
 * trả về điểm bao khép kín (dùng với spline). widths = bề rộng tại từng điểm tâm (nội suy).
 */
export function tube(center, widths, { samples = 8, cap = true } = {}) {
  const n = center.length;
  const P = (i) => center[Math.max(0, Math.min(n - 1, i))];
  const pts = [], wid = [];
  for (let i = 0; i < n - 1; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    for (let k = 0; k < samples; k++) {
      const t = k / samples, t2 = t * t, t3 = t2 * t;
      const x = 0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3);
      const y = 0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3);
      pts.push([x, y]);
      wid.push(widths[i] + (widths[i + 1] - widths[i]) * t);
    }
  }
  pts.push(center[n - 1]);
  wid.push(widths[n - 1]);
  const L = [], R = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1];
    const l = Math.hypot(dx, dy) || 1;
    dx /= l; dy /= l;
    const h = wid[i] / 2;
    L.push([pts[i][0] - dy * h, pts[i][1] + dx * h]);
    R.push([pts[i][0] + dy * h, pts[i][1] - dx * h]);
  }
  // thưa bớt điểm cho Catmull-Rom mượt (mỗi `samples` điểm giữ 1), luôn giữ điểm cuối
  const thin = (arr) => arr.filter((_, i) => i % 2 === 0 || i === arr.length - 1);
  let out = [...thin(L)];
  if (cap) {
    const e = pts[pts.length - 1], a = pts[pts.length - 2];
    const ang = Math.atan2(e[1] - a[1], e[0] - a[0]);
    const h = wid[wid.length - 1] / 2;
    out.push([e[0] + Math.cos(ang) * h * 1.05, e[1] + Math.sin(ang) * h * 1.05]);
  }
  out = out.concat(thin(R).reverse());
  if (cap) {
    const s = pts[0], a = pts[1];
    const ang = Math.atan2(s[1] - a[1], s[0] - a[0]);
    const h = wid[0] / 2;
    out.push([s[0] + Math.cos(ang) * h * 1.05, s[1] + Math.sin(ang) * h * 1.05]);
  }
  return out;
}

export const deg = (a) => (a * Math.PI) / 180;
export const polar = (cx, cy, r, a) => [cx + Math.cos(a) * r, cy + Math.sin(a) * r];

export class Art {
  constructor(vb = 256) {
    this.vb = vb;
    this.out = [];
  }
  /** Mảng tô khép kín (nền trắng): viền ngoài dày (mặc định) hoặc `inner` cho nét chia mảng mảnh. */
  shape(d, { inner = false, rot, at } = {}) {
    const g = at ? ` transform="translate(${at[0]} ${at[1]})${rot ? ` rotate(${rot})` : ''}"` : rot ? ` transform="rotate(${rot})"` : '';
    this.out.push(`<path d="${d}" fill="${FILL}" stroke="${INK}" stroke-width="${inner ? W_IN : W_OUT}"${g}/>`);
    return this;
  }
  /** Nét hở (fill none): nét chia mảng, miệng, cọng hoa... */
  line(d, { w = W_IN } = {}) {
    this.out.push(`<path d="${d}" fill="none" stroke="${INK}" stroke-width="${w}"/>`);
    return this;
  }
  /** Mực đặc: mũi, lỗ mũi (được miễn kiểm tra kích thước). */
  ink(d, tag = 'data-nose') {
    this.out.push(`<path d="${d}" fill="${INK}" stroke="${INK}" stroke-width="1" ${tag}="1"/>`);
    return this;
  }
  ell(cx, cy, rx, ry, opts = {}) {
    return this.shape(ellipsePath(cx, cy, rx, ry, opts.rot || 0), opts);
  }
  spl(pts, opts = {}) {
    return this.shape(spline(pts, true, opts.t ?? 1), opts);
  }
  /** Mắt tròn đen láy kiểu sách tranh: hạt mực bầu dục + một đốm sáng (hướng nhìn theo dx, dy). */
  eye(cx, cy, r, { dx = 0, dy = 0 } = {}) {
    const rx = r * 0.58, ry = r * 0.74;
    this.ink(ellipsePath(cx + dx, cy + dy, rx, ry), 'data-eye');
    this.out.push(`<path d="${ellipsePath(cx + dx + rx * 0.32, cy + dy - ry * 0.38, rx * 0.36, rx * 0.36)}" fill="${FILL}" stroke="${INK}" stroke-width="0.5" data-eye="1"/>`);
    return this;
  }
  /** Mắt cười tít ^ ^ */
  happyEye(cx, cy, r) {
    return this.line(`M${f(cx - r)} ${f(cy + r * 0.3)} Q${f(cx)} ${f(cy - r * 0.9)} ${f(cx + r)} ${f(cy + r * 0.3)}`, { w: W_OUT });
  }
  /** Nụ cười mảnh. */
  smile(cx, cy, w, depth = w * 0.35) {
    return this.line(`M${f(cx - w / 2)} ${f(cy)} Q${f(cx)} ${f(cy + depth * 2)} ${f(cx + w / 2)} ${f(cy)}`, { w: 3 });
  }
  /** Nhóm có biến đổi (nghiêng đầu, lật...): mọi hình vẽ trong `fn` nằm trong <g transform>. */
  group(transform, fn) {
    this.out.push(`<g transform="${transform}">`);
    fn(this);
    this.out.push('</g>');
    return this;
  }
  raw(s) {
    this.out.push(s);
    return this;
  }
  toString() {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.vb} ${this.vb}" stroke-linecap="round" stroke-linejoin="round">${this.out.join('')}</svg>\n`;
  }
}
