import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { triggerHaptic } from '../services/haptics';
import { spacing, borderRadius, typography } from '../styles/theme';
import { useTheme } from '../contexts/ThemeContext';

interface StreakBadgeProps {
  currentStreak: number;
  longestStreak: number;
}

const MILESTONES = [3, 7, 14, 30, 50, 100];

export default function StreakBadge({ currentStreak, longestStreak }: StreakBadgeProps) {
  const { colors } = useTheme();
  const prevStreak = useRef(currentStreak);

  useEffect(() => {
    if (currentStreak !== prevStreak.current && MILESTONES.includes(currentStreak)) {
      triggerHaptic('medium');
    }
    prevStreak.current = currentStreak;
  }, [currentStreak]);

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      alignItems: 'center',
    },
    streakItem: {
      flex: 1,
      alignItems: 'center',
    },
    streakNumber: {
      ...typography.h1,
      color: colors.accent,
      fontSize: 28,
    },
    streakLabel: {
      ...typography.caption,
      color: colors.textSecondary,
      marginTop: 2,
    },
    divider: {
      width: 1,
      height: 40,
      backgroundColor: colors.surfaceLight,
    },
  }), [colors]);

  return (
    <View style={styles.container}>
      <View style={styles.streakItem}>
        <Text style={styles.streakNumber}>{currentStreak}</Text>
        <Text style={styles.streakLabel}>Current Streak</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.streakItem}>
        <Text style={styles.streakNumber}>{longestStreak}</Text>
        <Text style={styles.streakLabel}>Best Streak</Text>
      </View>
    </View>
  );
}
