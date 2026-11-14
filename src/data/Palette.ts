export interface PaletteColor {
  hex: string;
  vi: string;
  en: string;
}

/** 22 màu tươi sáng chuẩn thẩm mỹ thiếu nhi, kèm tên song ngữ để đọc to. */
export const PALETTE: PaletteColor[] = [
  { hex: '#ff4d4d', vi: 'Màu đỏ', en: 'Red' },
  { hex: '#ff7eb6', vi: 'Màu hồng', en: 'Pink' },
  { hex: '#ffb3d1', vi: 'Màu hồng phấn', en: 'Light pink' },
  { hex: '#ff8a3d', vi: 'Màu cam', en: 'Orange' },
  { hex: '#ffc46b', vi: 'Màu cam đào', en: 'Peach' },
  { hex: '#ffd93d', vi: 'Màu vàng', en: 'Yellow' },
  { hex: '#fff3a3', vi: 'Màu vàng chanh', en: 'Lemon' },
  { hex: '#b8e04a', vi: 'Màu xanh nõn chuối', en: 'Lime' },
  { hex: '#4ccb5f', vi: 'Màu xanh lá', en: 'Green' },
  { hex: '#1f9d6b', vi: 'Màu xanh lá đậm', en: 'Dark green' },
  { hex: '#3fd6c4', vi: 'Màu xanh ngọc', en: 'Turquoise' },
  { hex: '#8fe3ff', vi: 'Màu xanh da trời', en: 'Sky blue' },
  { hex: '#3b9bff', vi: 'Màu xanh dương', en: 'Blue' },
  { hex: '#3559d6', vi: 'Màu xanh hải quân', en: 'Navy blue' },
  { hex: '#9b6bff', vi: 'Màu tím', en: 'Purple' },
  { hex: '#d7a8ff', vi: 'Màu tím nhạt', en: 'Lavender' },
  { hex: '#b9753c', vi: 'Màu nâu', en: 'Brown' },
  { hex: '#e8bf8f', vi: 'Màu be', en: 'Beige' },
  { hex: '#ffe2c4', vi: 'Màu da', en: 'Cream' },
  { hex: '#ffffff', vi: 'Màu trắng', en: 'White' },
  { hex: '#a9b1bd', vi: 'Màu xám', en: 'Gray' },
  { hex: '#3a3a44', vi: 'Màu đen', en: 'Black' },
];

/** Bộ màu hài hoà cho Bút Cầu Vồng. */
export const RAINBOW = ['#ff4d4d', '#ff8a3d', '#ffd93d', '#b8e04a', '#4ccb5f', '#3fd6c4', '#3b9bff', '#9b6bff', '#ff7eb6', '#d7a8ff'];

let last = -1;
export function nextRainbow(): string {
  // Bước nhảy ngẫu nhiên 1–3 màu trên vòng màu: luôn khác màu trước nhưng vẫn hài hoà
  last = (last + 1 + Math.floor(Math.random() * 3) + RAINBOW.length) % RAINBOW.length;
  return RAINBOW[last];
}
