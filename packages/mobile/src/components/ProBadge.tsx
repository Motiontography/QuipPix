import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ProBadgeProps {
  size?: 'small' | 'default';
}

export default function ProBadge({ size = 'default' }: ProBadgeProps) {
  const isSmall = size === 'small';
  return (
    <View style={[styles.badge, isSmall && styles.badgeSmall]}>
      <Text style={[styles.text, isSmall && styles.textSmall]}>PRO</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: '#6C5CE7',
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
});
