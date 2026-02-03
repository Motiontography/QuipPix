import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, RemixResponse } from '../types';
import { api } from '../api/client';
import { getStylePack } from '../services/stylePacks';
import { trackEvent } from '../services/analytics';
import { colors, spacing, borderRadius, typography } from '../styles/theme';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Remix'>;
type Route = RouteProp<RootStackParamList, 'Remix'>;

export default function RemixScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { code } = route.params;

  const [remix, setRemix] = useState<RemixResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getRemix(code);
        setRemix(data);
        trackEvent('remix_opened', { code, styleId: data.template.styleId });
      } catch {
        setError('This remix link is no longer available.');
      } finally {
        setLoading(false);
      }
    })();
  }, [code]);

  const handleChoosePhoto = useCallback(async () => {
    if (!remix) return;

    trackEvent('remix_photo_selected', { code, source: 'library' });

    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.9,
      maxWidth: 2048,
      maxHeight: 2048,
    });

    if (result.assets?.[0]?.uri) {
      navigation.replace('Customize', {
        imageUri: result.assets[0].uri,
        styleId: remix.template.styleId,
      });
    }
  }, [remix, code, navigation]);

  const handleTakePhoto = useCallback(async () => {
    if (!remix) return;

    trackEvent('remix_photo_selected', { code, source: 'camera' });

    const result = await launchCamera({
      mediaType: 'photo',
      quality: 0.9,
      maxWidth: 2048,
      maxHeight: 2048,
    });

    if (result.assets?.[0]?.uri) {
      navigation.replace('Customize', {
        imageUri: result.assets[0].uri,
        styleId: remix.template.styleId,
      });
    }
  }, [remix, code, navigation]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading remix...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !remix) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.errorIcon}>🔗</Text>
          <Text style={styles.errorTitle}>Link Expired</Text>
          <Text style={styles.errorMsg}>
            {error || 'This remix link is no longer available.'}
          </Text>
          <TouchableOpacity
            style={styles.homeBtn}
            onPress={() => navigation.navigate('MainTabs')}
          >
            <Text style={styles.homeBtnText}>Go to Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const stylePack = getStylePack(remix.template.styleId);
  const { sliders, toggles } = remix.template;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.navigate('MainTabs')}>
            <Text style={styles.backText}>{'<'} Home</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Remix</Text>
          <View style={{ width: 48 }} />
        </View>

        {/* Style Card */}
        <View style={styles.styleCard}>
          <View style={[styles.stylePreview, { backgroundColor: stylePack.previewColor }]}>
            <Text style={styles.styleIcon}>{stylePack.icon}</Text>
          </View>
          <Text style={styles.styleName}>{stylePack.displayName}</Text>
          <Text style={styles.styleDesc}>{stylePack.description}</Text>
          {remix.template.creatorName && (
            <Text style={styles.creator}>
              Shared by {remix.template.creatorName}
            </Text>
          )}
        </View>

        {/* Settings Preview */}
        <View style={styles.settingsCard}>
          <Text style={styles.settingsTitle}>Pre-loaded Settings</Text>
          <View style={styles.settingsGrid}>
            <SettingPill label="Intensity" value={sliders.intensity} />
            <SettingPill label="Face Fidelity" value={sliders.faceFidelity} />
            <SettingPill label="Background" value={sliders.backgroundStrength} />
            <SettingPill label="Detail" value={sliders.detail} />
            <SettingPill label="Color" value={sliders.colorMood} />
            <SettingPill
              label="Identity"
              value={toggles.keepIdentity ? 'On' : 'Off'}
            />
          </View>
          {remix.views > 1 && (
            <Text style={styles.viewCount}>
              {remix.views} {remix.views === 1 ? 'person has' : 'people have'} tried this remix
            </Text>
          )}
        </View>

        {/* Spacer */}
        <View style={{ flex: 1 }} />

        {/* Action Buttons */}
        <View style={styles.actionArea}>
          <Text style={styles.ctaText}>
            Choose a photo to try this style!
          </Text>
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.primaryBtn]}
              onPress={handleChoosePhoto}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryBtnText}>Choose Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.secondaryBtn]}
              onPress={handleTakePhoto}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryBtnText}>Take Photo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

function SettingPill({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillLabel}>{label}</Text>
      <Text style={styles.pillValue}>
        {typeof value === 'number' ? value : value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  errorIcon: { fontSize: 48, marginBottom: spacing.md },
  errorTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  errorMsg: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  homeBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  homeBtnText: { ...typography.bodyBold, color: colors.textPrimary },
  content: { flex: 1, paddingHorizontal: spacing.md },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  backText: { ...typography.body, color: colors.primary },
  title: { ...typography.h3, color: colors.textPrimary },

  // Style Card
  styleCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  stylePreview: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  styleIcon: { fontSize: 40 },
  styleName: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  styleDesc: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  creator: {
    ...typography.caption,
    color: colors.primaryLight,
    marginTop: spacing.sm,
  },

  // Settings Preview
  settingsCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  settingsTitle: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  settingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  pill: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pillLabel: { ...typography.small, color: colors.textMuted },
  pillValue: { ...typography.small, color: colors.primaryLight, fontWeight: '600' },
  viewCount: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },

  // Actions
  actionArea: {
    paddingBottom: spacing.lg,
  },
  ctaText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  primaryBtn: {
    backgroundColor: colors.primary,
  },
  primaryBtnText: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  secondaryBtn: {
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.primary + '40',
  },
  secondaryBtnText: {
    ...typography.bodyBold,
    color: colors.primary,
  },
});
