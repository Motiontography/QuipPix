import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GradientButton } from './GradientButton';
import { useTheme } from '../contexts/ThemeContext';
import { triggerHaptic } from '../services/haptics';
import { spacing, borderRadius, typography } from '../styles/theme';
import { t } from '../i18n';

export type ErrorCategory = 'network' | 'server' | 'timeout' | 'limit' | 'unknown';

interface RetryBannerProps {
  error: string;
  category: ErrorCategory;
  onRetry: () => void;
  onGoBack: () => void;
  onUpgrade?: () => void;
  retryCount: number;
  maxRetries: number;
}

const CATEGORY_ICONS: Record<ErrorCategory, string> = {
  network: '📡',
  server: '☁️',
  timeout: '⏱',
  limit: '🔒',
  unknown: '⚠️',
};

const CATEGORY_MESSAGES: Record<ErrorCategory, string> = {
  network: 'generating.networkError',
  server: 'generating.serverError',
  timeout: 'generating.timeoutError',
  limit: 'generating.dailyLimitError',
  unknown: 'generating.unknownError',
};

export function RetryBanner({
  error,
  category,
  onRetry,
  onGoBack,
  onUpgrade,
  retryCount,
  maxRetries,
}: RetryBannerProps) {
  const { colors } = useTheme();
  const canRetry = category !== 'limit' && retryCount < maxRetries;
  const messageKey = CATEGORY_MESSAGES[category] as any;

  function handleRetry() {
    triggerHaptic('medium');
    onRetry();
  }

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{CATEGORY_ICONS[category]}</Text>

      <Text style={[styles.title, { color: colors.textPrimary }]}>
        {category === 'limit' ? t('generating.limitReached') : t('generating.oops')}
      </Text>

      <Text style={[styles.message, { color: colors.textSecondary }]}>
        {t(messageKey)}
      </Text>

      <Text style={[styles.attempt, { color: colors.warning }]}>
        {error}
      </Text>

      {retryCount > 0 && category !== 'limit' && (
        <Text style={[styles.attempt, { color: colors.textMuted }]}>
          {t('generating.retryAttempt', {
            current: String(retryCount),
            max: String(maxRetries),
          })}
        </Text>
      )}

      {retryCount >= maxRetries && category !== 'limit' && (
        <Text style={[styles.maxRetries, { color: colors.warning }]}>
          {t('generating.maxRetriesReached')}
        </Text>
      )}

      <View style={styles.buttons}>
        {category === 'limit' && onUpgrade ? (
          <GradientButton
            title={t('generating.upgradeToPro')}
            onPress={onUpgrade}
            variant="primary"
            style={styles.btn}
          />
        ) : canRetry ? (
          <GradientButton
            title={t('generating.retry')}
            onPress={handleRetry}
            variant="primary"
            style={styles.btn}
          />
        ) : null}

        <GradientButton
          title={t('generating.goBack')}
          onPress={onGoBack}
          variant="dark"
          style={styles.btn}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  icon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h2,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  message: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  attempt: {
    ...typography.caption,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  maxRetries: {
    ...typography.caption,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  buttons: {
    width: '100%',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  btn: {
    borderRadius: borderRadius.md,
  },
});
