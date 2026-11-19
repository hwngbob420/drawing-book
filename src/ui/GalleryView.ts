import { Artwork, ART_W, ART_H, makeCanvas, ctx2d } from '../types';
import { Progress, Storage } from '../data/Storage';
import { loadImage, processLineArt, canvasToBlob } from '../engine/LineArtProcessor';
import { sound } from '../audio/SoundManager';
import { h, holdButton, toast } from './dom';
import { icon } from './icons';
import { svgImg } from '../engine/SceneComposer';
import { PAPER } from '../engine/PatternGenerator';
import { boing } from './fx';

export interface GalleryHost {
  artworks: () => Artwork[];
  open: (a: Artwork) => void;
  openBuilder: () => void;
  reload: () => Promise<void>;
}

const thumbCache = new Map<string, string>();

/** Phòng trưng bày: lưới thẻ tranh lớn + góc phụ huynh (tải tranh, xoá dữ liệu). */
export class GalleryView {
  readonly el: HTMLElement;
  private grid: HTMLElement;
  private panel: HTMLElement;

  constructor(private host: GalleryHost) {
    const parentBtn = h('button', { class: 'ibtn clay parent-btn', 'aria-label': 'Góc phụ huynh (nhấn giữ)', title: 'Góc phụ huynh (nhấn giữ)' }, icon('lock'));
    holdButton(parentBtn, 2500, () => this.openPanel());
    this.grid = h('div', { class: 'grid' });
    this.panel = h('div', { class: 'panel-wrap', hidden: true });
    this.el = h(
      'div',
      { class: 'gallery' },
      h('header', {}, h('div', { class: 'logo' }, icon('palette'), h('h1', {}, 'Sách Tô Màu', h('em', {}, ' Phép Thuật'))), parentBtn),
      this.grid,
      this.panel,
    );
    void this.render();
  }

  async render() {
    const progress = new Map<string, Progress>((await Storage.allProgress()).map((p) => [p.id, p]));
    this.grid.replaceChildren();
    // Thẻ nổi bật: Xưởng Phép Thuật — tự tạo tranh
    const workshop = h(
      'button',
      { class: 'card clay workshop', 'aria-label': 'Xưởng Phép Thuật — Tự Tạo Tranh' },
      h('div', { class: 'w-art' }, icon('wand'), ...['s:unicorn', 's:trex', 'a:dog'].map((s) => svgImg(s, 120))),
      h('div', { class: 'name' }, 'Xưởng Phép Thuật', h('small', {}, 'Tự tạo tranh')),
    );
    workshop.addEventListener('click', () => {
      sound.unlock();
      sound.pop();
      boing(workshop);
      setTimeout(() => this.host.openBuilder(), 140);
    });
    this.grid.append(workshop);
    for (const art of this.host.artworks()) {
      const pr = progress.get(art.id);
      const img = h('img', { alt: art.title, draggable: 'false' });
      const card = h(
        'button',
        { class: 'card clay', 'aria-label': art.title },
        h('div', { class: 'thumb' + (art.orient === 'p' ? ' tall' : '') }, img, pr?.done ? h('span', { class: 'badge', title: 'Đã hoàn thành' }, icon('star')) : pr?.thumb ? h('span', { class: 'badge wip', title: 'Đang tô dở' }, icon('crayon')) : null),
        h('div', { class: 'name' }, art.title),
      );
      card.addEventListener('click', () => {
        sound.unlock();
        sound.pop();
        boing(card);
        setTimeout(() => this.host.open(art), 140);
      });
      this.grid.append(card);
      if (pr?.thumb) img.src = pr.thumb;
      else void this.lineThumb(art).then((src) => (img.src = src));
    }
  }

  private async lineThumb(art: Artwork): Promise<string> {
    const cached = thumbCache.get(art.id);
    if (cached) return cached;
    const line = await art.render();
    const t = makeCanvas(Math.round(line.width * 0.3), Math.round(line.height * 0.3));
    const c = ctx2d(t);
    c.fillStyle = PAPER;
    c.fillRect(0, 0, t.width, t.height);
    c.imageSmoothingQuality = 'high';
    c.drawImage(line, 0, 0, t.width, t.height);
    const src = t.toDataURL('image/png');
    thumbCache.set(art.id, src);
    return src;
  }

  // ---------------------------------------------------------------- góc phụ huynh

  private openPanel() {
    const file = h('input', { type: 'file', accept: 'image/png,image/jpeg,image/webp', hidden: true });
    file.addEventListener('change', () => file.files?.[0] && this.upload(file.files[0]));
    const wipe = h('button', { class: 'pbtn danger' }, 'Nhấn giữ 2,5 giây để xoá toàn bộ dữ liệu');
    holdButton(wipe, 2500, async () => {
      await Storage.clearAll();
      thumbCache.clear();
      await this.host.reload();
      toast('Đã xoá toàn bộ dữ liệu');
      this.closePanel();
      void this.render();
    });
    const uploads = this.host.artworks().filter((a) => !a.builtIn);
    const list = h('div', { class: 'uploads' });
    for (const u of uploads) {
      const del = h('button', { class: 'pbtn small danger' }, 'Giữ để xoá');
      holdButton(del, 2500, async () => {
        if (u.id.startsWith('custom-')) await Storage.deleteCustom(u.id);
        else await Storage.deleteUpload(u.id);
        await Storage.deleteProgress(u.id);
        thumbCache.delete(u.id);
        await this.host.reload();
        this.openPanel();
        void this.render();
      });
      list.append(h('div', { class: 'urow' }, h('span', {}, u.title), del));
    }
    this.panel.replaceChildren(
      h(
        'div',
        { class: 'panel' },
        h('h2', {}, 'Góc phụ huynh'),
        h('p', {}, 'Tải lên một ảnh tranh tô màu đen trắng (PNG/JPG). Ứng dụng sẽ tự tách nét đen để bé tô được ngay. Ảnh chỉ lưu trên thiết bị này.'),
        h('button', { class: 'pbtn primary', onclick: () => file.click() }, icon('upload'), 'Tải tranh từ máy'),
        file,
        uploads.length ? h('h3', {}, 'Tranh của bé và tranh đã tải lên') : null,
        list,
        h('h3', {}, 'Dữ liệu'),
        wipe,
        h('button', { class: 'pbtn', onclick: () => this.closePanel() }, 'Đóng'),
        h('p', { class: 'credits' }, 'Hình minh hoạ: nét sách tranh vẽ riêng cho ứng dụng; Mega Doodles Pack © Maria Letta (CC BY-SA 4.0, đã chuyển thành nét tô màu); Free Gophers Pack © Maria Letta (CC0); IRA Design © Creative Tim (MIT). Icon giao diện: OpenMoji (CC BY-SA 4.0).'),
      ),
    );
    this.panel.hidden = false;
  }

  private closePanel() {
    this.panel.hidden = true;
  }

  private async upload(f: File) {
    try {
      const img = await loadImage(f);
      const line = processLineArt(img);
      const id = 'upload-' + Date.now().toString(36);
      const title = f.name.replace(/\.[^.]+$/, '').slice(0, 40) || 'Tranh của bé';
      await Storage.saveUpload({ id, title, line: await canvasToBlob(line), created: Date.now() });
      await this.host.reload();
      this.closePanel();
      await this.render();
      toast('Đã thêm tranh mới');
    } catch (e) {
      console.error(e);
      toast('Không đọc được ảnh này, thử ảnh khác nhé');
    }
  }
}

/** Dựng Artwork từ bản ghi tranh tải lên. */
export function uploadToArtwork(u: { id: string; title: string; line: Blob }): Artwork {
  return {
    id: u.id,
    title: u.title,
    titleEn: 'My picture',
    builtIn: false,
    anim: [],
    render: async () => {
      const img = await loadImage(u.line);
      const c = makeCanvas(ART_W, ART_H);
      ctx2d(c).drawImage(img, 0, 0, ART_W, ART_H);
      return c;
    },
  };
}
