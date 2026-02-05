import { StyleId } from '../types';

// ─── Free styles (7) — mirrors backend ───────────────────────────────
export const FREE_STYLES: StyleId[] = [
  'motiontography-ethereal',
  'caricature-classic',
  'caricature-subtle',
  'comic-book',
  'pop-art',
  'pencil-clean',
  'watercolor',
];

export function isProStyle(id: StyleId): boolean {
  return !FREE_STYLES.includes(id);
}

export function isProSize(size: string): boolean {
  return !['1024x1024'].includes(size);
}

export const PRO_SLIDERS = ['microDetail', 'studioRelight', 'backgroundPro'] as const;
