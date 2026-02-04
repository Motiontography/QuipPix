import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Animated,
  Easing,
  TouchableOpacity,
} from 'react-native';
import { t } from '../i18n';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { api, ApiError } from '../api/client';
import { getStylePack } from '../services/stylePacks';
import { useProStore } from '../store/useProStore';
import { useChallengeStore } from '../store/useChallengeStore';
import { trackEvent } from '../services/analytics';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { queueGeneration } from '../services/offlineQueue';
import { triggerHaptic } from '../services/haptics';
import { spacing, typography, borderRadius } from '../styles/theme';
import { useTheme } from '../contexts/ThemeContext';
import { CircularProgress } from '../components/CircularProgress';
import { FadingMessage } from '../components/FadingMessage';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { RetryBanner } from '../components/RetryBanner';
import { classifyError, ErrorCategory } from '../utils/errorClassifier';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Generating'>;
type Route = RouteProp<RootStackParamList, 'Generating'>;

const FUN_MESSAGES = [
  'Mixing the perfect colors...',
  'Teaching the AI about style...',
  'Rendering your masterpiece...',
  'Adding the finishing touches...',
  'Almost there, looking great...',
  'Polishing every pixel...',
];

export default function GeneratingScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { imageUri, params, challengeId } = route.params;
  const stylePack = getStylePack(params.styleId);
  const { colors } = useTheme();
  const { isConnected } = useNetworkStatus();
  const reduceMotion = useReducedMotion();

  const entitlement = useProStore((s) => s.entitlement);
  const isDailyLimitReached = useProStore((s) => s.isDailyLimitReached);
  const incrementDailyGenerations = useProStore((s) => s.incrementDailyGenerations);
  const incrementSuccessfulGenerations = useProStore((s) => s.incrementSuccessfulGenerations);

  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [errorCategory, setErrorCategory] = useState<ErrorCategory | null>(null);
  const [retryTrigger, setRetryTrigger] = useState(0);
  const spinAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Spin animation
  useEffect(() => {
    if (reduceMotion) {
      spinAnim.setValue(0);
      pulseAnim.setValue(1);
      return;
    }

    const spin = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    spin.start();

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();

    return () => {
      spin.stop();
      pulse.stop();
    };
  }, [spinAnim, pulseAnim, reduceMotion]);

  // Submit job and poll
  useEffect(() => {
    let cancelled = false;

    (async () => {
      // Check daily limit for free users
      if (!entitlement.proActive && isDailyLimitReached()) {
        setError(t('generating.dailyLimitError'));
        trackEvent('daily_limit_reached');
        return;
      }

      // Queue for later if offline
      if (!isConnected) {
        await queueGeneration(imageUri, params);
        trackEvent('generation_queued_offline', { styleId: params.styleId });
        if (!cancelled) {
          setError(t('generating.offlineQueued'));
        }
        return;
      }

      try {
        const { jobId } = await api.generate(imageUri, params);

        const finalStatus = await api.pollUntilDone(
          jobId,
          (status) => {
            if (!cancelled) {
              setProgress(status.progress);
            }
          },
          2000,
          180_000,
        );

        if (cancelled) return;

        if (finalStatus.status === 'done' && finalStatus.resultUrl) {
          incrementDailyGenerations();
          incrementSuccessfulGenerations();
          trackEvent('generation_completed', { styleId: params.styleId });

          // Record challenge completion if this was a challenge flow
          if (challengeId) {
            const today = new Date().toISOString().split('T')[0];
            api.submitChallenge(challengeId, jobId).catch(() => {});
            useChallengeStore.getState().addCompletion({
              challengeId,
              date: today,
              jobId,
              resultUrl: finalStatus.resultUrl,
              styleId: params.styleId,
              completedAt: new Date().toISOString(),
            });
            trackEvent('challenge_completed', { challengeId, styleId: params.styleId });
          }

          triggerHaptic('success');
          navigation.replace('Result', {
            jobId,
            resultUrl: finalStatus.resultUrl,
            params,
            sourceImageUri: imageUri,
          });
        } else {
          triggerHaptic('error');
          setError(finalStatus.error || t('generating.generationFailed'));
        }
      } catch (err: any) {
        if (!cancelled) {
          triggerHaptic('error');
          if (err instanceof ApiError && err.body?.message) {
            setError(err.body.message);
          } else {
            setError(err.message || t('generating.somethingWrong'));
          }
          const category = classifyError(err);
          setErrorCategory(category);
          trackEvent('generation_error', { category, styleId: params.styleId });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [imageUri, params, challengeId, navigation, entitlement, isDailyLimitReached, incrementDailyGenerations, incrementSuccessfulGenerations, isConnected, retryTrigger]);

  const handleRetry = () => {
    if (retryCount >= 3) {
      trackEvent('generation_max_retries', { styleId: params.styleId });
      return;
    }
    setRetryCount((prev) => prev + 1);
    setError('');
    setErrorCategory(null);
    setRetryTrigger((prev) => prev + 1);
    trackEvent('generation_retry', { attempt: retryCount + 1, category: errorCategory || 'unknown', styleId: params.styleId });
  };

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing.xl,
    },
    iconContainer: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    icon: { fontSize: 48 },
    title: {
      ...typography.h2,
      color: colors.textPrimary,
      textAlign: 'center',
      marginBottom: spacing.sm,
    },
    message: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: spacing.xl,
    },
    progressBar: {
      width: '100%',
      height: 8,
      backgroundColor: colors.surfaceLight,
      borderRadius: 4,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: 4,
    },
    progressText: {
      ...typography.caption,
      color: colors.textMuted,
      marginTop: spacing.sm,
    },
    errorIcon: {
      fontSize: 48,
      color: colors.error,
      marginBottom: spacing.md,
    },
    errorTitle: {
      ...typography.h2,
      color: colors.error,
      marginBottom: spacing.sm,
    },
    errorMsg: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: spacing.lg,
    },
    upgradeBtn: {
      backgroundColor: '#6C5CE7',
      borderRadius: borderRadius.lg,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.xl,
      marginBottom: spacing.md,
    },
    upgradeBtnText: {
      ...typography.bodyBold,
      color: '#FFFFFF',
    },
    retryBtn: {
      ...typography.bodyBold,
      color: colors.primary,
      padding: spacing.md,
    },
  }), [colors]);

  const spinInterp = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <RetryBanner
            error={error}
            category={errorCategory || 'unknown'}
            onRetry={handleRetry}
            onGoBack={() => navigation.goBack()}
            onUpgrade={() => navigation.navigate('Paywall', { trigger: 'daily_limit' })}
            retryCount={retryCount}
            maxRetries={3}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.center}>
        <Animated.View
          style={[
            styles.iconContainer,
            { transform: [{ rotate: spinInterp }, { scale: pulseAnim }] },
          ]}
        >
          <Text style={styles.icon}>{stylePack.icon}</Text>
        </Animated.View>

        <Text style={styles.title}>{t('generating.creatingYour', { styleName: stylePack.displayName })}</Text>
        <FadingMessage messages={FUN_MESSAGES} reduceMotion={reduceMotion} textStyle={styles.message} />

        <CircularProgress progress={progress} size={140} reduceMotion={reduceMotion} />
      </View>
    </SafeAreaView>
  );
}
