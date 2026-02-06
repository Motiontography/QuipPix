import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Entitlement } from '../services/purchases';
import { api } from '../api/client';
import { useAppStore } from './useAppStore';

const PRO_STORAGE_KEY = '@quippix/pro';

interface ProState {
  // Entitlement kept as no-op for backward compat (no Pro tier anymore)
  entitlement: Entitlement;
  setEntitlement: (ent: Entitlement) => void;
  refreshEntitlement: () => Promise<void>;

  // Credits system — the only monetization gate
  credits: number;
  setCredits: (credits: number) => void;
  refreshCredits: () => Promise<void>;
  decrementCredits: () => void;
  hasCredits: () => boolean;

  // Soft upsell tracking
  successfulGenerations: number;
  softUpsellDismissed: boolean;
  incrementSuccessfulGenerations: () => void;
  shouldShowSoftUpsell: () => boolean;
  dismissSoftUpsell: () => void;

  // Persistence
  loadProState: () => Promise<void>;
}

export const useProStore = create<ProState>((set, get) => ({
  // No Pro tier — entitlement is always inactive
  entitlement: { proActive: false, proType: null, expiresAt: null },
  setEntitlement: () => {},       // no-op
  refreshEntitlement: async () => {}, // no-op

  // Credits system
  credits: 0,

  setCredits: (credits: number) => {
    set({ credits });
    persist(get());
  },

  refreshCredits: async () => {
    try {
      const { credits } = await api.getCredits();
      set({ credits });
      persist(get());
    } catch {
      // Keep existing credits on error
    }
  },

  decrementCredits: () => {
    const current = get().credits;
    if (current > 0) {
      set({ credits: current - 1 });
      persist(get());
    }
  },

  hasCredits: () => {
    // Dev mode bypasses credit check
    if (useAppStore.getState().devModeEnabled) return true;
    return get().credits > 0;
  },

  successfulGenerations: 0,
  softUpsellDismissed: false,

  incrementSuccessfulGenerations: () => {
    set({ successfulGenerations: get().successfulGenerations + 1 });
    persist(get());
  },

  shouldShowSoftUpsell: () => {
    const state = get();
    return (
      state.successfulGenerations >= 2 &&
      state.credits <= 1 &&
      !state.softUpsellDismissed
    );
  },

  dismissSoftUpsell: () => {
    set({ softUpsellDismissed: true });
    persist(get());
  },

  loadProState: async () => {
    try {
      const raw = await AsyncStorage.getItem(PRO_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        set({
          credits: parsed.credits ?? 0,
          successfulGenerations: parsed.successfulGenerations ?? 0,
          softUpsellDismissed: parsed.softUpsellDismissed ?? false,
        });
      }
      // Fetch fresh credits from server
      get().refreshCredits();
    } catch {
      // Ignore parse errors
    }
  },
}));

async function persist(state: ProState): Promise<void> {
  try {
    await AsyncStorage.setItem(
      PRO_STORAGE_KEY,
      JSON.stringify({
        credits: state.credits,
        successfulGenerations: state.successfulGenerations,
        softUpsellDismissed: state.softUpsellDismissed,
      }),
    );
  } catch {
    // Ignore
  }
}
