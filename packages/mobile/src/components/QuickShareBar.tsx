import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { useTheme } from '../contexts/ThemeContext';
import { triggerHaptic } from '../services/haptics';
import { trackEvent } from '../services/analytics';
import { spacing, borderRadius, typography } from '../styles/theme';
import { t } from '../i18n';

interface QuickShareBarProps {
  onSelectPlatform: (platform: string) => void;
}

const ALL_PLATFORMS = [
  { key: 'instagram', icon: '\uD83D\uDCF7', label: 'Instagram' },
  { key: 'twitter', icon: '\uD83D\uDC26', label: 'Twitter' },
  { key: 'tiktok', icon: '\uD83C\uDFB5', label: 'TikTok' },
  { key: 'whatsapp', icon: '\uD83D\uDCAC', label: 'WhatsApp' },
  { key: 'facebook', icon: '\uD83D\uDC65', label: 'Facebook' },
];

export function QuickShareBar({ onSelectPlatform }: QuickShareBarProps) {
  const { colors } = useTheme();
  const shareHistory = useAppStore((s) => s.shareHistory);

  // Sort platforms by recent usage frequency
  const sortedPlatforms = useMemo(() => {
    const counts: Record<string, number> = {};
    shareHistory.slice(0, 50).forEach((r) => {
      counts[r.platform] = (counts[r.platform] ?? 0) + 1;
    });
    return [...ALL_PLATFORMS].sort(
      (a, b) => (counts[b.key] ?? 0) - (counts[a.key] ?? 0),
    );
  }, [shareHistory]);

  function handleSelect(platform: string) {
    triggerHaptic('light');
    trackEvent('quick_share_used', { platform });
    onSelectPlatform(platform);
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textMuted }]}>
        {t('share.quickShare')}
      </Text>
      <View style={styles.row}>
        {sortedPlatforms.map((p) => (
          <TouchableOpacity
            key={p.key}
            style={[styles.chip, { backgroundColor: colors.surfaceLight }]}
            onPress={() => handleSelect(p.key)}
            accessibilityLabel={`Share to ${p.label}`}
            accessibilityRole="button"
          >
            <Text style={styles.chipIcon}>{p.icon}</Text>
            <Text style={[styles.chipLabel, { color: colors.textPrimary }]} numberOfLines={1}>
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm,
  },
  label: {
    ...typography.caption,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  chip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: 2,
  },
  chipIcon: {
    fontSize: 20,
  },
  chipLabel: {
    ...typography.small,
    fontSize: 10,
  },
});
