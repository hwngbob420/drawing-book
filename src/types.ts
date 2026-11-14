/** Kích thước mặc định (khổ ngang 4:3). Khổ dọc 3:4 là 1200x1600. Kích thước thật luôn lấy từ canvas nét mực. */
export const ART_W = 1600;
export const ART_H = 1200;

export type Material = 'marker' | 'crayon' | 'glitter' | 'pattern';
export type PatternKind = 'dots' | 'stripes' | 'stars';

export interface Paint {
  color: string;
  material: Material;
  pattern?: PatternKind;
}

/**
 * Mỗi thao tác của bé được ghi lại dưới dạng dữ liệu thuần (JSON) để phục vụ
 * Undo/Redo, Auto-Save và Timelapse. Toạ độ (x, y) là "hạt giống" nằm trong ô
 * được tô — vùng kín được dò lại từ toạ độ này nên bản lưu không phụ thuộc
 * vào số thứ tự vùng.
 */
export type Action =
  | { t: 'fill'; x: number; y: number; p: Paint }
  | { t: 'stroke'; x: number; y: number; pts: number[]; size: number; p: Paint }
  | { t: 'erase'; x: number; y: number }
  | { t: 'clear' };

export type Orient = 'l' | 'p';
export const sheetSize = (o: Orient = 'l'): [number, number] => (o === 'p' ? [ART_H, ART_W] : [ART_W, ART_H]);

export type AnimKind = 'breathe' | 'drift' | 'spin' | 'sway' | 'flutter' | 'hop';

/** Một "trường chuyển động" cho chế độ Bức Tranh Thức Giấc. */
export interface AnimPart {
  kind: AnimKind;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  amp: number;
  speed?: number;
  phase?: number;
}

export interface Artwork {
  id: string;
  title: string;
  titleEn: string;
  builtIn: boolean;
  /** Khổ giấy: 'l' = ngang 4:3 (mặc định), 'p' = dọc 3:4. */
  orient?: Orient;
  /** Vẽ nét đen lên canvas trong suốt (kích thước canvas trả về quyết định khổ tranh). */
  render: () => Promise<HTMLCanvasElement>;
  anim: AnimPart[];
}

export function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

export function ctx2d(c: HTMLCanvasElement, readback = false): CanvasRenderingContext2D {
  return c.getContext('2d', readback ? { willReadFrequently: true } : undefined)!;
}
