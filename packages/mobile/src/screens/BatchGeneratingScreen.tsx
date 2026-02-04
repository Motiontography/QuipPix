import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Image,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, BatchResultItem, BatchStatusResponse } from '../types';
import { api, ApiError } from '../api/client';
import { getStylePack } from '../services/stylePacks';
import { trackEvent } from '../services/analytics';
import { spacing, typography, borderRadius } from '../styles/theme';
import { useTheme } from '../contexts/ThemeContext';
import { t } from '../i18n';
import { CircularProgress } from '../components/CircularProgress';
import { FadingMessage } from '../components/FadingMessage';
import { useReducedMotion } from '../hooks/useReducedMotion';

type Nav = NativeStackNavigationProp<RootStackParamList, 'BatchGenerating'>;
type Route = RouteProp<RootStackParamList, 'BatchGenerating'>;

const FUN_MESSAGES = [
  'Mixing the perfect colors...',
  'Teaching the AI about style...',
  'Rendering your masterpieces...',
  'Adding the finishing touches...',
  'Almost there, looking great...',
  'Polishing every pixel...',
  'Batch mode activated...',
  'Creating art at scale...',
];

export default function BatchGeneratingScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { imageUris, params } = route.params;
  const stylePack = getStylePack(params.styleId);
  const reduceMotion = useReducedMotion();

  const [overallProgress, setOverallProgress] = useState(0);
  const [jobProgresses, setJobProgresses] = useState<number[]>(
    new Array(imageUris.length).fill(0),
  );
  const [error, setError] = useState<string | null>(null);

  // Submit batch and poll
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        trackEvent('batch_started', {
          imageCount: imageUris.length,
          styleId: params.styleId,
        });

        const { batchId } = await api.batchGenerate(imageUris, params);

        const finalStatus = await api.pollBatchUntilDone(
          batchId,
          (status: BatchStatusResponse) => {
            if (cancelled) return;
            setOverallProgress(status.overallProgress);
            setJobProgresses(status.jobs.map((j) => j.progress));
          },
          2500,
          300_000,
        );

        if (cancelled) return;

        // Collect successful results
        const results: BatchResultItem[] = finalStatus.jobs
          .filter((j) => j.status === 'done' && j.resultUrl)
          .map((j) => ({
            jobId: j.jobId,
            resultUrl: j.resultUrl!,
            params,
          }));

        if (finalStatus.status === 'partial_failure') {
          trackEvent('batch_partial_failure', {
            total: finalStatus.totalJobs,
            completed: finalStatus.completedJobs,
            failed: finalStatus.failedJobs,
          });
        } else {
          trackEvent('batch_completed', {
            imageCount: results.length,
            styleId: params.styleId,
          });
        }

        if (results.length > 0) {
          navigation.replace('BatchResults', { results, params });
        } else {
          setError(t('batchGenerating.allFailed'));
        }
      } catch (err: any) {
        if (!cancelled) {
          if (err instanceof ApiError && err.body?.message) {
            setError(err.body.message);
          } else {
            setError(err.message || t('generating.somethingWrong'));
          }
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [imageUris, params, navigation]);

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing.xl,
    },
    header: {
      alignItems: 'center',
      paddingVertical: spacing.lg,
    },
    title: {
      ...typography.h2,
      color: colors.textPrimary,
      textAlign: 'center',
    },
    subtitle: {
      ...typography.body,
      color: colors.textSecondary,
      marginTop: spacing.xs,
    },
    grid: {
      padding: spacing.md,
    },
    gridRow: {
      gap: spacing.md,
      marginBottom: spacing.md,
    },
    thumbContainer: {
      flex: 1,
      aspectRatio: 1,
      borderRadius: borderRadius.lg,
      overflow: 'hidden',
      backgroundColor: colors.surface,
    },
    thumb: {
      width: '100%',
      height: '100%',
    },
    progressOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    circleOuter: {
      width: 56,
      height: 56,
      borderRadius: 28,
      borderWidth: 3,
      borderColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    circleText: {
      ...typography.bodyBold,
      color: '#FFFFFF',
      fontSize: 14,
    },
    doneOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.3)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    doneCheck: {
      ...typography.bodyBold,
      color: '#4CAF50',
      fontSize: 16,
    },
    footer: {
      padding: spacing.lg,
      alignItems: 'center',
    },
    message: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: spacing.md,
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
    backBtn: {
      padding: spacing.md,
    },
    backBtnText: {
      ...typography.bodyBold,
      color: colors.primary,
    },
  }), [colors]);

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.errorIcon}>!</Text>
          <Text style={styles.errorTitle}>{t('batchGenerating.batchFailed')}</Text>
          <Text style={styles.errorMsg}>{error}</Text>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backBtnText}>{t('batchGenerating.goBack')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {t('batchGenerating.processing', { count: String(imageUris.length) })}
        </Text>
        <Text style={styles.subtitle}>{stylePack.displayName}</Text>
      </View>

      {/* 2-column grid of thumbnails with progress overlays */}
      <FlatList
        data={imageUris}
        keyExtractor={(_, i) => `batch-thumb-${i}`}
        numColumns={2}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.gridRow}
        renderItem={({ item, index }) => {
          const progress = jobProgresses[index] ?? 0;
          const isDone = progress >= 100;
          return (
            <View style={styles.thumbContainer}>
              <Image source={{ uri: item }} style={styles.thumb} />
              {!isDone && (
                <View style={styles.progressOverlay}>
                  <View style={styles.circleOuter}>
                    <Text style={styles.circleText}>{progress}%</Text>
                  </View>
                </View>
              )}
              {isDone && (
                <View style={styles.doneOverlay}>
                  <Text style={styles.doneCheck}>{t('batchResults.done')}</Text>
                </View>
              )}
            </View>
          );
        }}
      />

      {/* Overall progress */}
      <View style={styles.footer}>
        <FadingMessage messages={FUN_MESSAGES} reduceMotion={reduceMotion} textStyle={styles.message} />
        <CircularProgress progress={overallProgress} size={80} reduceMotion={reduceMotion} />
      </View>
    </SafeAreaView>
  );
}
