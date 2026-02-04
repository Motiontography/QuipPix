import React, { useEffect, useState } from 'react';
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
import { colors, spacing, borderRadius, typography } from '../styles/theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function SettingsScreen() {
  const navigation = useNavigation<Nav>();
  const { watermarkEnabled, setWatermarkEnabled, clearGallery } = useAppStore();
  const entitlement = useProStore((s) => s.entitlement);
  const setEntitlement = useProStore((s) => s.setEntitlement);
  const [notificationsOn, setNotificationsOn] = useState(false);

  useEffect(() => {
    isNotificationsEnabled().then(setNotificationsOn);
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title} accessibilityRole="header">Settings</Text>

        {/* QuipPix Pro section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle} accessibilityRole="header">QuipPix Pro</Text>
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
                <Text style={styles.linkLabel}>Manage Subscription</Text>
                <Text style={styles.linkArrow}>→</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.linkRow} onPress={handleRestore} accessibilityLabel="Restore Purchases" accessibilityRole="button">
                <Text style={styles.linkLabel}>Restore Purchases</Text>
                <Text style={styles.linkArrow}>→</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.proPromoText}>
                Unlock all 15 styles, high-res exports, priority processing, and advanced controls.
              </Text>
              <TouchableOpacity
                style={styles.upgradeBtn}
                onPress={() => navigation.navigate('Paywall', { trigger: 'settings' })}
                accessibilityLabel="Upgrade to Pro"
                accessibilityRole="button"
              >
                <Text style={styles.upgradeBtnText}>Upgrade to Pro</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.linkRow} onPress={handleRestore} accessibilityLabel="Restore Purchases" accessibilityRole="button">
                <Text style={styles.linkLabel}>Restore Purchases</Text>
                <Text style={styles.linkArrow}>→</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Export options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle} accessibilityRole="header">Export</Text>
          <View style={styles.row}>
            <View style={styles.rowInfo}>
              <Text style={styles.rowLabel}>Watermark</Text>
              <Text style={styles.rowDesc}>
                Add a small "Made in QuipPix" watermark to exports
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

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle} accessibilityRole="header">Notifications</Text>
          <View style={styles.row}>
            <View style={styles.rowInfo}>
              <Text style={styles.rowLabel}>Daily Challenge Reminder</Text>
              <Text style={styles.rowDesc}>
                Get notified about the daily challenge each morning
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
          <Text style={styles.sectionTitle} accessibilityRole="header">Activity</Text>
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => navigation.navigate('Stats')}
            accessibilityLabel="Your Stats"
            accessibilityRole="button"
          >
            <Text style={styles.linkLabel}>Your Stats</Text>
            <Text style={styles.linkArrow}>{'\u2192'}</Text>
          </TouchableOpacity>
        </View>

        {/* Privacy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle} accessibilityRole="header">Privacy</Text>
          <Text style={styles.privacyNote}>
            Your photos are processed securely and automatically deleted from our servers
            within 1 hour. We strip all EXIF metadata before upload. No account required.
          </Text>
          <TouchableOpacity
            style={styles.dangerBtn}
            onPress={() => {
              clearGallery();
            }}
            accessibilityLabel="Delete All Local Data"
            accessibilityRole="button"
          >
            <Text style={styles.dangerText}>Delete All Local Data</Text>
          </TouchableOpacity>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle} accessibilityRole="header">About</Text>

          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => Linking.openURL('https://motiontography.com')}
            accessibilityLabel="View Portfolio"
            accessibilityRole="link"
          >
            <Text style={styles.linkLabel}>View Portfolio</Text>
            <Text style={styles.linkArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => Linking.openURL('https://motiontography.com/contact')}
            accessibilityLabel="Book a Real Shoot"
            accessibilityRole="link"
          >
            <Text style={styles.linkLabel}>Book a Real Shoot</Text>
            <Text style={styles.linkArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => Linking.openURL('https://quippix.app/privacy')}
            accessibilityLabel="Privacy Policy"
            accessibilityRole="link"
          >
            <Text style={styles.linkLabel}>Privacy Policy</Text>
            <Text style={styles.linkArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => Linking.openURL('https://quippix.app/terms')}
            accessibilityLabel="Terms of Service"
            accessibilityRole="link"
          >
            <Text style={styles.linkLabel}>Terms of Service</Text>
            <Text style={styles.linkArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Version */}
        <View style={styles.versionBlock}>
          <Text style={styles.versionText}>QuipPix v{getAppVersion()} ({getBuildNumber()})</Text>
          <Text style={styles.versionSub}>by Motiontography</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
});
