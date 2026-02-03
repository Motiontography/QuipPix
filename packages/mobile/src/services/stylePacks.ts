import { StylePack, StyleId } from '../types';

export const stylePacks: StylePack[] = [
  {
    id: 'caricature-classic',
    displayName: 'Classic Caricature',
    category: 'Caricature',
    icon: '🎭',
    description: 'Big-head, fun exaggeration of your features',
    previewColor: '#E17055',
    proOnly: false,
  },
  {
    id: 'caricature-subtle',
    displayName: 'Subtle Caricature',
    category: 'Caricature',
    icon: '😏',
    description: 'Elegant, flattering caricature with light touch',
    previewColor: '#FDCB6E',
    proOnly: false,
  },
  {
    id: 'caricature-editorial',
    displayName: 'Editorial Caricature',
    category: 'Caricature',
    icon: '📰',
    description: 'Newspaper/magazine style illustration',
    previewColor: '#636E72',
    proOnly: true,
  },
  {
    id: 'comic-book',
    displayName: 'Comic Book',
    category: 'Illustrated',
    icon: '💥',
    description: 'Bold ink outlines with halftone dots',
    previewColor: '#0984E3',
    proOnly: false,
  },
  {
    id: 'pop-art',
    displayName: 'Pop Art',
    category: 'Illustrated',
    icon: '🎨',
    description: 'Warhol/Lichtenstein bold color pop',
    previewColor: '#E84393',
    proOnly: false,
  },
  {
    id: 'pencil-clean',
    displayName: 'Pencil — Clean',
    category: 'Drawn',
    icon: '✏️',
    description: 'Precise, clean pencil sketch on white paper',
    previewColor: '#DFE6E9',
    proOnly: false,
  },
  {
    id: 'pencil-gritty',
    displayName: 'Pencil — Gritty',
    category: 'Drawn',
    icon: '🖊️',
    description: 'Textured charcoal sketch on aged paper',
    previewColor: '#636E72',
    proOnly: true,
  },
  {
    id: 'watercolor',
    displayName: 'Watercolor',
    category: 'Painted',
    icon: '🌊',
    description: 'Soft washes, visible brushstrokes, luminous',
    previewColor: '#74B9FF',
    proOnly: false,
  },
  {
    id: 'oil-painting',
    displayName: 'Oil Painting',
    category: 'Painted',
    icon: '🖼️',
    description: 'Rich impasto texture, gallery-quality',
    previewColor: '#A29BFE',
    proOnly: true,
  },
  {
    id: 'anime-inspired',
    displayName: 'Anime-Inspired',
    category: 'Illustrated',
    icon: '⭐',
    description: 'Original anime aesthetic, expressive eyes',
    previewColor: '#FD79A8',
    proOnly: true,
  },
  {
    id: 'cyberpunk-neon',
    displayName: 'Cyberpunk Neon',
    category: 'Digital',
    icon: '🌆',
    description: 'Neon-lit, rain-slicked futuristic vibes',
    previewColor: '#00CEC9',
    proOnly: true,
  },
  {
    id: 'magazine-cover',
    displayName: 'Magazine Cover',
    category: 'Pro',
    icon: '📖',
    description: 'Professional cover with custom text',
    previewColor: '#6C5CE7',
    proOnly: true,
  },
  {
    id: 'pro-headshot',
    displayName: 'Pro Headshot',
    category: 'Pro',
    icon: '📸',
    description: 'Studio-lit, clean background professional shot',
    previewColor: '#00B894',
    proOnly: true,
  },
  {
    id: 'dreamy-portrait',
    displayName: 'Dreamy Portrait',
    category: 'Portrait',
    icon: '✨',
    description: 'Soft, ethereal, inspirational portrait',
    previewColor: '#FFEAA7',
    proOnly: true,
  },
  {
    id: 'editorial-fashion',
    displayName: 'Editorial Fashion',
    category: 'Pro',
    icon: '👗',
    description: 'High-contrast, glossy fashion editorial',
    previewColor: '#2D3436',
    proOnly: true,
  },
];

export function getStylePack(id: StyleId): StylePack {
  const pack = stylePacks.find((p) => p.id === id);
  if (!pack) throw new Error(`Unknown style: ${id}`);
  return pack;
}

export const styleCategories = [...new Set(stylePacks.map((p) => p.category))];

export function getStylesByCategory(category: string): StylePack[] {
  return stylePacks.filter((p) => p.category === category);
}
