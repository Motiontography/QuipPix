import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useProStore } from '../store/useProStore';
import { spacing, borderRadius, typography } from '../styles/theme';
import { useTheme } from '../contexts/ThemeContext';
import { RootStackParamList } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function DailyLimitBanner() {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const credits = useProStore((s) => s.credits);
  const hasCredits = useProStore((s) => s.hasCredits);

  const noCredits = !hasCredits();

  const styles = useMemo(() => StyleSheet.create({
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
    buyLink: {
      ...typography.caption,
      color: colors.primary,
      fontWeight: '600',
      textDecorationLine: 'underline',
      marginTop: 4,
    },
  }), [colors]);

  const handleBuyCredits = () => {
    navigation.navigate('Paywall', { trigger: 'no_credits' });
  };

  return (
    <View style={[styles.banner, noCredits && styles.bannerWarning]}>
      {noCredits ? (
        <>
          <Text style={styles.textWarning}>
            No credits remaining
          </Text>
          <TouchableOpacity onPress={handleBuyCredits}>
            <Text style={styles.buyLink}>Buy credits to continue</Text>
          </TouchableOpacity>
        </>
      ) : (
        <Text style={styles.text}>
          {credits} credit{credits !== 1 ? 's' : ''} remaining
        </Text>
      )}
    </View>
  );
}
