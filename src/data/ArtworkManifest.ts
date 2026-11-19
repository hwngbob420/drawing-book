import { Artwork, Orient, sheetSize } from '../types';
import { convertToLineArt } from '../engine/SvgLineArtConverter';
import { composeLineArt } from '../engine/SceneComposer';
import { GENERIC_ANIM } from './BuiltInArtworks';

/**
 * Bộ tranh tĩnh thả vào `public/artworks/`: khai báo trong `public/artworks/manifest.json`, mỗi file SVG
 * (xuất từ vtracer, AI, hoạ sĩ...) được SvgLineArtConverter chuyển thành nét tô màu ngay khi mở.
 *
 *   { "artworks": [ { "id": "whale", "file": "whale.svg", "title": "Cá voi", "version": 1, "orient": "l" } ] }
 *
 * `id` cố định cho mỗi tranh; khi thay file mới cùng `id`, tăng `version` để tiến độ tô cũ (theo nét cũ) bị bỏ.
 * Manifest thiếu/lỗi hay một file hỏng không làm hỏng phòng tranh — tranh đó chỉ bị bỏ qua.
 */
export interface ManifestEntry {
  id: string;
  file: string;
  title: string;
  titleEn?: string;
  version?: number;
  orient?: Orient;
  /** Bỏ mảng nhỏ hơn ngưỡng này (px trên tranh 1600) — mặc định 22. */
  minPart?: number;
}

/** Bản một-file-HTML nhúng sẵn manifest + nội dung SVG (xem scripts/build-single.mjs). */
const embedded = (): { manifest: { artworks: ManifestEntry[] }; files: Record<string, string> } | undefined => (window as any).__MCB_ARTWORKS__;

async function readText(file: string): Promise<string> {
  const e = embedded();
  if (e) {
    const t = e.files[file];
    if (t === undefined) throw new Error('Thiếu ' + file);
    return t;
  }
  const r = await fetch(`${import.meta.env.BASE_URL}artworks/${file}`);
  if (!r.ok) throw new Error(`Không tải được ${file} (${r.status})`);
  return r.text();
}

export async function loadManifestArtworks(): Promise<Artwork[]> {
  let entries: ManifestEntry[] = [];
  try {
    const e = embedded();
    const m = e ? e.manifest : await (await fetch(`${import.meta.env.BASE_URL}artworks/manifest.json`)).json();
    entries = Array.isArray(m?.artworks) ? m.artworks : [];
  } catch (err) {
    console.warn('Không đọc được public/artworks/manifest.json', err);
    return [];
  }
  const seen = new Set<string>();
  return entries
    .filter((en) => {
      const ok = typeof en?.id === 'string' && typeof en.file === 'string' && /^[\w-]+$/.test(en.id) && !seen.has(en.id);
      if (!ok) console.warn('Bỏ qua mục manifest không hợp lệ', en);
      seen.add(en?.id);
      return ok;
    })
    .map((en) => {
      const orient: Orient = en.orient === 'p' ? 'p' : 'l';
      let cache: Promise<HTMLCanvasElement> | null = null;
      return {
        // phiên bản nằm trong id: thay file + tăng version -> tiến độ cũ không đè lên nét mới
        id: `m-${en.id}-v${en.version ?? 1}`,
        title: en.title || en.id,
        titleEn: en.titleEn || en.title || en.id,
        builtIn: true,
        orient,
        anim: GENERIC_ANIM,
        render: () =>
          (cache ??= readText(en.file).then((text) => {
            const [w, h] = sheetSize(orient);
            const { svg } = convertToLineArt(text, { page: true, minPart: en.minPart ?? 22, maxShapes: 3000 });
            return composeLineArt(svg, w, h);
          })).then((c) => {
            // mỗi lần mở studio cần canvas riêng (studio vẽ đè lên)
            const copy = document.createElement('canvas');
            copy.width = c.width;
            copy.height = c.height;
            copy.getContext('2d')!.drawImage(c, 0, 0);
            return copy;
          }),
      } satisfies Artwork;
    });
}
