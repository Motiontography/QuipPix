import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useProStore } from '../store/useProStore';
import { useTheme } from '../contexts/ThemeContext';
import { spacing, borderRadius, typography } from '../styles/theme';
import { t } from '../i18n';

const DAILY_LIMIT = 5;

export function GenerationCounter() {
  const { colors } = useTheme();
  const entitlement = useProStore((s) => s.entitlement);
  const dailyGenerations = useProStore((s) => s.dailyGenerations);
  const dailyDate = useProStore((s) => s.dailyDate);

  const today = new Date().toISOString().split('T')[0];
  const used = dailyDate === today ? dailyGenerations : 0;
  const remaining = Math.max(0, DAILY_LIMIT - used);
  const progress = entitlement.proActive ? 1 : used / DAILY_LIMIT;

  if (entitlement.proActive) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface }]}>
        <View style={[styles.badge, { backgroundColor: '#6C5CE7' }]}>
          <Text style={styles.badgeText}>PRO</Text>
        </View>
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          {t('home.unlimitedGenerations')}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={styles.progressRow}>
        <View style={[styles.progressTrack, { backgroundColor: colors.surfaceLight }]}>
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: remaining > 1 ? colors.primary : colors.warning,
                width: `${Math.min(progress * 100, 100)}%`,
              },
            ]}
          />
        </View>
        <Text style={[styles.count, { color: colors.textPrimary }]}>
          {used}/{DAILY_LIMIT}
        </Text>
      </View>
      <Text style={[styles.label, { color: colors.textSecondary }]}>
        {t('home.generationsToday', {
          used: String(used),
          total: String(DAILY_LIMIT),
        })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  count: {
    ...typography.bodyBold,
    fontSize: 13,
    minWidth: 30,
    textAlign: 'right',
  },
  label: {
    ...typography.caption,
    marginTop: 4,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
