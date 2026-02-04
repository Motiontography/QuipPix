import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonPlaceholder from './SkeletonPlaceholder';
import { useTheme } from '../contexts/ThemeContext';
import { spacing, borderRadius } from '../styles/theme';

export default function GallerySkeleton() {
  const { colors } = useTheme();

  const styles = useMemo(() => StyleSheet.create({
    container: { padding: spacing.md },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: spacing.md,
    },
    card: {
      flex: 1,
      marginHorizontal: spacing.xs,
    },
    textRow: {
      marginTop: spacing.sm,
    },
  }), [colors]);

  const Card = () => (
    <View style={styles.card}>
      <SkeletonPlaceholder width="100%" height={160} borderRadius={borderRadius.lg} />
      <SkeletonPlaceholder
        width="70%"
        height={14}
        borderRadius={4}
        style={styles.textRow}
      />
      <SkeletonPlaceholder
        width="40%"
        height={10}
        borderRadius={4}
        style={{ marginTop: 6 }}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      {[0, 1, 2].map((row) => (
        <View key={row} style={styles.row}>
          <Card />
          <Card />
        </View>
      ))}
    </View>
  );
}
