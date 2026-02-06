import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useProStore } from '../store/useProStore';
import { useTheme } from '../contexts/ThemeContext';
import { spacing, borderRadius, typography } from '../styles/theme';
import { RootStackParamList } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function GenerationCounter() {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const credits = useProStore((s) => s.credits);

  const handleBuyCredits = () => {
    navigation.navigate('Paywall', { trigger: 'credits_counter' });
  };

  const lowCredits = credits <= 3 && credits > 0;
  const noCredits = credits === 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <View style={styles.row}>
        <View style={styles.creditsInfo}>
          <Text style={[styles.creditsAmount, { color: colors.textPrimary }]}>
            {credits}
          </Text>
          <Text style={[styles.creditsLabel, { color: colors.textSecondary }]}>
            credit{credits !== 1 ? 's' : ''} remaining
          </Text>
        </View>
        {(lowCredits || noCredits) && (
          <TouchableOpacity
            style={[styles.buyBtn, noCredits && styles.buyBtnUrgent]}
            onPress={handleBuyCredits}
          >
            <Text style={styles.buyBtnText}>
              {noCredits ? 'Buy Credits' : '+ Get More'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  creditsInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  creditsAmount: {
    fontSize: 24,
    fontWeight: '700',
  },
  creditsLabel: {
    ...typography.body,
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
  buyBtn: {
    backgroundColor: '#6C5CE7',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  buyBtnUrgent: {
    backgroundColor: '#E17055',
  },
  buyBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
});
