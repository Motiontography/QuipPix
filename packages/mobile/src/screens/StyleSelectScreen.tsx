import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Modal,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, StyleId, StylePack } from '../types';
import { stylePacks, styleCategories, getStylesByCategory, getStylePack } from '../services/stylePacks';
import { usePaywallGuard } from '../hooks/usePaywallGuard';
import ProBadge from '../components/ProBadge';
import { spacing, borderRadius, typography } from '../styles/theme';
import { useTheme } from '../contexts/ThemeContext';
import { t } from '../i18n';

type Nav = NativeStackNavigationProp<RootStackParamList, 'StyleSelect'>;
type Route = RouteProp<RootStackParamList, 'StyleSelect'>;

export default function StyleSelectScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { imageUri, imageUris, challengeId, preselectedStyleId } = route.params;
  const { isPro, guardStyle } = usePaywallGuard();
  const { colors } = useTheme();

  const [selectedCategory, setSelectedCategory] = useState<string>(styleCategories[0]);
  const [previewStyle, setPreviewStyle] = useState<StylePack | null>(null);

  // Auto-navigate if preselected style from challenge
  React.useEffect(() => {
    if (preselectedStyleId) {
      navigation.replace('Customize', { imageUri, styleId: preselectedStyleId, imageUris, challengeId });
    }
  }, [preselectedStyleId, imageUri, imageUris, challengeId, navigation]);

  const handleSelectStyle = (styleId: StyleId) => {
    const pack = getStylePack(styleId);
    setPreviewStyle(pack);
  };

  const handleConfirmStyle = () => {
    if (!previewStyle) return;
    if (!guardStyle(previewStyle.id)) {
      setPreviewStyle(null);
      return;
    }
    setPreviewStyle(null);
    navigation.navigate('Customize', {
      imageUri,
      styleId: previewStyle.id,
      imageUris,
      challengeId,
    });
  };

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    backBtn: { paddingRight: spacing.md },
    backText: { ...typography.body, color: colors.primary },
    title: { ...typography.h2, color: colors.textPrimary, flex: 1 },
    previewContainer: {
      alignItems: 'center',
      paddingVertical: spacing.sm,
    },
    previewImage: {
      width: 120,
      height: 120,
      borderRadius: borderRadius.lg,
      backgroundColor: colors.surface,
    },
    categoryBar: {
      maxHeight: 48,
      marginVertical: spacing.sm,
    },
    categoryContent: {
      paddingHorizontal: spacing.md,
      gap: spacing.sm,
    },
    categoryTab: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.full,
      backgroundColor: colors.surface,
    },
    categoryTabActive: {
      backgroundColor: colors.primary,
    },
    categoryText: {
      ...typography.bodyBold,
      color: colors.textSecondary,
    },
    categoryTextActive: {
      color: colors.textPrimary,
    },
    grid: {
      padding: spacing.md,
    },
    gridRow: {
      gap: spacing.md,
    },
    styleCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    stylePreview: {
      height: 80,
      borderRadius: borderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    styleIcon: { fontSize: 36 },
    proBadgePosition: {
      position: 'absolute',
      top: 6,
      right: 6,
    },
    styleName: {
      ...typography.bodyBold,
      color: colors.textPrimary,
      marginBottom: 2,
    },
    styleDesc: {
      ...typography.caption,
      color: colors.textSecondary,
    },

    // Preview modal
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    previewModal: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.xl,
      padding: spacing.lg,
      width: '85%',
      alignItems: 'center',
    },
    previewIconContainer: {
      width: 80,
      height: 80,
      borderRadius: borderRadius.lg,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    previewIconLarge: { fontSize: 40 },
    previewName: { ...typography.h3, color: colors.textPrimary, marginBottom: 4 },
    previewCategory: { ...typography.caption, color: colors.primary, marginBottom: spacing.sm },
    previewDescription: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: spacing.md,
    },
    beforeAfterRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.md,
      gap: spacing.sm,
    },
    beforeAfterBox: { alignItems: 'center' },
    beforeAfterLabel: { ...typography.small, color: colors.textMuted, marginBottom: 4 },
    beforeAfterImg: {
      width: 80,
      height: 80,
      borderRadius: borderRadius.md,
      backgroundColor: colors.surfaceLight,
    },
    arrowText: { ...typography.h3, color: colors.textMuted },
    proNotice: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    proNoticeText: { ...typography.caption, color: colors.textSecondary },
    useStyleBtn: {
      backgroundColor: colors.primary,
      borderRadius: borderRadius.lg,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.xl,
      width: '100%',
      alignItems: 'center',
    },
    useStyleBtnLocked: {
      backgroundColor: colors.surfaceLight,
    },
    useStyleBtnText: { ...typography.bodyBold, color: colors.textPrimary },
  }), [colors]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with preview */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} accessibilityLabel="Go back" accessibilityRole="button">
          <Text style={styles.backText}>{t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.title} accessibilityRole="header">{t('styleSelect.title')}</Text>
      </View>

      {/* Preview thumbnail */}
      <View style={styles.previewContainer}>
        <FastImage source={{ uri: imageUri, priority: FastImage.priority.normal }} style={styles.previewImage} resizeMode={FastImage.resizeMode.cover} />
      </View>

      {/* Category tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryBar}
        contentContainerStyle={styles.categoryContent}
      >
        {styleCategories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.categoryTab,
              selectedCategory === cat && styles.categoryTabActive,
            ]}
            onPress={() => setSelectedCategory(cat)}
            accessibilityRole="tab"
            accessibilityState={{ selected: selectedCategory === cat }}
            accessibilityLabel={`${cat} styles`}
          >
            <Text
              style={[
                styles.categoryText,
                selectedCategory === cat && styles.categoryTextActive,
              ]}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Style grid */}
      <FlatList
        data={getStylesByCategory(selectedCategory)}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.gridRow}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.styleCard}
            onPress={() => handleSelectStyle(item.id)}
            activeOpacity={0.7}
            accessibilityLabel={`${item.displayName} style. ${item.description}${item.proOnly && !isPro ? '. Requires Pro' : ''}`}
            accessibilityRole="button"
            accessibilityHint="Tap to preview this style"
          >
            <View style={[styles.stylePreview, { backgroundColor: item.previewColor }]}>
              <Text style={styles.styleIcon}>{item.icon}</Text>
              {item.proOnly && !isPro && (
                <View style={styles.proBadgePosition}>
                  <ProBadge size="small" />
                </View>
              )}
            </View>
            <Text style={styles.styleName}>{item.displayName}</Text>
            <Text style={styles.styleDesc} numberOfLines={2}>
              {item.description}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Style preview modal */}
      <Modal visible={!!previewStyle} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setPreviewStyle(null)}
        >
          <View style={styles.previewModal} onStartShouldSetResponder={() => true}>
            {previewStyle && (
              <>
                <View
                  style={[
                    styles.previewIconContainer,
                    { backgroundColor: previewStyle.previewColor },
                  ]}
                >
                  <Text style={styles.previewIconLarge}>{previewStyle.icon}</Text>
                </View>
                <Text style={styles.previewName}>{previewStyle.displayName}</Text>
                <Text style={styles.previewCategory}>{previewStyle.category}</Text>
                <Text style={styles.previewDescription}>{previewStyle.description}</Text>

                {/* Before -> After */}
                <View style={styles.beforeAfterRow}>
                  <View style={styles.beforeAfterBox}>
                    <Text style={styles.beforeAfterLabel}>{t('styleSelect.before')}</Text>
                    <FastImage source={{ uri: imageUri, priority: FastImage.priority.normal }} style={styles.beforeAfterImg} resizeMode={FastImage.resizeMode.cover} />
                  </View>
                  <Text style={styles.arrowText}>{'\u2192'}</Text>
                  <View style={styles.beforeAfterBox}>
                    <Text style={styles.beforeAfterLabel}>{t('styleSelect.after')}</Text>
                    <View
                      style={[
                        styles.beforeAfterImg,
                        {
                          backgroundColor: previewStyle.previewColor,
                          justifyContent: 'center',
                          alignItems: 'center',
                        },
                      ]}
                    >
                      <Text style={{ fontSize: 28 }}>{previewStyle.icon}</Text>
                    </View>
                  </View>
                </View>

                {previewStyle.proOnly && !isPro && (
                  <View style={styles.proNotice}>
                    <ProBadge size="small" />
                    <Text style={styles.proNoticeText}>{t('styleSelect.requiresPro')}</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[
                    styles.useStyleBtn,
                    previewStyle.proOnly && !isPro && styles.useStyleBtnLocked,
                  ]}
                  onPress={handleConfirmStyle}
                  activeOpacity={0.8}
                >
                  <Text style={styles.useStyleBtnText}>
                    {previewStyle.proOnly && !isPro ? t('styleSelect.unlockWithPro') : t('styleSelect.useStyle')}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}
