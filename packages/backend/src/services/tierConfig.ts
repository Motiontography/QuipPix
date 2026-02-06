import { StyleId } from '../types';

// ─── Output sizes ────────────────────────────────────────────────────
// OpenAI GPT Image models support: 1024x1024, 1536x1024, 1024x1536, auto
export type OutputSize =
  | '1024x1024'
  | '1536x1024'
  | '1024x1536'
  | 'auto';

const VALID_SIZES: OutputSize[] = [
  '1024x1024',
  '1536x1024',
  '1024x1536',
  'auto',
];

// Tier kept for backward compat but effectively unused — all users are equal.
export type Tier = 'free' | 'pro';

export function isStyleAllowed(_styleId: StyleId, _tier: Tier): boolean {
  return true; // All styles available to everyone (credits are the gate)
}

export function isSizeAllowed(size: OutputSize, _tier: Tier): boolean {
  return VALID_SIZES.includes(size);
}
