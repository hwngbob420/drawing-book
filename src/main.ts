import './style.css';
import { Artwork } from './types';
import { BUILT_IN_ARTWORKS } from './data/BuiltInArtworks';
import { Storage } from './data/Storage';
import { GalleryView, uploadToArtwork } from './ui/GalleryView';
import { FullBleedStudioView } from './studio/FullBleedStudioView';
import { SceneBuilderView } from './builder/SceneBuilderView';
import { Recipe, recipeToArtwork } from './builder/ProgressiveSceneComposer';

/** Khởi tạo app và chuyển cảnh Gallery <-> Xưởng Phép Thuật <-> Studio. */
const app = document.getElementById('app')!;
let artworks: Artwork[] = [...BUILT_IN_ARTWORKS];

async function reload() {
  const [uploads, customs] = await Promise.all([Storage.allUploads(), Storage.allCustom()]);
  uploads.sort((a, b) => a.created - b.created);
  customs.sort((a, b) => b.created - a.created);
  artworks = [...customs.map((c) => recipeToArtwork(c.id, c.recipe as Recipe)), ...BUILT_IN_ARTWORKS, ...uploads.map(uploadToArtwork)];
}

function showGallery() {
  const gallery = new GalleryView({ artworks: () => artworks, open: showStudio, openBuilder: showBuilder, reload });
  app.replaceChildren(gallery.el);
}

function showBuilder() {
  const builder = new SceneBuilderView((art) => showStudio(art), showGallery);
  app.replaceChildren(builder.el);
}

function showStudio(art: Artwork) {
  const studio = new FullBleedStudioView(art, () => void reload().then(showGallery));
  app.replaceChildren(studio.el);
  void studio.start();
}

// Chặn cuộn trang, zoom trình duyệt và menu chuột phải để bé không thoát nhầm
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('dblclick', (e) => e.preventDefault());
document.addEventListener(
  'touchmove',
  (e) => {
    if (!(e.target as HTMLElement).closest('.strip, .grid, .panel, .b-body')) e.preventDefault();
  },
  { passive: false },
);

void reload().then(showGallery);
