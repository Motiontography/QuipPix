export const colors = {
  // Primary
  primary: '#6C5CE7',
  primaryLight: '#A29BFE',
  primaryDark: '#4A3FC7',

  // Accent
  accent: '#FD79A8',
  accentLight: '#FDCB6E',

  // Neutrals
  background: '#0F0F1A',
  surface: '#1A1A2E',
  surfaceLight: '#25253D',
  card: '#2D2D44',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#B0B0CC',
  textMuted: '#6C6C8A',

  // Status
  success: '#00B894',
  warning: '#FDCB6E',
  error: '#E17055',

  // Gradients (start, end)
  gradientPrimary: ['#6C5CE7', '#A29BFE'] as const,
  gradientAccent: ['#FD79A8', '#FDCB6E'] as const,
  gradientDark: ['#0F0F1A', '#1A1A2E'] as const,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

export const typography = {
  h1: { fontSize: 32, fontWeight: '700' as const, letterSpacing: -0.5 },
  h2: { fontSize: 24, fontWeight: '700' as const, letterSpacing: -0.3 },
  h3: { fontSize: 20, fontWeight: '600' as const },
  body: { fontSize: 16, fontWeight: '400' as const },
  bodyBold: { fontSize: 16, fontWeight: '600' as const },
  caption: { fontSize: 13, fontWeight: '400' as const },
  small: { fontSize: 11, fontWeight: '400' as const },
};
