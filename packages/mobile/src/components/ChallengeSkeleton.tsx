import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonPlaceholder from './SkeletonPlaceholder';
import { useTheme } from '../contexts/ThemeContext';
import { spacing, borderRadius } from '../styles/theme';

export default function ChallengeSkeleton() {
  const { colors } = useTheme();

  const styles = useMemo(() => StyleSheet.create({
    container: { padding: spacing.md },
    streakRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginBottom: spacing.lg,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    promptArea: {
      marginTop: spacing.md,
    },
    buttonRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: spacing.lg,
    },
  }), [colors]);

  return (
    <View style={styles.container}>
      {/* Streak badge skeleton */}
      <View style={styles.streakRow}>
        <SkeletonPlaceholder width={120} height={40} borderRadius={20} />
      </View>

      {/* Challenge card skeleton */}
      <View style={styles.card}>
        <SkeletonPlaceholder width="60%" height={20} borderRadius={4} />
        <View style={styles.promptArea}>
          <SkeletonPlaceholder width="100%" height={16} borderRadius={4} />
          <SkeletonPlaceholder
            width="80%"
            height={16}
            borderRadius={4}
            style={{ marginTop: 8 }}
          />
        </View>
        <SkeletonPlaceholder
          width="40%"
          height={14}
          borderRadius={4}
          style={{ marginTop: spacing.md }}
        />
        <View style={styles.buttonRow}>
          <SkeletonPlaceholder width="48%" height={44} borderRadius={borderRadius.lg} />
          <SkeletonPlaceholder width="48%" height={44} borderRadius={borderRadius.lg} />
        </View>
      </View>

      {/* History skeleton */}
      <SkeletonPlaceholder
        width="50%"
        height={18}
        borderRadius={4}
        style={{ marginBottom: spacing.md }}
      />
      <SkeletonPlaceholder width="100%" height={60} borderRadius={borderRadius.md} />
    </View>
  );
}
