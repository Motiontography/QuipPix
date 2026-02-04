import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  GalleryItem,
  CommonSliders,
  Toggles,
  StyleSpecificOptions,
  Collection,
  StyleId,
  Preset,
  ExportOptions,
} from '../types';
import { nanoid } from '../utils/id';
import { deleteCachedImage, clearImageCache } from '../services/imageCache';

interface AppState {
  // Gallery
  gallery: GalleryItem[];
  addToGallery: (item: GalleryItem) => void;
  removeFromGallery: (id: string) => void;
  removeMultipleFromGallery: (ids: string[]) => void;
  clearGallery: () => void;
  loadGallery: () => Promise<void>;

  // Favorites
  favorites: string[];
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;

  // Collections
  collections: Collection[];
  addCollection: (name: string) => void;
  removeCollection: (id: string) => void;
  renameCollection: (id: string, name: string) => void;
  addToCollection: (collectionId: string, itemId: string) => void;
  removeFromCollection: (collectionId: string, itemId: string) => void;

  // Session tracking (for interstitial rate-limiting)
  hasShownInterstitial: boolean;
  setInterstitialShown: () => void;

  // Creation count (for Motiontography spotlight)
  creationCount: number;
  incrementCreationCount: () => void;

  // Watermark preference
  watermarkEnabled: boolean;
  setWatermarkEnabled: (enabled: boolean) => void;

  // Last used settings (for quick re-generation)
  lastSliders: CommonSliders;
  lastToggles: Toggles;
  lastStyleOptions: StyleSpecificOptions | undefined;
  saveLastSettings: (
    sliders: CommonSliders,
    toggles: Toggles,
    options?: StyleSpecificOptions,
  ) => void;

  // Onboarding
  hasSeenOnboarding: boolean;
  setOnboardingComplete: () => void;

  // Theme
  themeMode: 'system' | 'light' | 'dark';
  setThemeMode: (mode: 'system' | 'light' | 'dark') => void;

  // Style Favorites & Recents
  favoriteStyles: StyleId[];
  recentStyles: StyleId[];
  toggleFavoriteStyle: (id: StyleId) => void;
  isStyleFavorite: (id: StyleId) => boolean;
  addRecentStyle: (id: StyleId) => void;

  // Presets
  presets: Preset[];
  addPreset: (name: string, sliders: CommonSliders, toggles: Toggles, styleOptions?: StyleSpecificOptions) => void;
  removePreset: (id: string) => void;
  renamePreset: (id: string, name: string) => void;

  // Coach Marks
  dismissedCoachMarks: string[];
  dismissCoachMark: (markId: string) => void;
  hasSeenCoachMark: (markId: string) => boolean;

  // Reduce Motion
  reduceMotionOverride: boolean | null;
  setReduceMotionOverride: (value: boolean | null) => void;

  // Export Preferences
  lastExportOptions: ExportOptions | null;
  setLastExportOptions: (options: ExportOptions) => void;

  // Gallery Selectors
  getGalleryItemsBySource: (sourceUri: string) => GalleryItem[];
  getGalleryItem: (id: string) => GalleryItem | undefined;
}

const DEFAULT_SLIDERS: CommonSliders = {
  intensity: 50,
  faceFidelity: 70,
  backgroundStrength: 50,
  colorMood: 'warm',
  detail: 50,
};

const DEFAULT_TOGGLES: Toggles = {
  keepIdentity: true,
  preserveSkinTone: true,
};

const GALLERY_KEY = '@quippix/gallery';
const PREFS_KEY = '@quippix/prefs';
const FAVORITES_KEY = '@quippix/favorites';
const COLLECTIONS_KEY = '@quippix/collections';
const ONBOARDING_KEY = '@quippix/onboarding';
const THEME_KEY = '@quippix/theme';
const FAVORITE_STYLES_KEY = '@quippix/favoriteStyles';
const RECENT_STYLES_KEY = '@quippix/recentStyles';
const PRESETS_KEY = '@quippix/presets';
const COACH_MARKS_KEY = '@quippix/coachMarks';
const REDUCE_MOTION_KEY = '@quippix/reduceMotion';
const EXPORT_PREFS_KEY = '@quippix/exportPrefs';

export const useAppStore = create<AppState>((set, get) => ({
  // Gallery
  gallery: [],

  addToGallery: async (item: GalleryItem) => {
    const updated = [item, ...get().gallery];
    set({ gallery: updated });
    await AsyncStorage.setItem(GALLERY_KEY, JSON.stringify(updated));
  },

  removeFromGallery: async (id: string) => {
    deleteCachedImage(id).catch(() => {});
    const updated = get().gallery.filter((g) => g.id !== id);
    const updatedFavorites = get().favorites.filter((fid) => fid !== id);
    const updatedCollections = get().collections.map((c) => ({
      ...c,
      itemIds: c.itemIds.filter((iid) => iid !== id),
    }));
    set({ gallery: updated, favorites: updatedFavorites, collections: updatedCollections });
    await AsyncStorage.setItem(GALLERY_KEY, JSON.stringify(updated));
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updatedFavorites));
    await AsyncStorage.setItem(COLLECTIONS_KEY, JSON.stringify(updatedCollections));
  },

  removeMultipleFromGallery: async (ids: string[]) => {
    const idSet = new Set(ids);
    ids.forEach((id) => deleteCachedImage(id).catch(() => {}));
    const updated = get().gallery.filter((g) => !idSet.has(g.id));
    const updatedFavorites = get().favorites.filter((fid) => !idSet.has(fid));
    const updatedCollections = get().collections.map((c) => ({
      ...c,
      itemIds: c.itemIds.filter((iid) => !idSet.has(iid)),
    }));
    set({ gallery: updated, favorites: updatedFavorites, collections: updatedCollections });
    await AsyncStorage.setItem(GALLERY_KEY, JSON.stringify(updated));
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updatedFavorites));
    await AsyncStorage.setItem(COLLECTIONS_KEY, JSON.stringify(updatedCollections));
  },

  clearGallery: async () => {
    clearImageCache().catch(() => {});
    set({ gallery: [], favorites: [], collections: [] });
    await AsyncStorage.removeItem(GALLERY_KEY);
    await AsyncStorage.removeItem(FAVORITES_KEY);
    await AsyncStorage.removeItem(COLLECTIONS_KEY);
  },

  loadGallery: async () => {
    try {
      const raw = await AsyncStorage.getItem(GALLERY_KEY);
      if (raw) {
        set({ gallery: JSON.parse(raw) });
      }
    } catch {
      // Ignore parse errors
    }

    try {
      const prefs = await AsyncStorage.getItem(PREFS_KEY);
      if (prefs) {
        const parsed = JSON.parse(prefs);
        set({
          watermarkEnabled: parsed.watermarkEnabled ?? false,
          creationCount: parsed.creationCount ?? 0,
        });
      }
    } catch {
      // Ignore
    }

    try {
      const favRaw = await AsyncStorage.getItem(FAVORITES_KEY);
      if (favRaw) {
        set({ favorites: JSON.parse(favRaw) });
      }
    } catch {
      // Ignore
    }

    try {
      const colRaw = await AsyncStorage.getItem(COLLECTIONS_KEY);
      if (colRaw) {
        set({ collections: JSON.parse(colRaw) });
      }
    } catch {
      // Ignore
    }

    try {
      const onboarding = await AsyncStorage.getItem(ONBOARDING_KEY);
      if (onboarding === 'true') {
        set({ hasSeenOnboarding: true });
      }
    } catch {
      // Ignore
    }

    try {
      const theme = await AsyncStorage.getItem(THEME_KEY);
      if (theme === 'light' || theme === 'dark' || theme === 'system') {
        set({ themeMode: theme });
      }
    } catch {
      // Ignore
    }

    try {
      const favStyles = await AsyncStorage.getItem(FAVORITE_STYLES_KEY);
      if (favStyles) {
        set({ favoriteStyles: JSON.parse(favStyles) });
      }
    } catch {
      // Ignore
    }

    try {
      const recStyles = await AsyncStorage.getItem(RECENT_STYLES_KEY);
      if (recStyles) {
        set({ recentStyles: JSON.parse(recStyles) });
      }
    } catch {
      // Ignore
    }

    try {
      const presetsRaw = await AsyncStorage.getItem(PRESETS_KEY);
      if (presetsRaw) {
        set({ presets: JSON.parse(presetsRaw) });
      }
    } catch {
      // Ignore
    }

    try {
      const coachMarks = await AsyncStorage.getItem(COACH_MARKS_KEY);
      if (coachMarks) {
        set({ dismissedCoachMarks: JSON.parse(coachMarks) });
      }
    } catch {
      // Ignore
    }

    try {
      const rmRaw = await AsyncStorage.getItem(REDUCE_MOTION_KEY);
      if (rmRaw !== null) {
        set({ reduceMotionOverride: JSON.parse(rmRaw) });
      }
    } catch {
      // Ignore
    }

    try {
      const exportRaw = await AsyncStorage.getItem(EXPORT_PREFS_KEY);
      if (exportRaw) {
        set({ lastExportOptions: JSON.parse(exportRaw) });
      }
    } catch {
      // Ignore
    }
  },

  // Favorites
  favorites: [],

  toggleFavorite: async (id: string) => {
    const current = get().favorites;
    const updated = current.includes(id)
      ? current.filter((fid) => fid !== id)
      : [...current, id];
    set({ favorites: updated });
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
  },

  isFavorite: (id: string) => {
    return get().favorites.includes(id);
  },

  // Collections
  collections: [],

  addCollection: async (name: string) => {
    const newCollection: Collection = {
      id: nanoid(),
      name,
      itemIds: [],
      createdAt: new Date().toISOString(),
    };
    const updated = [...get().collections, newCollection];
    set({ collections: updated });
    await AsyncStorage.setItem(COLLECTIONS_KEY, JSON.stringify(updated));
  },

  removeCollection: async (id: string) => {
    const updated = get().collections.filter((c) => c.id !== id);
    set({ collections: updated });
    await AsyncStorage.setItem(COLLECTIONS_KEY, JSON.stringify(updated));
  },

  renameCollection: async (id: string, name: string) => {
    const updated = get().collections.map((c) =>
      c.id === id ? { ...c, name } : c,
    );
    set({ collections: updated });
    await AsyncStorage.setItem(COLLECTIONS_KEY, JSON.stringify(updated));
  },

  addToCollection: async (collectionId: string, itemId: string) => {
    const updated = get().collections.map((c) =>
      c.id === collectionId && !c.itemIds.includes(itemId)
        ? { ...c, itemIds: [...c.itemIds, itemId] }
        : c,
    );
    set({ collections: updated });
    await AsyncStorage.setItem(COLLECTIONS_KEY, JSON.stringify(updated));
  },

  removeFromCollection: async (collectionId: string, itemId: string) => {
    const updated = get().collections.map((c) =>
      c.id === collectionId
        ? { ...c, itemIds: c.itemIds.filter((i) => i !== itemId) }
        : c,
    );
    set({ collections: updated });
    await AsyncStorage.setItem(COLLECTIONS_KEY, JSON.stringify(updated));
  },

  // Interstitial
  hasShownInterstitial: false,
  setInterstitialShown: () => set({ hasShownInterstitial: true }),

  // Creations
  creationCount: 0,
  incrementCreationCount: async () => {
    const newCount = get().creationCount + 1;
    set({ creationCount: newCount });
    const prefs = {
      watermarkEnabled: get().watermarkEnabled,
      creationCount: newCount,
    };
    await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  },

  // Watermark
  watermarkEnabled: false,
  setWatermarkEnabled: async (enabled: boolean) => {
    set({ watermarkEnabled: enabled });
    const prefs = {
      watermarkEnabled: enabled,
      creationCount: get().creationCount,
      watermarkExplicitlySet: true,
    };
    await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  },

  // Last settings
  lastSliders: DEFAULT_SLIDERS,
  lastToggles: DEFAULT_TOGGLES,
  lastStyleOptions: undefined,
  saveLastSettings: (sliders, toggles, options) => {
    set({
      lastSliders: sliders,
      lastToggles: toggles,
      lastStyleOptions: options,
    });
  },

  // Onboarding
  hasSeenOnboarding: false,
  setOnboardingComplete: async () => {
    set({ hasSeenOnboarding: true });
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
  },

  // Theme
  themeMode: 'dark',
  setThemeMode: async (mode: 'system' | 'light' | 'dark') => {
    set({ themeMode: mode });
    await AsyncStorage.setItem(THEME_KEY, mode);
  },

  // Style Favorites
  favoriteStyles: [],
  recentStyles: [],

  toggleFavoriteStyle: async (id: StyleId) => {
    const current = get().favoriteStyles;
    const updated = current.includes(id)
      ? current.filter((sid) => sid !== id)
      : [...current, id];
    set({ favoriteStyles: updated });
    await AsyncStorage.setItem(FAVORITE_STYLES_KEY, JSON.stringify(updated));
  },

  isStyleFavorite: (id: StyleId) => {
    return get().favoriteStyles.includes(id);
  },

  addRecentStyle: async (id: StyleId) => {
    const current = get().recentStyles.filter((sid) => sid !== id);
    const updated = [id, ...current].slice(0, 6);
    set({ recentStyles: updated });
    await AsyncStorage.setItem(RECENT_STYLES_KEY, JSON.stringify(updated));
  },

  // Presets
  presets: [],

  addPreset: async (name, sliders, toggles, styleOptions) => {
    const current = get().presets;
    if (current.length >= 20) return;
    const newPreset: Preset = {
      id: nanoid(),
      name,
      sliders: { ...sliders },
      toggles: { ...toggles },
      styleOptions,
      createdAt: new Date().toISOString(),
    };
    const updated = [...current, newPreset];
    set({ presets: updated });
    await AsyncStorage.setItem(PRESETS_KEY, JSON.stringify(updated));
  },

  removePreset: async (id: string) => {
    const updated = get().presets.filter((p) => p.id !== id);
    set({ presets: updated });
    await AsyncStorage.setItem(PRESETS_KEY, JSON.stringify(updated));
  },

  renamePreset: async (id: string, name: string) => {
    const updated = get().presets.map((p) =>
      p.id === id ? { ...p, name } : p,
    );
    set({ presets: updated });
    await AsyncStorage.setItem(PRESETS_KEY, JSON.stringify(updated));
  },

  // Coach Marks
  dismissedCoachMarks: [],

  dismissCoachMark: async (markId: string) => {
    const current = get().dismissedCoachMarks;
    if (current.includes(markId)) return;
    const updated = [...current, markId];
    set({ dismissedCoachMarks: updated });
    await AsyncStorage.setItem(COACH_MARKS_KEY, JSON.stringify(updated));
  },

  hasSeenCoachMark: (markId: string) => {
    return get().dismissedCoachMarks.includes(markId);
  },

  // Reduce Motion
  reduceMotionOverride: null,

  setReduceMotionOverride: async (value: boolean | null) => {
    set({ reduceMotionOverride: value });
    if (value !== null) {
      await AsyncStorage.setItem(REDUCE_MOTION_KEY, JSON.stringify(value));
    } else {
      await AsyncStorage.removeItem(REDUCE_MOTION_KEY);
    }
  },

  // Export Preferences
  lastExportOptions: null,

  setLastExportOptions: async (options: ExportOptions) => {
    set({ lastExportOptions: options });
    await AsyncStorage.setItem(EXPORT_PREFS_KEY, JSON.stringify(options));
  },

  // Gallery Selectors
  getGalleryItemsBySource: (sourceUri: string) => {
    return get().gallery.filter((item) => item.sourceImageUri === sourceUri);
  },

  getGalleryItem: (id: string) => {
    return get().gallery.find((item) => item.id === id);
  },
}));
