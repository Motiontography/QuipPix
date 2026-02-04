import React, { useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import { useTheme } from '../contexts/ThemeContext';
import { useAppStore } from '../store/useAppStore';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { GalleryItem } from '../types';
import { spacing, borderRadius, typography } from '../styles/theme';
import { t } from '../i18n';

interface ComparisonCarouselProps {
  currentItemId?: string;
  sourceImageUri?: string;
  onSelectItem: (item: GalleryItem) => void;
}

export function ComparisonCarousel({
  currentItemId,
  sourceImageUri,
  onSelectItem,
}: ComparisonCarouselProps) {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const getGalleryItemsBySource = useAppStore((s) => s.getGalleryItemsBySource);

  const alternatives = useMemo(() => {
    if (!sourceImageUri) return [];
    return getGalleryItemsBySource(sourceImageUri).filter(
      (item) => item.id !== currentItemId,
    );
  }, [sourceImageUri, currentItemId, getGalleryItemsBySource]);

  if (alternatives.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>
        {t('result.otherStyles')}
      </Text>
      <FlatList
        data={alternatives}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate={reduceMotion ? 'normal' : 'fast'}
        snapToInterval={96}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => onSelectItem(item)}
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.surfaceLight },
            ]}
          >
            <FastImage
              source={{ uri: item.localUri }}
              style={styles.thumbnail}
              resizeMode={FastImage.resizeMode.cover}
            />
            <Text
              style={[styles.styleName, { color: colors.textPrimary }]}
              numberOfLines={1}
            >
              {item.styleName}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.lg,
  },
  title: {
    ...typography.bodyBold,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  card: {
    width: 88,
    alignItems: 'center',
    padding: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  thumbnail: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.sm,
  },
  styleName: {
    ...typography.small,
    marginTop: 4,
    textAlign: 'center',
  },
});
