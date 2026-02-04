import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { triggerHaptic } from '../services/haptics';
import { trackEvent } from '../services/analytics';
import { spacing, borderRadius, typography } from '../styles/theme';
import { t } from '../i18n';

export type DateRange = 'all' | 'today' | 'week' | 'month';

interface DateFilterProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

const OPTIONS: { key: DateRange; labelKey: string }[] = [
  { key: 'all', labelKey: 'gallery.dateAll' },
  { key: 'today', labelKey: 'gallery.dateToday' },
  { key: 'week', labelKey: 'gallery.dateWeek' },
  { key: 'month', labelKey: 'gallery.dateMonth' },
];

export function getDateFilterStart(range: DateRange): Date | null {
  if (range === 'all') return null;
  const now = new Date();
  if (range === 'today') {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  if (range === 'week') {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    return d;
  }
  // month
  const d = new Date(now);
  d.setMonth(d.getMonth() - 1);
  return d;
}

export function DateFilter({ value, onChange }: DateFilterProps) {
  const { colors } = useTheme();

  function handleSelect(range: DateRange) {
    if (range === value) return;
    triggerHaptic('selection');
    trackEvent('date_filter_applied', { range });
    onChange(range);
  }

  return (
    <View style={styles.container}>
      {OPTIONS.map((opt) => {
        const active = value === opt.key;
        return (
          <TouchableOpacity
            key={opt.key}
            style={[
              styles.chip,
              {
                backgroundColor: active ? colors.primary : colors.surfaceLight,
              },
            ]}
            onPress={() => handleSelect(opt.key)}
            accessibilityLabel={t(opt.labelKey as any)}
            accessibilityRole="button"
          >
            <Text
              style={[
                styles.chipText,
                { color: active ? '#FFFFFF' : colors.textSecondary },
              ]}
            >
              {t(opt.labelKey as any)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
  },
  chipText: {
    ...typography.small,
    fontWeight: '600',
  },
});
