import { StyleId } from '../types';

// ─── Free styles (6) ─────────────────────────────────────────────────
export const FREE_STYLES: StyleId[] = [
  'caricature-classic',
  'caricature-subtle',
  'comic-book',
  'pop-art',
  'pencil-clean',
  'watercolor',
];

// ─── Pro-only styles (9) ─────────────────────────────────────────────
export const PRO_ONLY_STYLES: StyleId[] = [
  'caricature-editorial',
  'pencil-gritty',
  'oil-painting',
  'anime-inspired',
  'cyberpunk-neon',
  'magazine-cover',
  'pro-headshot',
  'dreamy-portrait',
  'editorial-fashion',
];

// ─── Size tiers ──────────────────────────────────────────────────────
export type OutputSize =
  | '1024x1024'
  | '1024x1792'
  | '1792x1024'
  | '2048x2048'
  | '2048x3584'
  | '3584x2048'
  | '4096x4096';

const FREE_SIZES: OutputSize[] = ['1024x1024', '1024x1792', '1792x1024'];

const PRO_SIZES: OutputSize[] = [
  '1024x1024',
  '1024x1792',
  '1792x1024',
  '2048x2048',
  '2048x3584',
  '3584x2048',
  '4096x4096',
];

export type Tier = 'free' | 'pro';

export function isStyleAllowed(styleId: StyleId, tier: Tier): boolean {
  if (tier === 'pro') return true;
  return FREE_STYLES.includes(styleId);
}

export function isSizeAllowed(size: OutputSize, tier: Tier): boolean {
  if (tier === 'pro') return PRO_SIZES.includes(size);
  return FREE_SIZES.includes(size);
}
