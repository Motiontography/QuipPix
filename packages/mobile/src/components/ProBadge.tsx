import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface ProBadgeProps {
  size?: 'small' | 'default';
}

export default function ProBadge({ size = 'default' }: ProBadgeProps) {
  const { colors } = useTheme();
  const isSmall = size === 'small';

  const styles = useMemo(() => StyleSheet.create({
    badge: {
      backgroundColor: colors.primary,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
    },
    badgeSmall: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
    },
    text: {
      color: '#FFFFFF',
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    textSmall: {
      fontSize: 9,
    },
  }), [colors]);

  return (
    <View style={[styles.badge, isSmall && styles.badgeSmall]}>
      <Text style={[styles.text, isSmall && styles.textSmall]}>PRO</Text>
    </View>
  );
}
