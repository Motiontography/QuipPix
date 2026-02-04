import React, { useMemo } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { BottomSheet } from './BottomSheet';
import { useAppStore } from '../store/useAppStore';
import { useTheme } from '../contexts/ThemeContext';
import { spacing, borderRadius, typography } from '../styles/theme';
import { t } from '../i18n';

interface ShareHistorySheetProps {
  visible: boolean;
  onClose: () => void;
}

const PLATFORM_ICONS: Record<string, string> = {
  instagram: '\uD83D\uDCF7',
  twitter: '\uD83D\uDC26',
  facebook: '\uD83D\uDC65',
  tiktok: '\uD83C\uDFB5',
  whatsapp: '\uD83D\uDCAC',
  general: '\uD83D\uDCE4',
};

export function ShareHistorySheet({ visible, onClose }: ShareHistorySheetProps) {
  const { colors } = useTheme();
  const shareHistory = useAppStore((s) => s.shareHistory);

  const recentHistory = useMemo(() => shareHistory.slice(0, 20), [shareHistory]);

  return (
    <BottomSheet
      visible={visible}
      title={t('share.history')}
      actions={[]}
      onClose={onClose}
    >
      <View style={styles.content}>
        {recentHistory.length === 0 ? (
          <Text style={[styles.empty, { color: colors.textMuted }]}>
            {t('share.noHistory')}
          </Text>
        ) : (
          <FlatList
            data={recentHistory}
            keyExtractor={(_, i) => String(i)}
            scrollEnabled={false}
            renderItem={({ item }) => {
              const date = new Date(item.sharedAt);
              const icon = PLATFORM_ICONS[item.platform] ?? PLATFORM_ICONS.general;
              return (
                <View style={[styles.row, { borderBottomColor: colors.surfaceLight }]}>
                  <Text style={styles.icon}>{icon}</Text>
                  <View style={styles.rowInfo}>
                    <Text style={[styles.platform, { color: colors.textPrimary }]}>
                      {item.platform.charAt(0).toUpperCase() + item.platform.slice(1)}
                    </Text>
                    <Text style={[styles.date, { color: colors.textMuted }]}>
                      {date.toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                </View>
              );
            }}
          />
        )}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
    maxHeight: 300,
  },
  empty: {
    ...typography.body,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  icon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  rowInfo: {
    flex: 1,
  },
  platform: {
    ...typography.body,
    fontWeight: '500',
  },
  date: {
    ...typography.caption,
    marginTop: 2,
  },
});
