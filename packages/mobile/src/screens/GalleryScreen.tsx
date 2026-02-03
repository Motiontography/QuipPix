import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Alert,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, GalleryItem } from '../types';
import { useAppStore } from '../store/useAppStore';
import { colors, spacing, borderRadius, typography } from '../styles/theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const SPOTLIGHT_INTERVAL = 7; // Show spotlight after every ~7 creations

export default function GalleryScreen() {
  const navigation = useNavigation<Nav>();
  const { gallery, removeFromGallery, clearGallery, loadGallery, creationCount } =
    useAppStore();

  useEffect(() => {
    loadGallery();
  }, [loadGallery]);

  const shouldShowSpotlight =
    creationCount > 0 && creationCount % SPOTLIGHT_INTERVAL === 0;

  const handleDelete = (id: string) => {
    Alert.alert('Delete', 'Remove this creation?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeFromGallery(id) },
    ]);
  };

  const handleClearAll = () => {
    Alert.alert('Clear Gallery', 'Delete all saved creations? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete All', style: 'destructive', onPress: () => clearGallery() },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Gallery</Text>
        {gallery.length > 0 && (
          <TouchableOpacity onPress={handleClearAll}>
            <Text style={styles.clearAll}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {gallery.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🖼️</Text>
          <Text style={styles.emptyTitle}>No creations yet</Text>
          <Text style={styles.emptyBody}>
            Your generated images will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={gallery}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.gridRow}
          ListHeaderComponent={
            shouldShowSpotlight ? <SpotlightCarousel /> : null
          }
          renderItem={({ item }: { item: GalleryItem }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() =>
                navigation.navigate('ShareCard', {
                  localUri: item.localUri,
                  styleName: item.styleName,
                  styleId: item.styleId,
                })
              }
              onLongPress={() => handleDelete(item.id)}
              activeOpacity={0.8}
            >
              <Image source={{ uri: item.localUri }} style={styles.cardImage} />
              <Text style={styles.cardStyle}>{item.styleName}</Text>
              <Text style={styles.cardDate}>
                {new Date(item.createdAt).toLocaleDateString()}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

function SpotlightCarousel() {
  return (
    <TouchableOpacity
      style={styles.spotlight}
      onPress={() => Linking.openURL('https://motiontography.com')}
      activeOpacity={0.8}
    >
      <View style={styles.spotlightBadge}>
        <Text style={styles.spotlightBadgeText}>Motiontography Spotlight</Text>
      </View>
      <Text style={styles.spotlightTitle}>Professional Photography & Video</Text>
      <Text style={styles.spotlightBody}>
        Love transforming photos? See what professional photography can do.
      </Text>
      <Text style={styles.spotlightCta}>View Portfolio →</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  title: { ...typography.h2, color: colors.textPrimary },
  clearAll: { ...typography.caption, color: colors.error },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.sm },
  emptyBody: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  grid: { padding: spacing.md },
  gridRow: { gap: spacing.md },
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  cardImage: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: colors.surfaceLight,
  },
  cardStyle: {
    ...typography.caption,
    color: colors.textPrimary,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.xs,
  },
  cardDate: {
    ...typography.small,
    color: colors.textMuted,
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
  },

  // Spotlight
  spotlight: {
    backgroundColor: colors.primary + '15',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  spotlightBadge: {
    backgroundColor: colors.primary + '30',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
  },
  spotlightBadgeText: { ...typography.small, color: colors.primaryLight },
  spotlightTitle: { ...typography.bodyBold, color: colors.textPrimary, marginBottom: 4 },
  spotlightBody: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.sm },
  spotlightCta: { ...typography.bodyBold, color: colors.primary },
});
