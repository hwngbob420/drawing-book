/**
 * SvgLineArtConverter — biến một SVG minh hoạ màu (của hoạ sĩ, vtracer, AI...) thành nét tô màu sách tranh.
 *
 *  - Mảng màu -> nền trắng #FFFFFF, viền mảnh #231F20 (nét chia mảng, vai trò `inner`).
 *  - Mảng tối: dải mảnh (nét vẽ dạng fill, kiểu Illustrator) giữ mực đặc; khối tối dày (tóc, giày)
 *    -> nền trắng có viền; chấm tối nhỏ gần tròn (con ngươi, lỗ mũi) giữ mực đặc (`data-eye`).
 *  - Mảng bóng đổ/quầng nền rất nhạt, độ mờ thấp, gradient trang trí -> bỏ.
 *  - Bỏ mọi mảng/nét có khung bao nhỏ hơn MIN_PART x MIN_PART (đơn vị khung 256) — trẻ không phải tô ô li ti.
 *  - Đường bao ngoài dày: bản sao mực của mọi mảng kín nằm dưới (vai trò `under`, nét gấp đôi viền ngoài),
 *    mảng trắng phủ lên -> chỉ phần rìa ngoài cùng lộ ra thành nét dày.
 *
 * Kết quả: SVG viewBox 0 0 256 256, nét `vector-effect: non-scaling-stroke` với stroke-width = px khi dựng ở
 * 256px (4 / 2.2); SceneComposer.normalizeSvg đặt lại độ dày thật theo kích thước hình trên tranh.
 * Chạy trong trình duyệt (cần computed style, getBBox, isPointInFill).
 */

export const LINE_INK = '#231F20';
export const OUTER_W = 4;
export const INNER_W = 2.2;
/** Cạnh khung bao nhỏ nhất (đơn vị khung 256) của một mảng/nét được giữ lại. */
export const MIN_PART = 22;
const VB = 256;
/** Cạnh dài của tranh cả trang (khớp ART_W). */
export const PAGE_W = 1600;
const SHAPES = 'path,circle,ellipse,rect,polygon,polyline,line';

export interface ConvertOptions {
  /** Ngưỡng bỏ mảng nhỏ (đơn vị khung 256). */
  minPart?: number;
  /** Lề quanh hình khi co về khung 256. */
  pad?: number;
  /**
   * Tranh cả trang (thả vào public/artworks/): giữ khung và tỉ lệ gốc, xuất viewBox cạnh dài PAGE_W, nét tính theo px
   * khi dựng ở PAGE_W (đường bao ngoài ~8px, nét trong 4.4px) để khớp độ dày nét của tranh ghép.
   */
  page?: boolean;
  /** Giới hạn số hình (ảnh vtracer có thể có hàng nghìn path); vượt quá -> bỏ các hình nhỏ nhất. */
  maxShapes?: number;
}

export interface ConvertReport {
  kept: number;
  dropped: number;
  ink: number;
}

const rgb = (c: string): [number, number, number, number] | null => {
  const m = c.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const p = m[1].split(',').map((v) => parseFloat(v));
  return [p[0], p[1], p[2], p[3] ?? 1];
};
const lum = ([r, g, b]: number[]) => r * 0.3 + g * 0.59 + b * 0.11;
const sat = ([r, g, b]: number[]) => Math.max(r, g, b) - Math.min(r, g, b);

/** Tỉ lệ (theo trục) của ma trận biến đổi. */
const scaleOf = (m: DOMMatrix) => Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) || 1;

/** Ước lượng diện tích tô (đơn vị gốc) bằng lưới điểm isPointInFill. */
function fillArea(el: SVGGeometryElement, b: DOMRect, n = 18): number {
  let hit = 0;
  const pt = new DOMPoint();
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      pt.x = b.x + ((i + 0.5) / n) * b.width;
      pt.y = b.y + ((j + 0.5) / n) * b.height;
      if (el.isPointInFill(pt)) hit++;
    }
  return (hit / (n * n)) * b.width * b.height;
}

export function convertToLineArt(text: string, opts: ConvertOptions = {}): { svg: string; report: ConvertReport } {
  const minPart = opts.minPart ?? MIN_PART;
  const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
  const src = document.importNode(doc.documentElement, true) as unknown as SVGSVGElement;
  if (src.nodeName !== 'svg') throw new Error('Không phải SVG');
  // vtracer & nhiều công cụ chỉ ghi width/height, không có viewBox: lấy kích thước TRƯỚC khi xoá
  if (!src.getAttribute('viewBox')) src.setAttribute('viewBox', `0 0 ${parseFloat(src.getAttribute('width') || '256') || 256} ${parseFloat(src.getAttribute('height') || '256') || 256}`);
  src.removeAttribute('width');
  src.removeAttribute('height');
  src.setAttribute('width', '512');
  src.setAttribute('height', '512');
  const host = document.createElement('div');
  // không dùng visibility:hidden — thuộc tính này kế thừa xuống mọi hình và làm chúng bị coi là ẩn
  host.style.cssText = 'position:absolute;left:-99999px;top:0;width:512px;height:512px;pointer-events:none';
  host.append(src);
  document.body.append(host);
  const report: ConvertReport = { kept: 0, dropped: 0, ink: 0 };
  try {
    const rootInv = (src.getScreenCTM() ?? new DOMMatrix()).inverse();
    // khung bao toàn hình (đơn vị gốc) để co về 256
    type Item = { el: SVGGraphicsElement; m: DOMMatrix; box: DOMRect; role: 'white' | 'ink' | 'line' | 'eye'; clip?: { id: string; m: DOMMatrix } };
    // clip-path gần nhất (trên chính hình hoặc nhóm cha): giữ lại để phần thò ra ngoài không hiện
    const clipOf = (el: Element): Item['clip'] => {
      for (let g: Element | null = el; g && g !== src; g = g.parentElement) {
        const v = g.getAttribute('clip-path') || (g as SVGElement).style?.clipPath || '';
        const id = v.match(/url\(["']?#([^"')]+)["']?\)/)?.[1];
        if (id && src.querySelector(`[id="${id}"]`)) return { id, m: rootInv.multiply((g as SVGGraphicsElement).getScreenCTM() ?? new DOMMatrix()) };
      }
      return undefined;
    };
    const items: Item[] = [];
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    const vb = src.viewBox.baseVal;
    // đơn vị đo kích thước: khung 256 cho hình rời; với tranh cả trang dùng px trên tranh PAGE_W (ngưỡng 22px là px thật)
    const vbScale = (opts.page ? PAGE_W : VB) / Math.max(vb.width, vb.height);
    const els = [...src.querySelectorAll<SVGGraphicsElement>(SHAPES)].filter((el) => !el.closest('defs,clipPath,mask,symbol,pattern,marker'));
    for (const el of els) {
      const cs = getComputedStyle(el);
      const opacity = parseFloat(cs.opacity) * parseFloat(cs.fillOpacity || '1');
      let hidden = cs.display === 'none' || cs.visibility === 'hidden';
      for (let g: Element | null = el.parentElement; g && g !== src && !hidden; g = g.parentElement) if (parseFloat(getComputedStyle(g).opacity) < 0.3) hidden = true;
      const fillUrl = cs.fill.startsWith('url(');
      const fill = fillUrl ? null : rgb(cs.fill);
      const stroke = cs.stroke === 'none' ? null : rgb(cs.stroke);
      const sw = parseFloat(cs.strokeWidth) || 0;
      const hasFill = fillUrl || (fill !== null && fill[3] > 0.05 && cs.fill !== 'none');
      const hasStroke = stroke !== null && stroke[3] > 0.05 && sw > 0;
      if (hidden || (!hasFill && !hasStroke) || opacity < 0.3) continue;
      const m = rootInv.multiply(el.getScreenCTM() ?? new DOMMatrix());
      const lb = el.getBBox();
      // khung bao theo đơn vị gốc của svg
      const corners = [new DOMPoint(lb.x, lb.y), new DOMPoint(lb.x + lb.width, lb.y), new DOMPoint(lb.x, lb.y + lb.height), new DOMPoint(lb.x + lb.width, lb.y + lb.height)].map((p) => p.matrixTransform(m));
      const bx = Math.min(...corners.map((p) => p.x)), by = Math.min(...corners.map((p) => p.y));
      const box = new DOMRect(bx, by, Math.max(...corners.map((p) => p.x)) - bx, Math.max(...corners.map((p) => p.y)) - by);
      const w256 = box.width * vbScale, h256 = box.height * vbScale;
      let role: Item['role'];
      if (hasFill && fill && lum(fill) < 80 && sat(fill) < 60) {
        // mảng tối: dải nét (mảnh) hay khối (dày)?
        const geo = el as unknown as SVGGeometryElement;
        const area = fillArea(geo, lb);
        const per = typeof geo.getTotalLength === 'function' ? geo.getTotalLength() : 2 * (lb.width + lb.height);
        const thick = ((2 * area) / Math.max(per, 1)) * scaleOf(m) * vbScale; // độ dày trung bình, đơn vị 256
        const solid = area / Math.max(lb.width * lb.height, 1e-6); // tỉ lệ lấp đầy khung bao: dải nét thấp, khối cao
        if (Math.max(w256, h256) < 50 && solid > 0.3) role = 'eye'; // con ngươi, miệng, mũi, giày: giữ mực đặc
        else if (thick < 9 || solid < 0.3) role = 'ink';
        else role = 'white';
      } else if (hasFill && fill && !fillUrl && lum(fill) >= 238 && !(fill[0] === 255 && fill[1] === 255 && fill[2] === 255) && !hasStroke) {
        report.dropped++; // bóng/quầng nền rất nhạt
        continue;
      } else if (hasFill) role = 'white';
      else role = 'line';
      // bỏ phần nhỏ (trừ mắt/mũi)
      // nét hở ngắn (mắt cười, vạch mặt) giữ từ 10; mảng/dải tối dưới ngưỡng thì bỏ
      const floor = role === 'line' ? 10 : minPart;
      if (role !== 'eye' && (Math.max(w256, h256) < floor || (role === 'white' && Math.min(w256, h256) < minPart * 0.45))) {
        report.dropped++;
        continue;
      }
      items.push({ el, m, box, role, clip: clipOf(el) });
      x0 = Math.min(x0, box.x);
      y0 = Math.min(y0, box.y);
      x1 = Math.max(x1, box.x + box.width);
      y1 = Math.max(y1, box.y + box.height);
    }
    if (!items.length) throw new Error('SVG không còn hình nào sau khi lọc');
    if (opts.maxShapes && items.length > opts.maxShapes) {
      const keep = new Set(
        [...items].sort((a, b) => b.box.width * b.box.height - a.box.width * a.box.height).slice(0, opts.maxShapes),
      );
      report.dropped += items.length - keep.size;
      items.splice(0, items.length, ...items.filter((it) => keep.has(it)));
    }
    // co về khung 256 (giữ tỉ lệ, căn giữa); tranh cả trang giữ nguyên khung gốc
    let k: number, ox: number, oy: number, outW = VB, outH = VB;
    if (opts.page) {
      k = PAGE_W / Math.max(vb.width, vb.height);
      outW = Math.round(vb.width * k);
      outH = Math.round(vb.height * k);
      ox = -vb.x * k;
      oy = -vb.y * k;
    } else {
      const pad = opts.pad ?? 6;
      k = (VB - pad * 2) / Math.max(x1 - x0, y1 - y0);
      ox = pad + (VB - pad * 2 - (x1 - x0) * k) / 2 - x0 * k;
      oy = pad + (VB - pad * 2 - (y1 - y0) * k) / 2 - y0 * k;
    }
    // độ dày nét (px khi dựng ở kích thước khung): hình rời 4/2.2 ở 256px; tranh cả trang gấp đôi ở 1600px
    const lw = opts.page ? 2 : 1;

    const out: string[] = [];
    const under: string[] = [];
    const ser = new XMLSerializer();
    const clean = (el: Element, fill: string, stroke: string, w: number, role: string) => {
      const c = el.cloneNode(false) as Element;
      for (const a of ['style', 'class', 'id', 'fill', 'stroke', 'stroke-width', 'opacity', 'fill-opacity', 'stroke-opacity', 'filter', 'mask', 'clip-path', 'transform', 'stroke-dasharray']) c.removeAttribute(a);
      for (const a of [...c.attributes]) if (a.name.includes(':') && !a.name.startsWith('xlink')) c.removeAttribute(a.name);
      c.setAttribute('fill', fill);
      c.setAttribute('stroke', stroke);
      if (stroke !== 'none') {
        c.setAttribute('stroke-width', String(w));
        c.setAttribute('vector-effect', 'non-scaling-stroke');
      }
      c.setAttribute('data-role', role);
      return c;
    };
    const K = new DOMMatrix([k, 0, 0, k, ox, oy]);
    const mat = (T: DOMMatrix) => `matrix(${[T.a, T.b, T.c, T.d, T.e, T.f].map((v) => +v.toFixed(4)).join(' ')})`;
    const clips = new Map<string, string>();
    for (const it of items) {
      const T = K.multiply(it.m);
      let wrap = (node: Element) => `<g transform="${mat(T)}">${ser.serializeToString(node)}</g>`;
      if (it.clip) {
        const { id, m: cm } = it.clip;
        const cid = 'clip-' + id.replace(/[^\w-]/g, '');
        if (!clips.has(cid)) {
          const cp = src.querySelector(`[id="${id}"]`)!.cloneNode(true) as Element;
          cp.setAttribute('id', cid);
          clips.set(cid, ser.serializeToString(cp));
        }
        const inner = cm.inverse().multiply(it.m);
        wrap = (node: Element) => `<g transform="${mat(K.multiply(cm))}" clip-path="url(#${cid})"><g transform="${mat(inner)}">${ser.serializeToString(node)}</g></g>`;
      }
      const fillRule = getComputedStyle(it.el).fillRule;
      const withRule = (c: Element) => (fillRule === 'evenodd' && c.setAttribute('fill-rule', 'evenodd'), c);
      if (it.role === 'white') {
        out.push(wrap(withRule(clean(it.el, '#FFFFFF', LINE_INK, INNER_W * lw, 'inner'))));
        under.push(wrap(withRule(clean(it.el, LINE_INK, LINE_INK, OUTER_W * 2 * lw, 'under'))));
      } else if (it.role === 'ink' || it.role === 'eye') {
        const c = withRule(clean(it.el, LINE_INK, 'none', 0, it.role === 'eye' ? 'eye' : 'ink'));
        if (it.role === 'eye') c.setAttribute('data-eye', '1');
        out.push(wrap(c));
        report.ink++;
      } else out.push(wrap(clean(it.el, 'none', LINE_INK, INNER_W * lw, 'inner')));
      report.kept++;
    }
    const defs = clips.size ? `<defs>${[...clips.values()].join('')}</defs>` : '';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${outW} ${outH}" stroke-linecap="round" stroke-linejoin="round">${defs}${under.join('')}${out.join('')}</svg>\n`;
    return { svg, report };
  } finally {
    host.remove();
  }
}
