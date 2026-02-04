import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { checkForUpdate, openStore } from '../services/appUpdate';
import { useTheme } from '../contexts/ThemeContext';
import { trackEvent } from '../services/analytics';
import { spacing, borderRadius, typography } from '../styles/theme';
import { t } from '../i18n';

export function UpdateBanner() {
  const { colors } = useTheme();
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    checkForUpdate().then((info) => {
      setAvailable(info.updateAvailable);
      setLatestVersion(info.latestVersion);
      if (info.updateAvailable) {
        trackEvent('app_update_prompted', {
          latestVersion: info.latestVersion ?? '',
        });
      }
      trackEvent('app_update_checked');
    });
  }, []);

  if (!available || !latestVersion) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.primary + '15' }]}>
      <View style={styles.info}>
        <Text style={[styles.title, { color: colors.primary }]}>
          {t('settings.updateAvailable')}
        </Text>
        <Text style={[styles.message, { color: colors.textSecondary }]}>
          {t('settings.updateMessage', { version: latestVersion })}
        </Text>
      </View>
      <TouchableOpacity
        style={[styles.btn, { backgroundColor: colors.primary }]}
        onPress={openStore}
        accessibilityLabel="Update QuipPix"
        accessibilityRole="button"
      >
        <Text style={styles.btnText}>{t('settings.updateNow')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  info: {
    flex: 1,
    marginRight: spacing.md,
  },
  title: {
    ...typography.bodyBold,
    marginBottom: 2,
  },
  message: {
    ...typography.caption,
  },
  btn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  btnText: {
    ...typography.bodyBold,
    color: '#FFFFFF',
    fontSize: 13,
  },
});
