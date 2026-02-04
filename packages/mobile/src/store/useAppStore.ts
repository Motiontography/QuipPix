import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  GalleryItem,
  CommonSliders,
  Toggles,
  StyleSpecificOptions,
  Collection,
} from '../types';
import { nanoid } from '../utils/id';
import { deleteCachedImage, clearImageCache } from '../services/imageCache';

interface AppState {
  // Gallery
  gallery: GalleryItem[];
  addToGallery: (item: GalleryItem) => void;
  removeFromGallery: (id: string) => void;
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
}));
