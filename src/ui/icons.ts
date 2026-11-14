/** Icon giao diện: SVG màu của OpenMoji (CC BY-SA 4.0), đóng gói sẵn nên giống nhau trên mọi thiết bị. */
const raw = import.meta.glob('../assets/icons/*.svg', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const urls = new Map<string, string>();
for (const [path, svg] of Object.entries(raw)) {
  const code = path.split('/').pop()!.replace('.svg', '');
  urls.set(code, 'data:image/svg+xml;utf8,' + encodeURIComponent(svg));
}

export const ICON = {
  back: '2B05',
  undo: '21A9',
  redo: '21AA',
  wand: '1FA84',
  brush: '1F58C',
  bucket: '1FAA3',
  eraser: '1FA8C',
  menu: '2699',
  film: '1F3AC',
  save: '1F4BE',
  soundOn: '1F50A',
  soundOff: '1F507',
  voice: '1F5E3',
  voiceOff: '1F92B',
  trash: '1F5D1',
  plus: '2795',
  minus: '2796',
  marker: '1F58A',
  crayon: '1F58D',
  glitter: '2728',
  pattern: '1F36D',
  rainbow: '1F308',
  lock: '1F512',
  star: '2B50',
  stop: '23F9',
  close: '2716',
  upload: '1F4E4',
  palette: '1F3A8',
  fit: '1F5BC',
  dice: '1F3B2',
  play: '25B6',
} as const;

export type IconName = keyof typeof ICON;

export function iconUrl(name: IconName): string {
  return urls.get(ICON[name]) ?? '';
}

export function icon(name: IconName): HTMLImageElement {
  const img = document.createElement('img');
  img.className = 'ico';
  img.alt = '';
  img.draggable = false;
  img.src = iconUrl(name);
  return img;
}
