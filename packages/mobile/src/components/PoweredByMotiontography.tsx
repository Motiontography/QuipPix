import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { spacing, typography, borderRadius } from '../styles/theme';

interface Props {
  variant?: 'badge' | 'banner' | 'inline';
}

export function PoweredByMotiontography({ variant = 'badge' }: Props) {
  const { colors } = useTheme();

  const openSite = () => Linking.openURL('https://motiontography.com/portfolio.html');

  if (variant === 'inline') {
    return (
      <TouchableOpacity onPress={openSite} activeOpacity={0.7}>
        <Text style={[styles.inlineText, { color: colors.textMuted }]}>
          Powered by{' '}
          <Text style={{ color: colors.primary, fontWeight: '700' }}>Motiontography</Text>
        </Text>
      </TouchableOpacity>
    );
  }

  if (variant === 'banner') {
    return (
      <TouchableOpacity
        style={[styles.banner, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}
        onPress={openSite}
        activeOpacity={0.8}
      >
        <Text style={[styles.bannerLabel, { color: colors.primary }]}>Powered by</Text>
        <Text style={[styles.bannerBrand, { color: colors.textPrimary }]}>Motiontography</Text>
        <Text style={[styles.bannerSub, { color: colors.textSecondary }]}>
          Professional Photography & Videography
        </Text>
      </TouchableOpacity>
    );
  }

  // Default: badge
  return (
    <TouchableOpacity
      style={[styles.badge, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '35' }]}
      onPress={openSite}
      activeOpacity={0.7}
    >
      <Text style={[styles.badgePrefix, { color: colors.primary }]}>Powered by</Text>
      <Text style={[styles.badgeBrand, { color: colors.textPrimary }]}> Motiontography</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  badgePrefix: {
    ...typography.caption,
    fontWeight: '500',
  },
  badgeBrand: {
    ...typography.caption,
    fontWeight: '800',
  },
  banner: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginHorizontal: spacing.md,
  },
  bannerLabel: {
    ...typography.caption,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  bannerBrand: {
    ...typography.h3,
    fontWeight: '800',
    marginBottom: 2,
  },
  bannerSub: {
    ...typography.caption,
  },
  inlineText: {
    ...typography.caption,
    textAlign: 'center',
  },
});
