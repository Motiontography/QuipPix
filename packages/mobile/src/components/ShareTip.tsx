import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { spacing, borderRadius, typography } from '../styles/theme';
import { t } from '../i18n';

interface ShareTipProps {
  platform?: string;
}

const TIPS: Record<string, string> = {
  instagram: 'share.tipInstagram',
  twitter: 'share.tipTwitter',
  tiktok: 'share.tipTikTok',
};

export function ShareTip({ platform }: ShareTipProps) {
  const { colors } = useTheme();
  const tipKey = platform && TIPS[platform] ? TIPS[platform] : 'share.tipGeneral';

  return (
    <View style={[styles.container, { backgroundColor: colors.primary + '10' }]}>
      <Text style={[styles.label, { color: colors.primary }]}>
        {t('share.tip')}
      </Text>
      <Text style={[styles.text, { color: colors.textSecondary }]}>
        {t(tipKey as any)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    marginVertical: spacing.sm,
  },
  label: {
    ...typography.bodyBold,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  text: {
    ...typography.caption,
    lineHeight: 18,
  },
});
