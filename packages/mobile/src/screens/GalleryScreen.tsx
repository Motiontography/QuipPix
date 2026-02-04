import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Linking,
  Modal,
  ScrollView,
  TextInput,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import RNFS from 'react-native-fs';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, GalleryItem } from '../types';
import { useAppStore } from '../store/useAppStore';
import OfflineBanner from '../components/OfflineBanner';
import GallerySkeleton from '../components/GallerySkeleton';
import CoachMark from '../components/CoachMark';
import { triggerHaptic } from '../services/haptics';
import { trackEvent } from '../services/analytics';
import { spacing, borderRadius, typography } from '../styles/theme';
import { useTheme } from '../contexts/ThemeContext';
import { COACH_MARKS } from '../constants/coachMarks';
import { t } from '../i18n';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const SPOTLIGHT_INTERVAL = 7;

export default function GalleryScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const {
    gallery,
    removeFromGallery,
    clearGallery,
    loadGallery,
    creationCount,
    favorites,
    toggleFavorite,
    isFavorite,
    collections,
    addCollection,
    addToCollection,
    removeCollection,
  } = useAppStore();

  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'favorites' | string>('all');
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuItemId, setMenuItemId] = useState<string | null>(null);
  const [newCollectionVisible, setNewCollectionVisible] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'style'>('newest');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout>();
  const galleryHeaderRef = useRef<View>(null);

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setDebouncedQuery(searchQuery.toLowerCase());
    }, 300);
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [searchQuery]);

  useEffect(() => {
    loadGallery().finally(() => setIsLoading(false));
  }, [loadGallery]);

  const filteredGallery = useMemo(() => {
    // Step 1: Filter by active tab
    let items = gallery;
    if (activeFilter === 'favorites') {
      items = items.filter((g) => favorites.includes(g.id));
    } else if (activeFilter !== 'all') {
      const collection = collections.find((c) => c.id === activeFilter);
      if (collection) items = items.filter((g) => collection.itemIds.includes(g.id));
    }

    // Step 2: Filter by search query
    if (debouncedQuery) {
      items = items.filter(
        (g) =>
          g.styleName.toLowerCase().includes(debouncedQuery) ||
          g.styleId.toLowerCase().includes(debouncedQuery),
      );
    }

    // Step 3: Sort
    const sorted = [...items];
    switch (sortOrder) {
      case 'oldest':
        sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'style':
        sorted.sort((a, b) => a.styleName.localeCompare(b.styleName));
        break;
      case 'newest':
      default:
        sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }

    return sorted;
  }, [gallery, activeFilter, favorites, collections, debouncedQuery, sortOrder]);

  const shouldShowSpotlight =
    creationCount > 0 && creationCount % SPOTLIGHT_INTERVAL === 0;

  const handleDelete = (id: string) => {
    Alert.alert(t('gallery.deleteTitle'), t('gallery.deleteMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => { triggerHaptic('warning'); removeFromGallery(id); } },
    ]);
  };

  const handleClearAll = () => {
    Alert.alert(t('gallery.clearAllTitle'), t('gallery.clearAllMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('gallery.deleteAll'), style: 'destructive', onPress: () => clearGallery() },
    ]);
  };

  const handleCreateCollection = () => {
    const name = newCollectionName.trim();
    if (name.length > 0) {
      addCollection(name);
      setNewCollectionName('');
      setNewCollectionVisible(false);
    }
  };

  const styles = useMemo(() => StyleSheet.create({
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

    // Search + Sort
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      marginBottom: spacing.sm,
      gap: spacing.sm,
    },
    searchBar: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      paddingHorizontal: spacing.sm,
      height: 40,
    },
    searchIcon: { fontSize: 16, marginRight: spacing.xs },
    searchInput: {
      flex: 1,
      ...typography.body,
      color: colors.textPrimary,
      paddingVertical: 0,
    },
    clearSearch: {
      ...typography.bodyBold,
      color: colors.textMuted,
      padding: spacing.xs,
    },
    sortButton: {
      width: 40,
      height: 40,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
    },
    sortIcon: { fontSize: 18 },

    // Filter tabs
    filterBar: { maxHeight: 44, marginBottom: spacing.sm },
    filterContent: { paddingHorizontal: spacing.md, gap: spacing.sm },
    filterTab: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.full,
      backgroundColor: colors.surface,
    },
    filterTabActive: { backgroundColor: colors.primary },
    filterTabAdd: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.full,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.primary + '40',
      borderStyle: 'dashed',
    },
    filterText: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
    filterTextActive: { color: colors.textPrimary },
    filterTextAdd: { ...typography.caption, color: colors.primary, fontWeight: '700' },

    // Empty state
    empty: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.xl,
    },
    emptyIcon: { fontSize: 48, marginBottom: spacing.md },
    emptyTitle: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.sm },
    emptyBody: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },

    // Grid
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

    // Heart overlay
    heartOverlay: {
      position: 'absolute',
      top: spacing.xs,
      right: spacing.xs,
    },
    heartIcon: { fontSize: 20 },

    // Context menu
    menuOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    menuCard: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      width: '80%',
    },
    menuTitle: {
      ...typography.bodyBold,
      color: colors.textPrimary,
      marginBottom: spacing.md,
    },
    menuItem: { paddingVertical: spacing.sm },
    menuItemText: { ...typography.body, color: colors.textPrimary },
    menuItemTextPrimary: { ...typography.bodyBold, color: colors.primary },
    menuItemTextDestructive: { ...typography.bodyBold, color: colors.error },

    // New collection
    collectionInput: {
      ...typography.body,
      color: colors.textPrimary,
      backgroundColor: colors.surfaceLight,
      borderRadius: borderRadius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      marginBottom: spacing.md,
    },
    createButton: {
      backgroundColor: colors.primary,
      borderRadius: borderRadius.md,
      paddingVertical: spacing.sm,
      alignItems: 'center',
    },
    createButtonText: { ...typography.bodyBold, color: colors.textPrimary },
  }), [colors]);

  return (
    <SafeAreaView style={styles.container}>
      <OfflineBanner />
      <View style={styles.header} ref={galleryHeaderRef}>
        <Text style={styles.title}>{t('gallery.title')}</Text>
        {gallery.length > 0 && (
          <TouchableOpacity onPress={handleClearAll}>
            <Text style={styles.clearAll}>{t('gallery.clearAll')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Search + Sort */}
      {gallery.length > 0 && (
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>{'\uD83D\uDD0D'}</Text>
            <TextInput
              style={styles.searchInput}
              placeholder={t('gallery.searchPlaceholder')}
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
              accessibilityLabel="Search gallery by style name"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text style={styles.clearSearch}>{'\u2715'}</Text>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={styles.sortButton}
            onPress={() => setShowSortMenu(true)}
          >
            <Text style={styles.sortIcon}>
              {sortOrder === 'newest' ? '\u2B07' : sortOrder === 'oldest' ? '\u2B06' : '\uD83D\uDD24'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Filter tabs */}
      {gallery.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterBar}
          contentContainerStyle={styles.filterContent}
        >
          <TouchableOpacity
            style={[styles.filterTab, activeFilter === 'all' && styles.filterTabActive]}
            onPress={() => setActiveFilter('all')}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeFilter === 'all' }}
            accessibilityLabel="All creations"
          >
            <Text style={[styles.filterText, activeFilter === 'all' && styles.filterTextActive]}>
              {t('gallery.all')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, activeFilter === 'favorites' && styles.filterTabActive]}
            onPress={() => setActiveFilter('favorites')}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeFilter === 'favorites' }}
            accessibilityLabel="Favorites"
          >
            <Text style={[styles.filterText, activeFilter === 'favorites' && styles.filterTextActive]}>
              {t('gallery.favorites')}
            </Text>
          </TouchableOpacity>
          {collections.map((col) => (
            <TouchableOpacity
              key={col.id}
              style={[styles.filterTab, activeFilter === col.id && styles.filterTabActive]}
              onPress={() => setActiveFilter(col.id)}
              onLongPress={() => {
                Alert.alert(t('gallery.deleteCollection'), `Remove "${col.name}"?`, [
                  { text: t('common.cancel'), style: 'cancel' },
                  {
                    text: t('common.delete'),
                    style: 'destructive',
                    onPress: () => {
                      removeCollection(col.id);
                      if (activeFilter === col.id) setActiveFilter('all');
                    },
                  },
                ]);
              }}
            >
              <Text style={[styles.filterText, activeFilter === col.id && styles.filterTextActive]}>
                {col.name}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={styles.filterTabAdd}
            onPress={() => setNewCollectionVisible(true)}
          >
            <Text style={styles.filterTextAdd}>+</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {isLoading ? (
        <GallerySkeleton />
      ) : filteredGallery.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>
            {activeFilter === 'favorites' ? 'heart' === 'heart' ? '\u2764\uFE0F' : '' : '\uD83D\uDDBC\uFE0F'}
          </Text>
          <Text style={styles.emptyTitle}>
            {activeFilter === 'favorites' ? t('gallery.favoritesEmptyTitle') : activeFilter === 'all' ? t('gallery.emptyTitle') : t('gallery.collectionEmptyTitle')}
          </Text>
          <Text style={styles.emptyBody}>
            {activeFilter === 'favorites'
              ? t('gallery.favoritesEmptyBody')
              : activeFilter === 'all'
                ? t('gallery.emptyBody')
                : t('gallery.collectionEmptyBody')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredGallery}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.gridRow}
          ListHeaderComponent={
            shouldShowSpotlight && activeFilter === 'all' ? <SpotlightCarousel /> : null
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
              onLongPress={() => {
                setMenuItemId(item.id);
                setMenuVisible(true);
              }}
              activeOpacity={0.8}
              accessibilityLabel={`${item.styleName} created on ${new Date(item.createdAt).toLocaleDateString()}`}
              accessibilityRole="button"
              accessibilityHint="Tap to view, long press for options"
            >
              <View>
                <FastImage source={{ uri: item.localUri, priority: FastImage.priority.normal }} style={styles.cardImage} resizeMode={FastImage.resizeMode.cover} />
                <TouchableOpacity
                  style={styles.heartOverlay}
                  onPress={() => toggleFavorite(item.id)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  accessibilityLabel={isFavorite(item.id) ? 'Remove from favorites' : 'Add to favorites'}
                  accessibilityRole="button"
                >
                  <Text style={styles.heartIcon}>
                    {isFavorite(item.id) ? '\u2764\uFE0F' : '\uD83E\uDD0D'}
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.cardStyle}>{item.styleName}</Text>
              <Text style={styles.cardDate}>
                {new Date(item.createdAt).toLocaleDateString()}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Context menu modal */}
      <Modal visible={menuVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.menuCard}>
            <Text style={styles.menuTitle}>{t('gallery.actions')}</Text>
            {/* Re-create */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={async () => {
                setMenuVisible(false);
                const item = gallery.find((g) => g.id === menuItemId);
                if (!item) return;
                if (!item.params) return;
                try {
                  const exists = await RNFS.exists(item.localUri);
                  if (!exists) {
                    Alert.alert(t('common.error'), t('gallery.imageNotFound'));
                    return;
                  }
                } catch {
                  // If check fails, try navigating anyway
                }
                triggerHaptic('light');
                trackEvent('recreate_from_gallery', { styleId: item.params.styleId });
                navigation.navigate('Customize', {
                  imageUri: item.localUri,
                  styleId: item.params.styleId,
                  prefillParams: item.params,
                });
              }}
            >
              <Text style={styles.menuItemTextPrimary}>{t('gallery.recreate')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                if (menuItemId) handleDelete(menuItemId);
              }}
            >
              <Text style={styles.menuItemTextDestructive}>{t('common.delete')}</Text>
            </TouchableOpacity>
            {collections.map((col) => (
              <TouchableOpacity
                key={col.id}
                style={styles.menuItem}
                onPress={() => {
                  if (menuItemId) addToCollection(col.id, menuItemId);
                  setMenuVisible(false);
                }}
              >
                <Text style={styles.menuItemText}>Add to {col.name}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                setNewCollectionVisible(true);
              }}
            >
              <Text style={styles.menuItemTextPrimary}>+ New Collection</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Sort menu modal */}
      <Modal visible={showSortMenu} transparent animationType="fade">
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setShowSortMenu(false)}
        >
          <View style={styles.menuCard}>
            <Text style={styles.menuTitle}>{t('gallery.sortBy')}</Text>
            {([
              { key: 'newest' as const, label: t('gallery.sortNewest') },
              { key: 'oldest' as const, label: t('gallery.sortOldest') },
              { key: 'style' as const, label: t('gallery.sortByStyleName') },
            ]).map((option) => (
              <TouchableOpacity
                key={option.key}
                style={styles.menuItem}
                onPress={() => {
                  setSortOrder(option.key);
                  setShowSortMenu(false);
                }}
              >
                <Text
                  style={[
                    styles.menuItemText,
                    sortOrder === option.key && styles.menuItemTextPrimary,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* New collection modal */}
      <Modal visible={newCollectionVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setNewCollectionVisible(false)}
        >
          <View style={styles.menuCard}>
            <Text style={styles.menuTitle}>{t('gallery.newCollection')}</Text>
            <TextInput
              style={styles.collectionInput}
              placeholder={t('gallery.collectionPlaceholder')}
              placeholderTextColor={colors.textMuted}
              value={newCollectionName}
              onChangeText={setNewCollectionName}
              autoFocus
              maxLength={30}
            />
            <TouchableOpacity style={styles.createButton} onPress={handleCreateCollection}>
              <Text style={styles.createButtonText}>{t('gallery.create')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
      {gallery.length > 0 && (
        <CoachMark
          markId={COACH_MARKS.GALLERY_RECREATE.id}
          title={t(COACH_MARKS.GALLERY_RECREATE.titleKey)}
          description={t(COACH_MARKS.GALLERY_RECREATE.descKey)}
          targetRef={galleryHeaderRef}
          position="below"
        />
      )}
    </SafeAreaView>
  );
}

function SpotlightCarousel() {
  const { colors } = useTheme();

  const styles = useMemo(() => StyleSheet.create({
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
  }), [colors]);

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
