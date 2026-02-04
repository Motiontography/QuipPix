import React, { useCallback, useRef, useState } from 'react';
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
import { RootStackParamList } from '../types';
import { getStylePack } from '../services/stylePacks';
import { useAppStore } from '../store/useAppStore';
import { useProStore } from '../store/useProStore';
import { trackEvent } from '../services/analytics';
import { useChallengeStore } from '../store/useChallengeStore';
import { api } from '../api/client';
import { colors, spacing, borderRadius, typography } from '../styles/theme';
import { nanoid } from '../utils/id';
import BeforeAfterSlider from '../components/BeforeAfterSlider';
import { saveToPhotoLibrary } from '../services/cameraRoll';
import { cacheImage } from '../services/imageCache';
import { maybePromptReview } from '../services/reviewPrompt';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Result'>;
type Route = RouteProp<RootStackParamList, 'Result'>;

export default function ResultScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { jobId, resultUrl, params, sourceImageUri } = route.params;
  const stylePack = getStylePack(params.styleId);
  const viewShotRef = useRef<ViewShot>(null);
  const [showInterstitial, setShowInterstitial] = useState(false);
  const [showPlatformPicker, setShowPlatformPicker] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  const {
    addToGallery,
    incrementCreationCount,
    hasShownInterstitial,
    setInterstitialShown,
    watermarkEnabled,
  } = useAppStore();

  const shouldShowSoftUpsell = useProStore((s) => s.shouldShowSoftUpsell);
  const dismissSoftUpsell = useProStore((s) => s.dismissSoftUpsell);
  const currentStreak = useChallengeStore((s) => s.currentStreak);

  // Save to local gallery
  const handleSave = useCallback(async () => {
    try {
      const itemId = nanoid();
      let localUri = resultUrl;
      try {
        localUri = await cacheImage(resultUrl, itemId);
      } catch {
        // Fall back to remote URL if caching fails
      }
      const item = {
        id: itemId,
        localUri,
        resultUrl,
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

      Alert.alert('Saved!', 'Added to your QuipPix gallery.');
    } catch (err) {
      Alert.alert('Error', 'Failed to save image.');
    }
  }, [resultUrl, params, stylePack, addToGallery, incrementCreationCount, hasShownInterstitial, setInterstitialShown, shouldShowSoftUpsell, dismissSoftUpsell, navigation]);

  // Save to device photo library
  const handleSaveToPhotos = useCallback(async () => {
    try {
      await saveToPhotoLibrary(resultUrl);
      trackEvent('save_to_photos', { styleId: params.styleId });
      Alert.alert('Saved!', 'Image saved to your photo library.');
    } catch (err) {
      Alert.alert('Error', 'Failed to save to photos. Please check permissions.');
    }
  }, [resultUrl, params.styleId]);

  // Share
  const handleShare = useCallback(async () => {
    try {
      await Share.open({
        url: resultUrl,
        title: `My ${stylePack.displayName} - Made in QuipPix`,
        message: `Check out my ${stylePack.displayName} made with QuipPix!`,
      });
    } catch {
      // User cancelled
    }
  }, [resultUrl, stylePack]);

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

  // Gentle interstitial overlay
  if (showInterstitial) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.interstitial}>
          <Text style={styles.interstitialTitle}>Love your creation?</Text>
          <Text style={styles.interstitialBody}>
            QuipPix is brought to you by Motiontography.
            Check out our professional photography and video work!
          </Text>
          <TouchableOpacity
            style={styles.interstitialCta}
            onPress={() => Linking.openURL('https://motiontography.com')}
          >
            <Text style={styles.interstitialCtaText}>Visit Motiontography</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.skipBtn}
            onPress={() => setShowInterstitial(false)}
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Import PlatformPicker dynamically to avoid circular deps
  const PlatformPicker = require('../components/PlatformPicker').default;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.popToTop()}>
          <Text style={styles.backText}>Done</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{stylePack.displayName}</Text>
        <View style={{ width: 48 }} />
      </View>

      {/* Result image / Comparison */}
      <View style={styles.imageContainer}>
        <ViewShot ref={viewShotRef} style={styles.viewShot}>
          {showComparison && sourceImageUri ? (
            <BeforeAfterSlider
              originalUri={sourceImageUri}
              resultUri={resultUrl}
            />
          ) : (
            <>
              <Image source={{ uri: resultUrl }} style={styles.resultImage} resizeMode="contain" accessibilityLabel={`Generated ${stylePack.displayName} art`} accessibilityRole="image" />
              {watermarkEnabled && (
                <Text style={styles.watermark}>Made in QuipPix</Text>
              )}
            </>
          )}
        </ViewShot>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <ActionButton icon="💾" label="Save" onPress={handleSave} primary />
        <ActionButton icon="📷" label="Photos" onPress={handleSaveToPhotos} />
        {sourceImageUri && (
          <ActionButton
            icon={showComparison ? '🖼️' : '🔄'}
            label={showComparison ? 'Result' : 'Compare'}
            onPress={() => setShowComparison(!showComparison)}
          />
        )}
        <ActionButton icon="🎴" label="Card" onPress={handleShareCard} />
        <ActionButton icon="📤" label="Share" onPress={handleShare} />
        <ActionButton icon="📱" label="Post" onPress={handlePost} />
        <ActionButton icon="🔗" label="Remix" onPress={handleShareTemplate} />
      </View>

      {/* Platform Picker */}
      <PlatformPicker
        visible={showPlatformPicker}
        imageUri={resultUrl}
        styleName={stylePack.displayName}
        onClose={() => setShowPlatformPicker(false)}
      />

      {/* Footer */}
      <TouchableOpacity
        style={styles.footer}
        onPress={() => Linking.openURL('https://motiontography.com')}
      >
        <Text style={styles.footerText}>motiontography.com</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function ActionButton({
  icon,
  label,
  onPress,
  primary,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  primary?: boolean;
}) {
  return (
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
}

const styles = StyleSheet.create({
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
});
