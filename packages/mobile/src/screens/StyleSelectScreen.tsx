import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, StyleId } from '../types';
import { stylePacks, styleCategories, getStylesByCategory } from '../services/stylePacks';
import { usePaywallGuard } from '../hooks/usePaywallGuard';
import ProBadge from '../components/ProBadge';
import { colors, spacing, borderRadius, typography } from '../styles/theme';

type Nav = NativeStackNavigationProp<RootStackParamList, 'StyleSelect'>;
type Route = RouteProp<RootStackParamList, 'StyleSelect'>;

export default function StyleSelectScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { imageUri, imageUris } = route.params;
  const { isPro, guardStyle } = usePaywallGuard();

  const [selectedCategory, setSelectedCategory] = useState<string>(styleCategories[0]);

  const handleSelectStyle = (styleId: StyleId) => {
    if (!guardStyle(styleId)) return;
    navigation.navigate('Customize', { imageUri, styleId, imageUris });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with preview */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>{'<'} Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Choose a Style</Text>
      </View>

      {/* Preview thumbnail */}
      <View style={styles.previewContainer}>
        <Image source={{ uri: imageUri }} style={styles.previewImage} />
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
});
