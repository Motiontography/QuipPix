import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  GalleryItem,
  CommonSliders,
  Toggles,
  StyleSpecificOptions,
  StyleId,
} from '../types';

interface AppState {
  // Gallery
  gallery: GalleryItem[];
  addToGallery: (item: GalleryItem) => void;
  removeFromGallery: (id: string) => void;
  clearGallery: () => void;
  loadGallery: () => Promise<void>;

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

export const useAppStore = create<AppState>((set, get) => ({
  // Gallery
  gallery: [],

  addToGallery: async (item: GalleryItem) => {
    const updated = [item, ...get().gallery];
    set({ gallery: updated });
    await AsyncStorage.setItem(GALLERY_KEY, JSON.stringify(updated));
  },

  removeFromGallery: async (id: string) => {
    const updated = get().gallery.filter((g) => g.id !== id);
    set({ gallery: updated });
    await AsyncStorage.setItem(GALLERY_KEY, JSON.stringify(updated));
  },

  clearGallery: async () => {
    set({ gallery: [] });
    await AsyncStorage.removeItem(GALLERY_KEY);
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
}));
