import { Action } from '../types';

/** Lưu trữ IndexedDB: tiến độ từng tranh + tranh phụ huynh tải lên. */

export interface Progress {
  id: string;
  actions: Action[];
  thumb?: string;
  done?: boolean;
  updated: number;
  /** Phiên bản bộ nét lúc lưu (xem ART_VERSION). */
  art?: number;
}

/**
 * Phiên bản bộ nét của tranh mẫu & Xưởng Phép Thuật. Tiến độ lưu là các nét tô theo toạ độ trên
 * nét vẽ cũ, nên khi vẽ lại bộ hình phải tăng số này: tiến độ cũ bị bỏ qua thay vì đổ màu lệch
 * lên nét mới. Tranh phụ huynh tải lên (`upload-`) không đổi nét nên luôn giữ tiến độ.
 */
export const ART_VERSION = 2;
const current = (p: Progress | undefined) => (p && (p.id.startsWith('upload-') || p.art === ART_VERSION) ? p : undefined);

/** Tranh bé tự ghép ở Xưởng Phép Thuật: chỉ lưu "công thức", tranh được dựng lại khi mở. */
export interface CustomRecord {
  id: string;
  recipe: { orient: 'l' | 'p'; hero: string; comp: string; bg: string; seed: number };
  created: number;
}

export interface UploadRecord {
  id: string;
  title: string;
  line: Blob;
  created: number;
}

const DB = 'magic-coloring-book';
let dbp: Promise<IDBDatabase> | null = null;

function open(): Promise<IDBDatabase> {
  if (!dbp) {
    dbp = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB, 2);
      req.onupgradeneeded = () => {
        const db = req.result;
        for (const name of ['progress', 'uploads', 'custom']) if (!db.objectStoreNames.contains(name)) db.createObjectStore(name, { keyPath: 'id' });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbp;
}

async function run<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T | undefined> {
  try {
    const db = await open();
    return await new Promise<T>((resolve, reject) => {
      const req = fn(db.transaction(store, mode).objectStore(store));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn('Storage', e);
    return undefined;
  }
}

export const Storage = {
  getProgress: async (id: string) => current(await run<Progress>('progress', 'readonly', (s) => s.get(id))),
  allProgress: async () => ((await run<Progress[]>('progress', 'readonly', (s) => s.getAll())) ?? []).filter((p) => current(p)),
  saveProgress: (p: Progress) => run('progress', 'readwrite', (s) => s.put({ ...p, art: ART_VERSION })),
  deleteProgress: (id: string) => run('progress', 'readwrite', (s) => s.delete(id)),
  allUploads: async () => (await run<UploadRecord[]>('uploads', 'readonly', (s) => s.getAll())) ?? [],
  saveUpload: (u: UploadRecord) => run('uploads', 'readwrite', (s) => s.put(u)),
  deleteUpload: (id: string) => run('uploads', 'readwrite', (s) => s.delete(id)),
  allCustom: async () => (await run<CustomRecord[]>('custom', 'readonly', (s) => s.getAll())) ?? [],
  saveCustom: (c: CustomRecord) => run('custom', 'readwrite', (s) => s.put(c)),
  deleteCustom: (id: string) => run('custom', 'readwrite', (s) => s.delete(id)),
  async clearAll() {
    await run('progress', 'readwrite', (s) => s.clear());
    await run('uploads', 'readwrite', (s) => s.clear());
    await run('custom', 'readwrite', (s) => s.clear());
    try {
      localStorage.removeItem('mcb-settings');
    } catch {}
  },
};

export interface Settings {
  sound: boolean;
  voice: boolean;
}

export function loadSettings(): Settings {
  try {
    return { sound: true, voice: true, ...JSON.parse(localStorage.getItem('mcb-settings') || '{}') };
  } catch {
    return { sound: true, voice: true };
  }
}

export function saveSettings(s: Settings) {
  try {
    localStorage.setItem('mcb-settings', JSON.stringify(s));
  } catch {}
}
