import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import Share from 'react-native-share';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, BatchResultItem, ExportOptions } from '../types';
import { getStylePack } from '../services/stylePacks';
import { useAppStore } from '../store/useAppStore';
import { trackEvent } from '../services/analytics';
import { spacing, borderRadius, typography } from '../styles/theme';
import { useTheme } from '../contexts/ThemeContext';
import { nanoid } from '../utils/id';
import { t } from '../i18n';
import { ExportSheet } from '../components/ExportSheet';
import { processExport } from '../services/imageExport';
import { useProStore } from '../store/useProStore';

type Nav = NativeStackNavigationProp<RootStackParamList, 'BatchResults'>;
type Route = RouteProp<RootStackParamList, 'BatchResults'>;

export default function BatchResultsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { results, params } = route.params;
  const stylePack = getStylePack(params.styleId);
  const { addToGallery, watermarkEnabled } = useAppStore();
  // All features unlocked — credits are the only gate
  const [showExportSheet, setShowExportSheet] = useState(false);

  const totalRequested = results.length;
  const hasPartialFailure = results.some((r) => !r.resultUrl);
  const successfulResults = results.filter((r) => r.resultUrl);

  const handleSaveAll = useCallback(() => {
    setShowExportSheet(true);
    trackEvent('export_sheet_opened', { context: 'batch_results' });
  }, []);

  const handleBatchExportConfirm = useCallback(async (options: ExportOptions) => {
    try {
      for (const result of successfulResults) {
        const processedUri = await processExport({
          sourceUri: result.resultUrl,
          resolution: options.resolution,
          format: options.format,
          quality: options.quality,
        });
        await addToGallery({
          id: nanoid(),
          localUri: processedUri,
          styleId: params.styleId,
          styleName: stylePack.displayName,
          createdAt: new Date().toISOString(),
          params,
        });
      }
      trackEvent('batch_export_completed', {
        count: successfulResults.length,
        resolution: options.resolution,
        format: options.format,
        watermark: options.includeWatermark,
      });
      trackEvent('batch_save_all', { count: successfulResults.length });
      Alert.alert(t('batchResults.saved'), t('batchResults.savedMessage', { count: String(successfulResults.length) }));
    } catch {
      Alert.alert(t('common.error'), t('batchResults.saveFailed'));
    }
  }, [successfulResults, params, stylePack, addToGallery]);

  const handleShareAll = useCallback(async () => {
    try {
      const urls = successfulResults.map((r) => r.resultUrl);
      await Share.open({
        urls,
        title: `My ${stylePack.displayName} Batch - Made in QuipPix`,
        message: `Check out my ${stylePack.displayName} batch made with QuipPix!`,
      });
      trackEvent('batch_share_all', { count: successfulResults.length });
    } catch {
      // User cancelled
    }
  }, [successfulResults, stylePack]);

  const handleTapResult = useCallback(
    (item: BatchResultItem) => {
      navigation.navigate('Result', {
        jobId: item.jobId,
        resultUrl: item.resultUrl,
        params: item.params,
      });
    },
    [navigation],
  );

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    headerLeft: {},
    title: {
      ...typography.h3,
      color: colors.textPrimary,
    },
    subtitle: {
      ...typography.caption,
      color: colors.textSecondary,
      marginTop: 2,
    },
    doneText: {
      ...typography.bodyBold,
      color: colors.primary,
    },
    failureBanner: {
      backgroundColor: '#FFA00020',
      marginHorizontal: spacing.md,
      padding: spacing.sm,
      borderRadius: borderRadius.md,
      marginBottom: spacing.sm,
    },
    failureText: {
      ...typography.caption,
      color: '#FFA000',
      textAlign: 'center',
    },
    grid: {
      padding: spacing.md,
    },
    gridRow: {
      gap: spacing.md,
      marginBottom: spacing.md,
    },
    resultCard: {
      flex: 1,
      aspectRatio: 1,
      borderRadius: borderRadius.lg,
      overflow: 'hidden',
      backgroundColor: colors.surface,
    },
    resultImage: {
      width: '100%',
      height: '100%',
    },
    actionBar: {
      flexDirection: 'row',
      padding: spacing.md,
      gap: spacing.md,
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.surfaceLight,
    },
    actionBtn: {
      flex: 1,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.lg,
      alignItems: 'center',
    },
    primaryAction: {
      backgroundColor: colors.primary,
    },
    secondaryAction: {
      backgroundColor: colors.surfaceLight,
      borderWidth: 1,
      borderColor: colors.primary + '40',
    },
    actionBtnText: {
      ...typography.bodyBold,
      color: colors.textPrimary,
    },
    secondaryActionText: {
      ...typography.bodyBold,
      color: colors.primary,
    },
  }), [colors]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>{stylePack.displayName}</Text>
          <Text style={styles.subtitle}>{t('batchResults.results', { count: String(successfulResults.length) })}</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.popToTop()}>
          <Text style={styles.doneText}>{t('batchResults.done')}</Text>
        </TouchableOpacity>
      </View>

      {/* Partial failure banner */}
      {hasPartialFailure && (
        <View style={styles.failureBanner}>
          <Text style={styles.failureText}>
            {t('batchResults.partialFailure')}
          </Text>
        </View>
      )}

      {/* Results grid */}
      <FlatList
        data={successfulResults}
        keyExtractor={(item) => item.jobId}
        numColumns={2}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.gridRow}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.resultCard}
            onPress={() => handleTapResult(item)}
            activeOpacity={0.8}
          >
            <FastImage source={{ uri: item.resultUrl, priority: FastImage.priority.normal }} style={styles.resultImage} resizeMode={FastImage.resizeMode.cover} />
          </TouchableOpacity>
        )}
      />

      {/* Action bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.primaryAction]}
          onPress={handleSaveAll}
          activeOpacity={0.8}
        >
          <Text style={styles.actionBtnText}>{t('batchResults.saveAll')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.secondaryAction]}
          onPress={handleShareAll}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryActionText}>{t('batchResults.shareAll')}</Text>
        </TouchableOpacity>
      </View>

      {/* Export Sheet */}
      <ExportSheet
        visible={showExportSheet}
        onClose={() => setShowExportSheet(false)}
        onExport={handleBatchExportConfirm}
        defaultWatermark={watermarkEnabled}
        isPro={true}
      />
    </SafeAreaView>
  );
}
