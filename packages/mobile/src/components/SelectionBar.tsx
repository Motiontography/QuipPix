import React, { useEffect, useRef } from 'react';
import {
  Animated,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { spacing, borderRadius, typography } from '../styles/theme';

interface SelectionBarProps {
  selectedCount: number;
  onDelete: () => void;
  onShare: () => void;
  onAddToCollection: () => void;
  onSelectAll: () => void;
  onCancel: () => void;
}

export function SelectionBar({
  selectedCount,
  onDelete,
  onShare,
  onAddToCollection,
  onSelectAll,
  onCancel,
}: SelectionBarProps) {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const translateY = useRef(new Animated.Value(100)).current;

  useEffect(() => {
    if (reduceMotion) {
      translateY.setValue(0);
    } else {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
      }).start();
    }
  }, [reduceMotion, translateY]);

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: colors.surface, borderTopColor: colors.surfaceLight, transform: [{ translateY }] },
      ]}
    >
      <View style={styles.row}>
        <TouchableOpacity onPress={onDelete} style={styles.action}>
          <Text style={styles.actionIcon}>🗑</Text>
          <Text style={[styles.actionLabel, { color: colors.error }]}>Delete</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onShare} style={styles.action}>
          <Text style={styles.actionIcon}>↗</Text>
          <Text style={[styles.actionLabel, { color: colors.textPrimary }]}>Share</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onAddToCollection} style={styles.action}>
          <Text style={styles.actionIcon}>📁</Text>
          <Text style={[styles.actionLabel, { color: colors.textPrimary }]}>Collection</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onSelectAll} style={styles.action}>
          <Text style={styles.actionIcon}>☑</Text>
          <Text style={[styles.actionLabel, { color: colors.primary }]}>All</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingBottom: spacing.lg,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  action: {
    alignItems: 'center',
    gap: 4,
  },
  actionIcon: {
    fontSize: 22,
  },
  actionLabel: {
    ...typography.small,
  },
});
