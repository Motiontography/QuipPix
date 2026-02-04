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
  ScrollView,
  TextInput,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, GalleryItem } from '../types';
import { useAppStore } from '../store/useAppStore';
import OfflineBanner from '../components/OfflineBanner';
import GallerySkeleton from '../components/GallerySkeleton';
import CoachMark from '../components/CoachMark';
import { BottomSheet, BottomSheetAction } from '../components/BottomSheet';
import { SelectionBar } from '../components/SelectionBar';
import { useMultiSelect } from '../hooks/useMultiSelect';
import { triggerHaptic } from '../services/haptics';
import { trackEvent } from '../services/analytics';
import { spacing, borderRadius, typography } from '../styles/theme';
import { useTheme } from '../contexts/ThemeContext';
import { COACH_MARKS } from '../constants/coachMarks';
import { t } from '../i18n';
import { SwipeableGalleryCard } from '../components/SwipeableGalleryCard';
import { useReducedMotion } from '../hooks/useReducedMotion';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const SPOTLIGHT_INTERVAL = 7;

export default function GalleryScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const {
    gallery,
    removeFromGallery,
    removeMultipleFromGallery,
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

  const {
    isSelectionMode,
    selectedIds,
    toggleSelection,
    enterSelectionMode,
    exitSelectionMode,
    isSelected,
    selectedCount,
    selectAll,
  } = useMultiSelect();

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
  const [listMode, setListMode] = useState<'grid' | 'list'>('grid');
  const [collectionPickerVisible, setCollectionPickerVisible] = useState(false);
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

  // --- Context menu BottomSheet actions ---
  const contextMenuActions = useMemo((): BottomSheetAction[] => {
    const item = gallery.find((g) => g.id === menuItemId);
    const actions: BottomSheetAction[] = [];

    // Re-create action
    actions.push({
      label: t('gallery.recreate'),
      icon: '\uD83D\uDD04',
      variant: 'primary',
      onPress: async () => {
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
      },
    });

    // Collection actions
    collections.forEach((col) => {
      actions.push({
        label: `Add to ${col.name}`,
        icon: '\uD83D\uDCC1',
        onPress: () => {
          if (menuItemId) addToCollection(col.id, menuItemId);
        },
      });
    });

    // New collection
    actions.push({
      label: '+ New Collection',
      icon: '\uD83D\uDCC2',
      variant: 'primary',
      onPress: () => {
        setNewCollectionVisible(true);
      },
    });

    // Delete
    actions.push({
      label: t('common.delete'),
      icon: '\uD83D\uDDD1',
      variant: 'destructive',
      onPress: () => {
        if (menuItemId) handleDelete(menuItemId);
      },
    });

    return actions;
  }, [menuItemId, gallery, collections, navigation, addToCollection]);

  // --- Sort menu BottomSheet actions ---
  const sortMenuActions = useMemo((): BottomSheetAction[] => {
    return [
      {
        label: t('gallery.sortNewest'),
        icon: '\u2B07',
        variant: sortOrder === 'newest' ? 'primary' : 'default',
        onPress: () => setSortOrder('newest'),
      },
      {
        label: t('gallery.sortOldest'),
        icon: '\u2B06',
        variant: sortOrder === 'oldest' ? 'primary' : 'default',
        onPress: () => setSortOrder('oldest'),
      },
      {
        label: t('gallery.sortByStyleName'),
        icon: '\uD83D\uDD24',
        variant: sortOrder === 'style' ? 'primary' : 'default',
        onPress: () => setSortOrder('style'),
      },
    ];
  }, [sortOrder]);

  // --- Multi-select: collection picker actions ---
  const collectionPickerActions = useMemo((): BottomSheetAction[] => {
    const actions: BottomSheetAction[] = collections.map((col) => ({
      label: col.name,
      icon: '\uD83D\uDCC1',
      onPress: () => {
        selectedIds.forEach((id) => addToCollection(col.id, id));
        trackEvent('gallery_multiselect_collection', { count: selectedCount, collection: col.name });
        exitSelectionMode();
      },
    }));

    actions.push({
      label: '+ New Collection',
      icon: '\uD83D\uDCC2',
      variant: 'primary',
      onPress: () => {
        setCollectionPickerVisible(false);
        setNewCollectionVisible(true);
      },
    });

    return actions;
  }, [collections, selectedIds, selectedCount, addToCollection, exitSelectionMode]);

  // --- Multi-select handlers ---
  const handleMultiSelectDelete = () => {
    Alert.alert(
      t('gallery.deleteTitle'),
      `Delete ${selectedCount} selected items?`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            removeMultipleFromGallery([...selectedIds]);
            trackEvent('gallery_multiselect_delete', { count: selectedCount });
            exitSelectionMode();
          },
        },
      ],
    );
  };

  const handleMultiSelectShare = async () => {
    const uris: string[] = [];
    selectedIds.forEach((id) => {
      const item = gallery.find((g) => g.id === id);
      if (item?.localUri) uris.push(item.localUri);
    });
    try {
      await Share.open({ urls: uris });
      trackEvent('gallery_multiselect_share', { count: selectedCount });
    } catch {
      // User cancelled share
    }
  };

  const handleMultiSelectAddToCollection = () => {
    setCollectionPickerVisible(true);
  };

  const handleMultiSelectSelectAll = () => {
    selectAll(filteredGallery.map((i) => i.id));
  };

  // --- Card press handlers ---
  const handleCardPress = (item: GalleryItem) => {
    if (isSelectionMode) {
      toggleSelection(item.id);
      return;
    }
    navigation.navigate('ShareCard', {
      localUri: item.localUri,
      styleName: item.styleName,
      styleId: item.styleId,
    });
  };

  const handleCardLongPress = (item: GalleryItem) => {
    if (isSelectionMode) {
      toggleSelection(item.id);
      return;
    }
    enterSelectionMode(item.id);
    triggerHaptic('medium');
    trackEvent('gallery_multiselect_entered');
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

    // Selection mode header
    selectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
    },
    selectionCount: { ...typography.h3, color: colors.textPrimary },
    selectionCancel: { ...typography.bodyBold, color: colors.primary },

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

    // List mode
    listCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      overflow: 'hidden',
      marginBottom: spacing.sm,
      padding: spacing.sm,
    },
    listCardImage: {
      width: 64,
      height: 64,
      borderRadius: borderRadius.md,
      backgroundColor: colors.surfaceLight,
    },
    listCardInfo: {
      flex: 1,
      marginLeft: spacing.sm,
    },

    // Heart overlay
    heartOverlay: {
      position: 'absolute',
      top: spacing.xs,
      right: spacing.xs,
    },
    heartIcon: { fontSize: 20 },

    // Selection checkmark overlay
    checkmarkOverlay: {
      position: 'absolute',
      top: spacing.xs,
      left: spacing.xs,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 2,
    },
    checkmarkText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '700',
      lineHeight: 16,
    },
    uncheckedOverlay: {
      position: 'absolute',
      top: spacing.xs,
      left: spacing.xs,
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: '#FFFFFF',
      backgroundColor: 'rgba(0,0,0,0.3)',
      zIndex: 2,
    },

    // New collection (used inside BottomSheet children)
    collectionInput: {
      ...typography.body,
      color: colors.textPrimary,
      backgroundColor: colors.surfaceLight,
      borderRadius: borderRadius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      marginBottom: spacing.md,
      marginHorizontal: spacing.md,
    },
    createButton: {
      backgroundColor: colors.primary,
      borderRadius: borderRadius.md,
      paddingVertical: spacing.sm,
      alignItems: 'center',
      marginHorizontal: spacing.md,
    },
    createButtonText: { ...typography.bodyBold, color: colors.textPrimary },
  }), [colors]);

  return (
    <SafeAreaView style={styles.container}>
      <OfflineBanner />

      {/* Header: normal or selection mode */}
      {isSelectionMode ? (
        <View style={styles.selectionHeader}>
          <Text style={styles.selectionCount}>{selectedCount} selected</Text>
          <TouchableOpacity onPress={() => exitSelectionMode()}>
            <Text style={styles.selectionCancel}>Cancel</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.header} ref={galleryHeaderRef}>
          <Text style={styles.title}>{t('gallery.title')}</Text>
          {gallery.length > 0 && (
            <TouchableOpacity onPress={handleClearAll}>
              <Text style={styles.clearAll}>{t('gallery.clearAll')}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Search + Sort (hidden during selection mode) */}
      {gallery.length > 0 && !isSelectionMode && (
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
          <TouchableOpacity
            style={styles.sortButton}
            onPress={() => {
              const newMode = listMode === 'grid' ? 'list' : 'grid';
              setListMode(newMode);
              trackEvent('gallery_view_mode_changed', { mode: newMode });
            }}
            accessibilityLabel={listMode === 'grid' ? t('gallery.listView') : t('gallery.gridView')}
            accessibilityRole="button"
          >
            <Text style={styles.sortIcon}>
              {listMode === 'grid' ? '\u2630' : '\u229E'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Filter tabs (hidden during selection mode) */}
      {gallery.length > 0 && !isSelectionMode && (
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
          key={listMode}
          data={filteredGallery}
          keyExtractor={(item) => item.id}
          numColumns={listMode === 'grid' ? 2 : 1}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={listMode === 'grid' ? styles.gridRow : undefined}
          ListHeaderComponent={
            shouldShowSpotlight && activeFilter === 'all' ? <SpotlightCarousel /> : null
          }
          renderItem={({ item }: { item: GalleryItem }) =>
            listMode === 'list' ? (
              <SwipeableGalleryCard
                onDelete={() => {
                  trackEvent('gallery_swipe_delete');
                  handleDelete(item.id);
                }}
                onToggleFavorite={() => {
                  trackEvent('gallery_swipe_favorite');
                  toggleFavorite(item.id);
                }}
                isFavorite={favorites.includes(item.id)}
                reduceMotion={reduceMotion}
              >
                <TouchableOpacity
                  style={styles.listCard}
                  onPress={() => handleCardPress(item)}
                  onLongPress={() => handleCardLongPress(item)}
                  activeOpacity={0.8}
                  accessibilityLabel={`${item.styleName} created on ${new Date(item.createdAt).toLocaleDateString()}`}
                  accessibilityRole="button"
                  accessibilityHint="Tap to view, long press for options"
                >
                  <View>
                    <FastImage
                      source={{ uri: item.localUri, priority: FastImage.priority.normal }}
                      style={styles.listCardImage}
                      resizeMode={FastImage.resizeMode.cover}
                    />
                    {isSelectionMode && isSelected(item.id) && (
                      <View style={styles.checkmarkOverlay}>
                        <Text style={styles.checkmarkText}>{'\u2713'}</Text>
                      </View>
                    )}
                    {isSelectionMode && !isSelected(item.id) && (
                      <View style={styles.uncheckedOverlay} />
                    )}
                  </View>
                  <View style={styles.listCardInfo}>
                    <Text style={styles.cardStyle}>{item.styleName}</Text>
                    <Text style={styles.cardDate}>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  {!isSelectionMode && (
                    <TouchableOpacity
                      onPress={() => toggleFavorite(item.id)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      accessibilityLabel={isFavorite(item.id) ? 'Remove from favorites' : 'Add to favorites'}
                      accessibilityRole="button"
                    >
                      <Text style={styles.heartIcon}>
                        {isFavorite(item.id) ? '\u2764\uFE0F' : '\uD83E\uDD0D'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              </SwipeableGalleryCard>
            ) : (
              <TouchableOpacity
                style={styles.card}
                onPress={() => handleCardPress(item)}
                onLongPress={() => handleCardLongPress(item)}
                activeOpacity={0.8}
                accessibilityLabel={`${item.styleName} created on ${new Date(item.createdAt).toLocaleDateString()}`}
                accessibilityRole="button"
                accessibilityHint="Tap to view, long press for options"
              >
                <View>
                  <FastImage source={{ uri: item.localUri, priority: FastImage.priority.normal }} style={styles.cardImage} resizeMode={FastImage.resizeMode.cover} />
                  {isSelectionMode && isSelected(item.id) && (
                    <View style={styles.checkmarkOverlay}>
                      <Text style={styles.checkmarkText}>{'\u2713'}</Text>
                    </View>
                  )}
                  {isSelectionMode && !isSelected(item.id) && (
                    <View style={styles.uncheckedOverlay} />
                  )}
                  {!isSelectionMode && (
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
                  )}
                </View>
                <Text style={styles.cardStyle}>{item.styleName}</Text>
                <Text style={styles.cardDate}>
                  {new Date(item.createdAt).toLocaleDateString()}
                </Text>
              </TouchableOpacity>
            )
          }
        />
      )}

      {/* Context menu BottomSheet */}
      <BottomSheet
        visible={menuVisible}
        title={t('gallery.actions')}
        actions={contextMenuActions}
        onClose={() => setMenuVisible(false)}
      />

      {/* Sort menu BottomSheet */}
      <BottomSheet
        visible={showSortMenu}
        title={t('gallery.sortBy')}
        actions={sortMenuActions}
        onClose={() => setShowSortMenu(false)}
      />

      {/* New collection BottomSheet */}
      <BottomSheet
        visible={newCollectionVisible}
        title={t('gallery.newCollection')}
        actions={[]}
        onClose={() => setNewCollectionVisible(false)}
      >
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
      </BottomSheet>

      {/* Multi-select: collection picker BottomSheet */}
      <BottomSheet
        visible={collectionPickerVisible}
        title={t('gallery.addSelectedToCollection')}
        actions={collectionPickerActions}
        onClose={() => setCollectionPickerVisible(false)}
      />

      {/* Multi-select: selection bar */}
      {isSelectionMode && (
        <SelectionBar
          selectedCount={selectedCount}
          onDelete={handleMultiSelectDelete}
          onShare={handleMultiSelectShare}
          onAddToCollection={handleMultiSelectAddToCollection}
          onSelectAll={handleMultiSelectSelectAll}
          onCancel={() => exitSelectionMode()}
        />
      )}

      {gallery.length > 0 && !isSelectionMode && (
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
