import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BottomSheet } from './BottomSheet';
import { TagEditor } from './TagEditor';
import { useTheme } from '../contexts/ThemeContext';
import { GalleryItem } from '../types';
import { getStylePack } from '../services/stylePacks';
import { trackEvent } from '../services/analytics';
import { spacing, borderRadius, typography } from '../styles/theme';
import { t } from '../i18n';

interface ItemDetailSheetProps {
  visible: boolean;
  item: GalleryItem | null;
  onClose: () => void;
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
}

export function ItemDetailSheet({
  visible,
  item,
  onClose,
  onAddTag,
  onRemoveTag,
}: ItemDetailSheetProps) {
  const { colors } = useTheme();

  const details = useMemo(() => {
    if (!item) return [];
    const stylePack = getStylePack(item.styleId);
    const date = new Date(item.createdAt);
    return [
      { label: t('gallery.itemStyle'), value: `${stylePack.icon} ${stylePack.displayName}` },
      {
        label: t('gallery.itemCreated'),
        value: date.toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
      },
      {
        label: t('gallery.itemIntensity'),
        value: `${item.params.sliders.intensity}%`,
      },
      {
        label: t('gallery.itemFidelity'),
        value: `${item.params.sliders.faceFidelity}%`,
      },
      ...(item.params.outputSize
        ? [{ label: t('gallery.itemSize'), value: item.params.outputSize }]
        : []),
    ];
  }, [item]);

  if (!item) return null;

  return (
    <BottomSheet
      visible={visible}
      title={t('gallery.itemDetail')}
      actions={[]}
      onClose={onClose}
    >
      <View style={styles.content}>
        {details.map((row) => (
          <View key={row.label} style={styles.row}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              {row.label}
            </Text>
            <Text style={[styles.value, { color: colors.textPrimary }]}>
              {row.value}
            </Text>
          </View>
        ))}

        <View style={styles.tagsSection}>
          <Text style={[styles.label, { color: colors.textSecondary, marginBottom: spacing.xs }]}>
            {t('gallery.itemTags')}
          </Text>
          <TagEditor
            tags={item.tags ?? []}
            onAdd={onAddTag}
            onRemove={onRemoveTag}
          />
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  label: {
    ...typography.caption,
  },
  value: {
    ...typography.body,
    fontWeight: '500',
  },
  tagsSection: {
    marginTop: spacing.md,
  },
});
