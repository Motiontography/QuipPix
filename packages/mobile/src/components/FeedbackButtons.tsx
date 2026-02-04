import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { useTheme } from '../contexts/ThemeContext';
import { triggerHaptic } from '../services/haptics';
import { trackEvent } from '../services/analytics';
import { spacing, borderRadius, typography } from '../styles/theme';
import { t } from '../i18n';

interface FeedbackButtonsProps {
  itemId: string;
}

export function FeedbackButtons({ itemId }: FeedbackButtonsProps) {
  const { colors } = useTheme();
  const submitFeedback = useAppStore((s) => s.submitFeedback);
  const hasFeedback = useAppStore((s) => s.hasFeedback);
  const feedbackItems = useAppStore((s) => s.feedbackItems);
  const [submitted, setSubmitted] = useState(hasFeedback(itemId));

  const existing = feedbackItems[itemId];

  function handleFeedback(positive: boolean) {
    triggerHaptic('light');
    submitFeedback(itemId, positive);
    setSubmitted(true);
    trackEvent('feedback_submitted', { positive, itemId });
  }

  if (submitted) {
    return (
      <View style={styles.container}>
        <Text style={[styles.thanks, { color: colors.textMuted }]}>
          {existing === true ? '\uD83D\uDC4D' : existing === false ? '\uD83D\uDC4E' : '\u2713'}{' '}
          {t('result.feedbackSubmitted')}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>
        {t('result.rateResult')}
      </Text>
      <View style={styles.buttons}>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: colors.success + '20' }]}
          onPress={() => handleFeedback(true)}
          accessibilityLabel="Thumbs up"
          accessibilityRole="button"
        >
          <Text style={styles.btnIcon}>{'\uD83D\uDC4D'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: colors.error + '20' }]}
          onPress={() => handleFeedback(false)}
          accessibilityLabel="Thumbs down"
          accessibilityRole="button"
        >
          <Text style={styles.btnIcon}>{'\uD83D\uDC4E'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  label: {
    ...typography.caption,
  },
  buttons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  btn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  btnIcon: {
    fontSize: 20,
  },
  thanks: {
    ...typography.caption,
  },
});
