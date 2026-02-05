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
// OpenAI GPT Image models support: 1024x1024, 1536x1024, 1024x1536, auto
export type OutputSize =
  | '1024x1024'
  | '1536x1024'
  | '1024x1536'
  | 'auto';

const FREE_SIZES: OutputSize[] = ['1024x1024'];

const PRO_SIZES: OutputSize[] = [
  '1024x1024',
  '1536x1024',
  '1024x1536',
  'auto',
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
