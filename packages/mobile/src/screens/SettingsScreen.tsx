import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Switch,
  Linking,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useAppStore } from '../store/useAppStore';
import { useProStore } from '../store/useProStore';
import { restorePurchases } from '../services/purchases';
import {
  isNotificationsEnabled,
  setNotificationsEnabled,
  requestNotificationPermission,
} from '../services/pushNotifications';
import { getAppVersion, getBuildNumber } from '../services/appInfo';
import { api } from '../api/client';
import { clearAuth } from '../services/auth';
import { triggerHaptic } from '../services/haptics';
import { trackEvent } from '../services/analytics';
import { getCacheInfo, clearCache, CacheInfo } from '../services/cacheManager';
import { isBiometricAvailable } from '../services/biometric';
import { exportAndShareData } from '../services/dataExport';
import { spacing, borderRadius, typography } from '../styles/theme';
import { useTheme, ThemeMode } from '../contexts/ThemeContext';
import { t } from '../i18n';
import { UpdateBanner } from '../components/UpdateBanner';


type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function SettingsScreen() {
  const { colors, themeMode } = useTheme();
  const navigation = useNavigation<Nav>();
  const { watermarkEnabled, setWatermarkEnabled, clearGallery } = useAppStore();
  const setThemeMode = useAppStore((s) => s.setThemeMode);
  const reduceMotionOverride = useAppStore((s) => s.reduceMotionOverride);
  const setReduceMotionOverride = useAppStore((s) => s.setReduceMotionOverride);
  const highContrastEnabled = useAppStore((s) => s.highContrastEnabled);
  const setHighContrastEnabled = useAppStore((s) => s.setHighContrastEnabled);
  const fontScalingEnabled = useAppStore((s) => s.fontScalingEnabled);
  const setFontScalingEnabled = useAppStore((s) => s.setFontScalingEnabled);
  const biometricLockEnabled = useAppStore((s) => s.biometricLockEnabled);
  const setBiometricLockEnabled = useAppStore((s) => s.setBiometricLockEnabled);
  const [isDeleting, setIsDeleting] = useState(false);
  const [cacheInfo, setCacheInfo] = useState<CacheInfo | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  const entitlement = useProStore((s) => s.entitlement);
  const setEntitlement = useProStore((s) => s.setEntitlement);
  const [notificationsOn, setNotificationsOn] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [versionTapCount, setVersionTapCount] = useState(0);
  const devModeEnabled = useAppStore((s) => s.devModeEnabled);
  const setDevModeEnabled = useAppStore((s) => s.setDevModeEnabled);

  useEffect(() => {
    isNotificationsEnabled().then(setNotificationsOn);
    getCacheInfo().then(setCacheInfo);
    trackEvent('cache_size_viewed');
    isBiometricAvailable().then(({ available }) => setBiometricAvailable(available));
  }, []);

  const handleToggleNotifications = async (value: boolean) => {
    if (value) {
      const granted = await requestNotificationPermission();
      if (!granted) return;
    }
    setNotificationsOn(value);
    await setNotificationsEnabled(value);
  };

  const handleRestore = async () => {
    try {
      const ent = await restorePurchases();
      setEntitlement(ent);
      if (ent.proActive) {
        // Restored
      }
    } catch {
      // Ignore
    }
  };

  const handleManageSubscription = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('https://apps.apple.com/account/subscriptions');
    } else {
      Linking.openURL('https://play.google.com/store/account/subscriptions');
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t('settings.deleteAccount'),
      t('settings.deleteAccountMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await api.deleteAccount();
              clearGallery();
              useProStore.getState().setEntitlement({ proActive: false, proType: null, expiresAt: null });
              await clearAuth();
              navigation.reset({ index: 0, routes: [{ name: 'Onboarding' }] });
            } catch {
              Alert.alert(t('common.error'), t('settings.deleteAccountFailed'));
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ],
    );
  };

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { padding: spacing.md },
    title: { ...typography.h2, color: colors.textPrimary, marginBottom: spacing.lg },
    section: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    sectionTitle: {
      ...typography.bodyBold,
      color: colors.textPrimary,
      marginBottom: spacing.md,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    rowInfo: { flex: 1, marginRight: spacing.md },
    rowLabel: { ...typography.body, color: colors.textPrimary },
    rowDesc: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
    proStatusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    proBadge: {
      backgroundColor: '#6C5CE7',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 10,
      marginRight: spacing.md,
    },
    proBadgeText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '700',
    },
    proInfo: {
      flex: 1,
    },
    proPromoText: {
      ...typography.caption,
      color: colors.textSecondary,
      marginBottom: spacing.md,
      lineHeight: 20,
    },
    upgradeBtn: {
      backgroundColor: '#6C5CE7',
      borderRadius: borderRadius.lg,
      paddingVertical: spacing.sm,
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    upgradeBtnText: {
      ...typography.bodyBold,
      color: '#FFFFFF',
    },
    privacyNote: {
      ...typography.caption,
      color: colors.textSecondary,
      marginBottom: spacing.md,
      lineHeight: 20,
    },
    dangerBtn: {
      backgroundColor: colors.error + '20',
      borderRadius: borderRadius.md,
      padding: spacing.sm,
      alignItems: 'center',
    },
    dangerText: { ...typography.bodyBold, color: colors.error },
    linkRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.surfaceLight,
    },
    linkLabel: { ...typography.body, color: colors.textPrimary },
    linkArrow: { ...typography.body, color: colors.primary },
    versionBlock: {
      alignItems: 'center',
      paddingVertical: spacing.xl,
    },
    versionText: { ...typography.caption, color: colors.textMuted },
    versionSub: { ...typography.small, color: colors.textMuted, marginTop: 2 },
    segmentedRow: {
      flexDirection: 'row',
      backgroundColor: colors.surfaceLight,
      borderRadius: borderRadius.md,
      padding: 3,
    },
    segmentBtn: {
      flex: 1,
      paddingVertical: spacing.sm,
      alignItems: 'center',
      borderRadius: borderRadius.md - 2,
    },
    segmentBtnActive: {
      backgroundColor: colors.primary,
    },
    segmentLabel: {
      ...typography.caption,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    segmentLabelActive: {
      color: '#FFFFFF',
    },
    deleteAccountBtn: {
      backgroundColor: colors.error + '15',
      borderRadius: borderRadius.md,
      padding: spacing.sm,
      alignItems: 'center',
      marginTop: spacing.md,
    },
    deleteAccountText: { ...typography.bodyBold, color: colors.error },
  }), [colors]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title} accessibilityRole="header">{t('settings.title')}</Text>
        <UpdateBanner />

        {/* QuipPix Pro section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle} accessibilityRole="header">{t('settings.pro')}</Text>
          {entitlement.proActive ? (
            <>
              <View style={styles.proStatusRow}>
                <View style={styles.proBadge}>
                  <Text style={styles.proBadgeText}>PRO</Text>
                </View>
                <View style={styles.proInfo}>
                  <Text style={styles.rowLabel}>
                    {entitlement.proType === 'lifetime'
                      ? 'Lifetime'
                      : entitlement.proType === 'annual'
                      ? 'Annual'
                      : 'Monthly'}{' '}
                    Plan
                  </Text>
                  {entitlement.expiresAt && (
                    <Text style={styles.rowDesc}>
                      Renews: {new Date(entitlement.expiresAt).toLocaleDateString()}
                    </Text>
                  )}
                </View>
              </View>
              <TouchableOpacity style={styles.linkRow} onPress={handleManageSubscription} accessibilityLabel="Manage Subscription" accessibilityRole="button">
                <Text style={styles.linkLabel}>{t('settings.manageSubscription')}</Text>
                <Text style={styles.linkArrow}>→</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.linkRow} onPress={handleRestore} accessibilityLabel="Restore Purchases" accessibilityRole="button">
                <Text style={styles.linkLabel}>{t('settings.restorePurchases')}</Text>
                <Text style={styles.linkArrow}>→</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.proPromoText}>
                {t('settings.proPromo')}
              </Text>
              <TouchableOpacity
                style={styles.upgradeBtn}
                onPress={() => navigation.navigate('Paywall', { trigger: 'settings' })}
                accessibilityLabel="Upgrade to Pro"
                accessibilityRole="button"
              >
                <Text style={styles.upgradeBtnText}>{t('settings.upgradeBtn')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.linkRow} onPress={handleRestore} accessibilityLabel="Restore Purchases" accessibilityRole="button">
                <Text style={styles.linkLabel}>{t('settings.restorePurchases')}</Text>
                <Text style={styles.linkArrow}>→</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Export options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle} accessibilityRole="header">{t('settings.export')}</Text>
          <View style={styles.row}>
            <View style={styles.rowInfo}>
              <Text style={styles.rowLabel}>{t('settings.watermark')}</Text>
              <Text style={styles.rowDesc}>
                {t('settings.watermarkDesc')}
              </Text>
            </View>
            <Switch
              value={watermarkEnabled}
              onValueChange={setWatermarkEnabled}
              trackColor={{ false: colors.surfaceLight, true: colors.primary + '80' }}
              thumbColor={watermarkEnabled ? colors.primary : colors.textMuted}
              accessibilityLabel="Watermark"
              accessibilityHint="Add a small Made in QuipPix watermark to exports"
            />
          </View>
        </View>

        {/* Storage */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle} accessibilityRole="header">{t('settings.storage')}</Text>
          <View style={styles.row}>
            <View style={styles.rowInfo}>
              <Text style={styles.rowLabel}>{t('settings.imageCache')}</Text>
              <Text style={styles.rowDesc}>
                {cacheInfo
                  ? t('settings.cacheSize', { size: cacheInfo.formattedSize, count: String(cacheInfo.fileCount) })
                  : t('settings.cacheSizeLoading')}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.dangerBtn, { marginTop: spacing.md }]}
            disabled={isClearing}
            onPress={() => {
              Alert.alert(
                t('settings.clearCacheTitle'),
                t('settings.clearCacheMessage'),
                [
                  { text: t('common.cancel'), style: 'cancel' },
                  { text: t('settings.clearCacheConfirm'), style: 'destructive', onPress: async () => {
                    setIsClearing(true);
                    await clearCache();
                    trackEvent('cache_cleared');
                    const info = await getCacheInfo();
                    setCacheInfo(info);
                    setIsClearing(false);
                  }},
                ]
              );
            }}
            accessibilityLabel="Clear Cache"
            accessibilityRole="button"
          >
            <Text style={styles.dangerText}>
              {isClearing ? t('settings.clearing') : t('settings.clearCacheConfirm')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Appearance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle} accessibilityRole="header">{t('settings.appearance')}</Text>
          <View style={styles.segmentedRow}>
            {(['system', 'light', 'dark'] as ThemeMode[]).map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[styles.segmentBtn, themeMode === mode && styles.segmentBtnActive]}
                onPress={() => { triggerHaptic('selection'); setThemeMode(mode); }}
                accessibilityLabel={`${mode} theme`}
                accessibilityRole="button"
              >
                <Text style={[styles.segmentLabel, themeMode === mode && styles.segmentLabelActive]}>
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={[styles.row, { marginTop: spacing.md }]}>
            <View style={styles.rowInfo}>
              <Text style={styles.rowLabel}>{t('settings.reduceMotion')}</Text>
              <Text style={styles.rowDesc}>{t('settings.reduceMotionDesc')}</Text>
            </View>
            <Switch
              value={reduceMotionOverride === true}
              onValueChange={(val) => {
                setReduceMotionOverride(val ? true : null);
                trackEvent('reduce_motion_toggled', { enabled: val });
              }}
              trackColor={{ false: colors.surfaceLight, true: colors.primary }}
            />
          </View>
          <View style={[styles.row, { marginTop: spacing.md }]}>
            <View style={styles.rowInfo}>
              <Text style={styles.rowLabel}>{t('accessibility.highContrast')}</Text>
              <Text style={styles.rowDesc}>{t('accessibility.highContrastDesc')}</Text>
            </View>
            <Switch
              value={highContrastEnabled}
              onValueChange={(val) => {
                setHighContrastEnabled(val);
                trackEvent('high_contrast_toggled', { enabled: val });
              }}
              trackColor={{ false: colors.surfaceLight, true: colors.primary }}
            />
          </View>
          <View style={[styles.row, { marginTop: spacing.md }]}>
            <View style={styles.rowInfo}>
              <Text style={styles.rowLabel}>{t('accessibility.fontScaling')}</Text>
              <Text style={styles.rowDesc}>{t('accessibility.fontScalingDesc')}</Text>
            </View>
            <Switch
              value={fontScalingEnabled}
              onValueChange={(val) => {
                setFontScalingEnabled(val);
                trackEvent('font_scale_changed', { enabled: val });
              }}
              trackColor={{ false: colors.surfaceLight, true: colors.primary }}
            />
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle} accessibilityRole="header">{t('settings.notifications')}</Text>
          <View style={styles.row}>
            <View style={styles.rowInfo}>
              <Text style={styles.rowLabel}>{t('settings.dailyReminder')}</Text>
              <Text style={styles.rowDesc}>
                {t('settings.dailyReminderDesc')}
              </Text>
            </View>
            <Switch
              value={notificationsOn}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: colors.surfaceLight, true: colors.primary + '80' }}
              thumbColor={notificationsOn ? colors.primary : colors.textMuted}
              accessibilityLabel="Daily Challenge Reminder"
              accessibilityHint="Get notified about the daily challenge each morning"
            />
          </View>
        </View>

        {/* Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle} accessibilityRole="header">{t('settings.activity')}</Text>
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => navigation.navigate('Stats')}
            accessibilityLabel="Your Stats"
            accessibilityRole="button"
          >
            <Text style={styles.linkLabel}>{t('settings.yourStats')}</Text>
            <Text style={styles.linkArrow}>{'\u2192'}</Text>
          </TouchableOpacity>
        </View>

        {/* Privacy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle} accessibilityRole="header">{t('settings.privacy')}</Text>
          <Text style={styles.privacyNote}>
            {t('settings.privacyNoteFull')}
          </Text>
          {biometricAvailable && (
            <View style={[styles.row, { marginBottom: spacing.md }]}>
              <View style={styles.rowInfo}>
                <Text style={styles.rowLabel}>{t('security.biometricLock')}</Text>
                <Text style={styles.rowDesc}>{t('security.biometricLockDesc')}</Text>
              </View>
              <Switch
                value={biometricLockEnabled}
                onValueChange={(val) => {
                  setBiometricLockEnabled(val);
                  trackEvent('biometric_lock_toggled', { enabled: val });
                }}
                trackColor={{ false: colors.surfaceLight, true: colors.primary }}
              />
            </View>
          )}
          <TouchableOpacity
            style={[styles.linkRow, { borderBottomWidth: 0 }]}
            disabled={isExporting}
            onPress={async () => {
              setIsExporting(true);
              try {
                await exportAndShareData();
              } catch {
                Alert.alert(t('common.error'), t('privacy.exportFailed'));
              } finally {
                setIsExporting(false);
              }
            }}
            accessibilityLabel="Export My Data"
            accessibilityRole="button"
          >
            <Text style={styles.linkLabel}>
              {isExporting ? t('privacy.exportingData') : t('privacy.exportData')}
            </Text>
            <Text style={styles.linkArrow}>{'\u2192'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.dangerBtn}
            onPress={() => {
              clearGallery();
            }}
            accessibilityLabel="Delete All Local Data"
            accessibilityRole="button"
          >
            <Text style={styles.dangerText}>{t('settings.deleteAll')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteAccountBtn}
            onPress={handleDeleteAccount}
            disabled={isDeleting}
            accessibilityLabel="Delete Account"
            accessibilityRole="button"
          >
            <Text style={styles.deleteAccountText}>
              {isDeleting ? t('settings.deleting') : t('settings.deleteAccount')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Motiontography */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle} accessibilityRole="header">Motiontography</Text>

          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => Linking.openURL('https://motiontography.com/portfolio.html')}
            accessibilityLabel="View Portfolio"
            accessibilityRole="link"
          >
            <Text style={styles.linkLabel}>{t('settings.viewPortfolio')}</Text>
            <Text style={styles.linkArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => Linking.openURL('https://www.motiontography.com')}
            accessibilityLabel="Book a Real Shoot"
            accessibilityRole="link"
          >
            <Text style={styles.linkLabel}>{t('settings.bookShoot')}</Text>
            <Text style={styles.linkArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => Linking.openURL('https://www.motiontography.com')}
            accessibilityLabel="Privacy Policy"
            accessibilityRole="link"
          >
            <Text style={styles.linkLabel}>{t('settings.privacyPolicy')}</Text>
            <Text style={styles.linkArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => Linking.openURL('https://www.motiontography.com')}
            accessibilityLabel="Terms of Service"
            accessibilityRole="link"
          >
            <Text style={styles.linkLabel}>{t('settings.terms')}</Text>
            <Text style={styles.linkArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Developer Mode (hidden until activated) */}
        {devModeEnabled && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle} accessibilityRole="header">Developer</Text>
            <View style={styles.row}>
              <View style={styles.rowInfo}>
                <Text style={styles.rowLabel}>Developer Mode</Text>
                <Text style={styles.rowDesc}>Bypass Pro paywall and daily limits for testing</Text>
              </View>
              <Switch
                value={devModeEnabled}
                onValueChange={(val) => {
                  setDevModeEnabled(val);
                  if (val) {
                    setEntitlement({ proActive: true, proType: 'lifetime', expiresAt: null });
                  } else {
                    // Refresh real entitlement from RevenueCat
                    useProStore.getState().refreshEntitlement().catch(() => {});
                  }
                }}
                trackColor={{ false: colors.surfaceLight, true: '#E17055' }}
                thumbColor={devModeEnabled ? '#E17055' : colors.textMuted}
              />
            </View>
          </View>
        )}

        {/* Version */}
        <TouchableOpacity
          style={styles.versionBlock}
          activeOpacity={0.7}
          onPress={() => {
            const newCount = versionTapCount + 1;
            setVersionTapCount(newCount);
            if (newCount >= 7) {
              setDevModeEnabled(true);
              setEntitlement({ proActive: true, proType: 'lifetime', expiresAt: null });
              triggerHaptic('success');
              Alert.alert('Developer Mode', 'Pro features unlocked for testing.');
              setVersionTapCount(0);
            }
          }}
        >
          <Text style={styles.versionText}>QuipPix v{getAppVersion()} ({getBuildNumber()})</Text>
          <Text style={[styles.versionSub, { color: colors.primary, fontWeight: '600' }]}>A Motiontography Production</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
