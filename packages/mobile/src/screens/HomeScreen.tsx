import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  Linking,
} from 'react-native';
import { t } from '../i18n';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { usePaywallGuard } from '../hooks/usePaywallGuard';
import ProBadge from '../components/ProBadge';
import OfflineBanner from '../components/OfflineBanner';
import { spacing, borderRadius, typography } from '../styles/theme';
import { useTheme } from '../contexts/ThemeContext';

type Nav = NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { isPro, guardBatch } = usePaywallGuard();
  const { colors } = useTheme();

  const pickBatchImages = useCallback(async () => {
    if (!guardBatch()) return;

    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.9,
      maxWidth: 2048,
      maxHeight: 2048,
      selectionLimit: 10,
    });

    const uris = result.assets?.map((a) => a.uri).filter(Boolean) as string[] | undefined;
    if (!uris || uris.length === 0) return;

    if (uris.length === 1) {
      // Single image — use normal flow
      navigation.navigate('StyleSelect', { imageUri: uris[0] });
    } else {
      // Multiple images — pass through as batch
      navigation.navigate('StyleSelect', { imageUri: uris[0], imageUris: uris });
    }
  }, [navigation, guardBatch]);

  const pickImage = useCallback(
    async (source: 'library' | 'camera') => {
      const launcher = source === 'library' ? launchImageLibrary : launchCamera;
      const result = await launcher({
        mediaType: 'photo',
        quality: 0.9,
        maxWidth: 2048,
        maxHeight: 2048,
      });

      if (result.assets?.[0]?.uri) {
        navigation.navigate('StyleSelect', { imageUri: result.assets[0].uri });
      }
    },
    [navigation],
  );

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing.xl,
    },
    logo: {
      ...typography.h1,
      fontSize: 48,
      color: colors.primary,
      marginBottom: spacing.sm,
    },
    tagline: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    actions: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xl,
      gap: spacing.md,
    },
    button: {
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      alignItems: 'center',
    },
    primaryButton: {
      backgroundColor: colors.primary,
    },
    secondaryButton: {
      backgroundColor: colors.surfaceLight,
      borderWidth: 1,
      borderColor: colors.primary + '40',
    },
    batchButton: {
      backgroundColor: colors.surfaceLight,
      borderWidth: 1,
      borderColor: '#6C5CE740',
    },
    batchHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    buttonIcon: {
      fontSize: 32,
      marginBottom: spacing.xs,
    },
    buttonText: {
      ...typography.h3,
      color: colors.textPrimary,
    },
    buttonSub: {
      ...typography.caption,
      color: colors.textSecondary,
      marginTop: 2,
    },
    footer: {
      alignItems: 'center',
      paddingBottom: spacing.md,
    },
    footerLink: {
      ...typography.small,
      color: colors.textMuted,
    },
  }), [colors]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <OfflineBanner />

      <View style={styles.header}>
        <Text style={styles.logo} accessibilityRole="header">{t('home.title')}</Text>
        <Text style={styles.tagline}>{t('home.tagline')}</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={() => pickImage('library')}
          activeOpacity={0.8}
          accessibilityLabel="Choose Photo"
          accessibilityHint="Opens your photo library to select an image"
          accessibilityRole="button"
        >
          <Text style={styles.buttonIcon}>🖼️</Text>
          <Text style={styles.buttonText}>{t('home.choosePhoto')}</Text>
          <Text style={styles.buttonSub}>{t('home.choosePhotoDesc')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={() => pickImage('camera')}
          activeOpacity={0.8}
          accessibilityLabel="Take Photo"
          accessibilityHint="Opens your camera to take a new photo"
          accessibilityRole="button"
        >
          <Text style={styles.buttonIcon}>📷</Text>
          <Text style={styles.buttonText}>{t('home.takePhoto')}</Text>
          <Text style={styles.buttonSub}>{t('home.takePhotoDesc')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.batchButton]}
          onPress={pickBatchImages}
          activeOpacity={0.8}
          accessibilityLabel={`Batch Process${!isPro ? ', requires Pro' : ''}`}
          accessibilityHint="Select multiple photos to process at once"
          accessibilityRole="button"
        >
          <View style={styles.batchHeader}>
            <Text style={styles.buttonIcon}>🖼️</Text>
            {!isPro && <ProBadge size="small" />}
          </View>
          <Text style={styles.buttonText}>{t('home.batchProcess')}</Text>
          <Text style={styles.buttonSub}>{t('home.batchProcessDesc')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          onPress={() => Linking.openURL('https://motiontography.com')}
          activeOpacity={0.7}
        >
          <Text style={styles.footerLink}>{t('home.byMotiontography')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
