import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import Share from 'react-native-share';
import ViewShot from 'react-native-view-shot';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, ExportOptions } from '../types';
import { getStylePack } from '../services/stylePacks';
import { useAppStore } from '../store/useAppStore';
import { useProStore } from '../store/useProStore';
import { trackEvent } from '../services/analytics';
import { useChallengeStore } from '../store/useChallengeStore';
import { api } from '../api/client';
import { spacing, borderRadius, typography } from '../styles/theme';
import { useTheme } from '../contexts/ThemeContext';
import { nanoid } from '../utils/id';
import BeforeAfterSlider from '../components/BeforeAfterSlider';
import ZoomableImage, { ZoomableImageHandle } from '../components/ZoomableImage';
import { saveToPhotoLibrary } from '../services/cameraRoll';
import { cacheImage } from '../services/imageCache';
import { maybePromptReview } from '../services/reviewPrompt';
import { triggerHaptic } from '../services/haptics';
import { t } from '../i18n';
import { useReducedMotion } from '../hooks/useReducedMotion';
import CoachMark from '../components/CoachMark';
import { COACH_MARKS } from '../constants/coachMarks';
import { ExportSheet } from '../components/ExportSheet';
import { ComparisonCarousel } from '../components/ComparisonCarousel';
import { FeedbackButtons } from '../components/FeedbackButtons';
import { processExport } from '../services/imageExport';
import { copyImageToClipboard } from '../services/clipboard';
import { cropToStories } from '../services/storiesFormat';
import { QuickShareBar } from '../components/QuickShareBar';
import { ShareTip } from '../components/ShareTip';
import { ShareHistorySheet } from '../components/ShareHistorySheet';
import { PoweredByMotiontography } from '../components/PoweredByMotiontography';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Result'>;
type Route = RouteProp<RootStackParamList, 'Result'>;

export default function ResultScreen() {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { jobId, resultUrl, params, sourceImageUri } = route.params;
  const stylePack = getStylePack(params.styleId);
  const viewShotRef = useRef<ViewShot>(null);
  const zoomRef = useRef<ZoomableImageHandle>(null);
  const imageCoachRef = useRef<View>(null);
  const [showInterstitial, setShowInterstitial] = useState(false);
  const [showPlatformPicker, setShowPlatformPicker] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [showExportSheet, setShowExportSheet] = useState(false);
  const saveModeRef = useRef<'gallery' | 'photos'>('gallery');
  const [storiesMode, setStoriesMode] = useState(false);
  const [historyVisible, setHistoryVisible] = useState(false);

  const {
    addToGallery,
    incrementCreationCount,
    hasShownInterstitial,
    setInterstitialShown,
    watermarkEnabled,
  } = useAppStore();

  const hasDuplicate = useAppStore((s) => s.hasDuplicate);
  const addShareRecord = useAppStore((s) => s.addShareRecord);

  const shouldShowSoftUpsell = useProStore((s) => s.shouldShowSoftUpsell);
  const dismissSoftUpsell = useProStore((s) => s.dismissSoftUpsell);
  const entitlement = useProStore((s) => s.entitlement);
  const currentStreak = useChallengeStore((s) => s.currentStreak);

  // Track comparison carousel viewed when sourceImageUri is available
  useEffect(() => {
    if (sourceImageUri) {
      trackEvent('comparison_carousel_viewed', { alternativeCount: 1 });
    }
  }, [sourceImageUri]);

  // Capture ViewShot with watermark rendered into the image
  const captureWithWatermark = useCallback(async (): Promise<string> => {
    zoomRef.current?.resetZoom();
    if (!viewShotRef.current?.capture) {
      return resultUrl;
    }
    try {
      const uri = await viewShotRef.current.capture({
        format: 'png',
        quality: 1,
      });
      return uri;
    } catch {
      return resultUrl;
    }
  }, [resultUrl]);

  // Open the export sheet for gallery save
  const handleSave = useCallback(() => {
    triggerHaptic('light');

    // Check for duplicates
    if (sourceImageUri && hasDuplicate(sourceImageUri, params.styleId)) {
      trackEvent('duplicate_detected', { styleId: params.styleId });
      Alert.alert(
        t('gallery.duplicateTitle'),
        t('gallery.duplicateMessage', { style: stylePack.displayName }),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('gallery.duplicateContinue'),
            onPress: () => {
              trackEvent('duplicate_continued', { styleId: params.styleId });
              saveModeRef.current = 'gallery';
              setShowExportSheet(true);
              trackEvent('export_sheet_opened', { context: 'result' });
            },
          },
        ],
      );
      return;
    }

    saveModeRef.current = 'gallery';
    setShowExportSheet(true);
    trackEvent('export_sheet_opened', { context: 'result' });
  }, [sourceImageUri, hasDuplicate, params.styleId, stylePack.displayName]);

  // Open the export sheet for photos save
  const handleSaveToPhotos = useCallback(() => {
    saveModeRef.current = 'photos';
    setShowExportSheet(true);
    trackEvent('export_sheet_opened', { context: 'result' });
  }, []);

  // Handle confirmed export from ExportSheet
  const handleExportConfirm = useCallback(async (options: ExportOptions) => {
    try {
      const processedUri = await processExport({
        sourceUri: resultUrl,
        resolution: options.resolution,
        format: options.format,
        quality: options.quality,
      });

      trackEvent('export_completed', {
        resolution: options.resolution,
        format: options.format,
        watermark: options.includeWatermark,
      });

      if (saveModeRef.current === 'photos') {
        const exportUri = options.includeWatermark ? await captureWithWatermark() : processedUri;
        await saveToPhotoLibrary(exportUri);
        trackEvent('save_to_photos', { styleId: params.styleId });
        Alert.alert(t('result.saved'), t('result.savedToPhotos'));
      } else {
        const itemId = nanoid();
        let localUri = processedUri;
        try {
          const sourceUri = options.includeWatermark ? await captureWithWatermark() : processedUri;
          localUri = await cacheImage(sourceUri, itemId);
        } catch {
          // Fall back to processed URI if caching fails
        }
        const item = {
          id: itemId,
          localUri,
          resultUrl,
          sourceImageUri,
          styleId: params.styleId,
          styleName: stylePack.displayName,
          createdAt: new Date().toISOString(),
          params,
        };
        await addToGallery(item);
        incrementCreationCount();
        const count = useAppStore.getState().creationCount;
        maybePromptReview(count).catch(() => {});

        // Check soft upsell before Motiontography interstitial
        if (shouldShowSoftUpsell()) {
          dismissSoftUpsell();
          navigation.navigate('Paywall', { trigger: 'soft_upsell' });
          return;
        }

        // Show gentle interstitial (max 1/session)
        if (!hasShownInterstitial) {
          setShowInterstitial(true);
          setInterstitialShown();
        }

        Alert.alert(t('result.saved'), t('result.savedMessage'));
      }
    } catch (err) {
      Alert.alert(t('common.error'), t('result.saveFailed'));
    }
  }, [resultUrl, sourceImageUri, params, stylePack, addToGallery, incrementCreationCount, hasShownInterstitial, setInterstitialShown, shouldShowSoftUpsell, dismissSoftUpsell, navigation, captureWithWatermark]);

  // Share
  const handleShare = useCallback(async () => {
    try {
      const shareUri = watermarkEnabled ? await captureWithWatermark() : resultUrl;
      await Share.open({
        url: shareUri,
        title: `My ${stylePack.displayName} - Made in QuipPix`,
        message: `Check out my ${stylePack.displayName} made with QuipPix!`,
      });
      addShareRecord(jobId, 'general');
    } catch {
      // User cancelled
    }
  }, [resultUrl, stylePack, watermarkEnabled, captureWithWatermark, jobId, addShareRecord]);

  // Copy to clipboard
  const handleCopy = useCallback(async () => {
    triggerHaptic('light');
    await copyImageToClipboard(resultUrl);
    trackEvent('image_copied_clipboard');
  }, [resultUrl]);

  // Stories format
  const handleStoriesFormat = useCallback(async () => {
    triggerHaptic('light');
    try {
      const storiesUri = await cropToStories(resultUrl);
      trackEvent('stories_format_used');
      await Share.open({
        url: storiesUri,
        title: `My ${stylePack.displayName} - Stories`,
      });
      addShareRecord(jobId, 'stories');
    } catch {
      // User cancelled
    }
  }, [resultUrl, stylePack, jobId, addShareRecord]);

  // Post to social
  const handlePost = useCallback(() => {
    trackEvent('share_clicked');
    setShowPlatformPicker(true);
  }, []);

  // Navigate to share card builder
  const handleShareCard = useCallback(() => {
    navigation.navigate('ShareCard', {
      localUri: resultUrl,
      styleName: stylePack.displayName,
      styleId: params.styleId,
      currentStreak,
    });
  }, [resultUrl, stylePack, params.styleId, currentStreak, navigation]);

  // Share as template (remix deep link via short code)
  const handleShareTemplate = useCallback(async () => {
    try {
      const { url } = await api.createRemix({
        styleId: params.styleId,
        sliders: params.sliders,
        toggles: params.toggles,
        styleOptions: params.styleOptions,
      });

      trackEvent('remix_created', { styleId: params.styleId });

      await Share.open({
        title: 'Try this QuipPix style!',
        message: `Try my ${stylePack.displayName} style in QuipPix! ${url}`,
      });
    } catch {
      // User cancelled or API error
    }
  }, [params, stylePack]);

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    backText: { ...typography.bodyBold, color: colors.primary },
    title: { ...typography.h3, color: colors.textPrimary },
    imageContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.md,
    },
    viewShot: {
      width: '100%',
      aspectRatio: 1,
      borderRadius: borderRadius.lg,
      overflow: 'hidden',
      backgroundColor: colors.surface,
    },
    resultImage: {
      width: '100%',
      height: '100%',
    },
    watermark: {
      position: 'absolute',
      bottom: spacing.sm,
      right: spacing.sm,
      ...typography.small,
      color: 'rgba(255,255,255,0.4)',
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
    },
    actionBtn: {
      alignItems: 'center',
      padding: spacing.sm,
      borderRadius: borderRadius.md,
      minWidth: 60,
    },
    actionBtnPrimary: {
      backgroundColor: colors.primary + '20',
    },
    actionIcon: { fontSize: 24, marginBottom: 4 },
    actionLabel: { ...typography.small, color: colors.textSecondary },
    actionLabelPrimary: { color: colors.primary },
    footer: {
      alignItems: 'center',
      paddingBottom: spacing.md,
    },
    footerText: { ...typography.small, color: colors.textMuted },

    // Interstitial
    interstitial: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.xl,
    },
    interstitialTitle: {
      ...typography.h2,
      color: colors.textPrimary,
      marginBottom: spacing.md,
    },
    interstitialBody: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: spacing.lg,
    },
    interstitialCta: {
      backgroundColor: colors.primary,
      borderRadius: borderRadius.lg,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
      marginBottom: spacing.md,
    },
    interstitialCtaText: { ...typography.bodyBold, color: colors.textPrimary },
    skipBtn: { padding: spacing.md },
    skipText: { ...typography.body, color: colors.textMuted },
  }), [colors]);

  // Gentle interstitial overlay
  if (showInterstitial) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.interstitial}>
          <Text style={styles.interstitialTitle}>{t('result.loveCreation')}</Text>
          <Text style={styles.interstitialBody}>
            {t('result.motiontographyPromo')}
          </Text>
          <TouchableOpacity
            style={styles.interstitialCta}
            onPress={() => Linking.openURL('https://motiontography.com')}
          >
            <Text style={styles.interstitialCtaText}>{t('result.visitMotiontography')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.skipBtn}
            onPress={() => setShowInterstitial(false)}
          >
            <Text style={styles.skipText}>{t('result.skip')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Import PlatformPicker dynamically to avoid circular deps
  const PlatformPicker = require('../components/PlatformPicker').default;

  const ActionButton = ({
    icon,
    label,
    onPress,
    primary,
  }: {
    icon: string;
    label: string;
    onPress: () => void;
    primary?: boolean;
  }) => (
    <TouchableOpacity
      style={[styles.actionBtn, primary && styles.actionBtnPrimary]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityLabel={label}
      accessibilityRole="button"
    >
      <Text style={styles.actionIcon}>{icon}</Text>
      <Text style={[styles.actionLabel, primary && styles.actionLabelPrimary]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.popToTop()}>
          <Text style={styles.backText}>{t('result.done')}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{stylePack.displayName}</Text>
        <View style={{ width: 48 }} />
      </View>

      {/* Result image / Comparison */}
      <View style={styles.imageContainer} ref={imageCoachRef}>
        <ViewShot ref={viewShotRef} style={styles.viewShot}>
          {showComparison && sourceImageUri ? (
            <BeforeAfterSlider
              originalUri={sourceImageUri}
              resultUri={resultUrl}
            />
          ) : (
            <ZoomableImage
              ref={zoomRef}
              uri={resultUrl}
              style={styles.resultImage}
              reduceMotion={reduceMotion}
              accessibilityLabel={`Generated ${stylePack.displayName} art`}
            >
              {watermarkEnabled && (
                <Text style={styles.watermark}>QuipPix by Motiontography</Text>
              )}
            </ZoomableImage>
          )}
        </ViewShot>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <ActionButton icon="💾" label={t('result.save')} onPress={handleSave} primary />
        <ActionButton icon="📷" label={t('result.photos')} onPress={handleSaveToPhotos} />
        {sourceImageUri && (
          <ActionButton
            icon={showComparison ? '🖼️' : '🔄'}
            label={showComparison ? t('result.resultView') : t('result.compare')}
            onPress={() => setShowComparison(!showComparison)}
          />
        )}
        <ActionButton icon="🎴" label={t('result.card')} onPress={handleShareCard} />
        <ActionButton icon="📤" label={t('result.share')} onPress={handleShare} />
        <ActionButton icon="📋" label={t('share.copyToClipboard')} onPress={handleCopy} />
        <ActionButton icon="📱" label={t('share.storiesFormat')} onPress={handleStoriesFormat} />
        <ActionButton icon="📱" label={t('result.post')} onPress={handlePost} />
        <ActionButton icon="🔗" label={t('result.remix')} onPress={handleShareTemplate} />
      </View>

      <FeedbackButtons itemId={jobId} />

      <QuickShareBar onSelectPlatform={(platform) => {
        addShareRecord(jobId, platform);
        setShowPlatformPicker(true);
      }} />

      {/* Comparison Carousel */}
      <ComparisonCarousel
        currentItemId={jobId}
        sourceImageUri={sourceImageUri}
        onSelectItem={(item) => {
          trackEvent('comparison_carousel_tapped', {
            fromStyleId: params.styleId,
            toStyleId: item.styleId,
          });
          navigation.push('Result', {
            jobId: item.id,
            resultUrl: item.localUri,
            params: item.params,
            sourceImageUri: item.sourceImageUri,
          });
        }}
      />

      {/* Platform Picker */}
      <PlatformPicker
        visible={showPlatformPicker}
        imageUri={resultUrl}
        styleName={stylePack.displayName}
        onClose={() => setShowPlatformPicker(false)}
      />

      {/* Export Sheet */}
      <ExportSheet
        visible={showExportSheet}
        onClose={() => setShowExportSheet(false)}
        onExport={handleExportConfirm}
        defaultWatermark={watermarkEnabled}
        isPro={entitlement.proActive}
      />

      <ShareHistorySheet visible={historyVisible} onClose={() => setHistoryVisible(false)} />

      {/* Footer */}
      <View style={styles.footer}>
        <PoweredByMotiontography variant="inline" />
      </View>

      <CoachMark
        markId={COACH_MARKS.RESULT_ZOOM.id}
        title={t(COACH_MARKS.RESULT_ZOOM.titleKey)}
        description={t(COACH_MARKS.RESULT_ZOOM.descKey)}
        targetRef={imageCoachRef}
        position="below"
      />
    </SafeAreaView>
  );
}
