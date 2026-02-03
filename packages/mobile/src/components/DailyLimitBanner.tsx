import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useProStore } from '../store/useProStore';
import { colors, spacing, borderRadius, typography } from '../styles/theme';

const DAILY_LIMIT = 5;

export default function DailyLimitBanner() {
  const entitlement = useProStore((s) => s.entitlement);
  const dailyGenerations = useProStore((s) => s.dailyGenerations);
  const isDailyLimitReached = useProStore((s) => s.isDailyLimitReached);
  const [, setTick] = useState(0);

  // Refresh every minute if limit is reached (for cooldown timer display)
  useEffect(() => {
    if (!isDailyLimitReached()) return;
    const interval = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(interval);
  }, [isDailyLimitReached]);

  if (entitlement.proActive) return null;

  const remaining = Math.max(DAILY_LIMIT - dailyGenerations, 0);
  const limitReached = isDailyLimitReached();

  return (
    <View style={[styles.banner, limitReached && styles.bannerWarning]}>
      {limitReached ? (
        <Text style={styles.textWarning}>
          Daily limit reached. Upgrade to Pro for unlimited generations.
        </Text>
      ) : (
        <Text style={styles.text}>
          {remaining} generation{remaining !== 1 ? 's' : ''} remaining today
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    alignItems: 'center',
  },
  bannerWarning: {
    backgroundColor: '#E17055' + '20',
  },
  text: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  textWarning: {
    ...typography.caption,
    color: '#E17055',
    fontWeight: '600',
  },
});
