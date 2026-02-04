import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { useTheme } from '../contexts/ThemeContext';
import { spacing, typography } from '../styles/theme';
import { t } from '../i18n';

export function GalleryStatsFooter() {
  const { colors } = useTheme();
  const getGalleryStats = useAppStore((s) => s.getGalleryStats);
  const stats = getGalleryStats();

  if (stats.count === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={[styles.text, { color: colors.textMuted }]}>
        {t('gallery.statsFooter', { count: String(stats.count) })}
        {stats.styleCount > 0 ? ` \u00b7 ${stats.styleCount} styles` : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingBottom: spacing.xl,
  },
  text: {
    ...typography.caption,
  },
});
