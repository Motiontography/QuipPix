import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Entitlement } from '../services/purchases';
import { getEntitlement } from '../services/purchases';
import { api } from '../api/client';

const PRO_STORAGE_KEY = '@quippix/pro';

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

interface ProState {
  // Entitlement
  entitlement: Entitlement;
  setEntitlement: (ent: Entitlement) => void;
  refreshEntitlement: () => Promise<void>;

  // Daily generation limit (client-side)
  dailyGenerations: number;
  dailyDate: string;
  incrementDailyGenerations: () => void;
  isDailyLimitReached: () => boolean;

  // Soft upsell tracking
  successfulGenerations: number;
  softUpsellDismissed: boolean;
  incrementSuccessfulGenerations: () => void;
  shouldShowSoftUpsell: () => boolean;
  dismissSoftUpsell: () => void;

  // Persistence
  loadProState: () => Promise<void>;
}

const DAILY_LIMIT = 5;

export const useProStore = create<ProState>((set, get) => ({
  entitlement: { proActive: false, proType: null, expiresAt: null },

  setEntitlement: (ent: Entitlement) => {
    set({ entitlement: ent });
    api.setTier(ent.proActive ? 'pro' : 'free');
    persist(get());
  },

  refreshEntitlement: async () => {
    const ent = await getEntitlement();
    set({ entitlement: ent });
    api.setTier(ent.proActive ? 'pro' : 'free');
    persist(get());
  },

  dailyGenerations: 0,
  dailyDate: getToday(),

  incrementDailyGenerations: () => {
    const state = get();
    const today = getToday();
    if (state.dailyDate !== today) {
      set({ dailyGenerations: 1, dailyDate: today });
    } else {
      set({ dailyGenerations: state.dailyGenerations + 1 });
    }
    persist(get());
  },

  isDailyLimitReached: () => {
    const state = get();
    if (state.entitlement.proActive) return false;
    const today = getToday();
    if (state.dailyDate !== today) return false;
    return state.dailyGenerations >= DAILY_LIMIT;
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
      !state.entitlement.proActive &&
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
        const today = getToday();
        set({
          dailyGenerations: parsed.dailyDate === today ? (parsed.dailyGenerations ?? 0) : 0,
          dailyDate: parsed.dailyDate === today ? today : today,
          successfulGenerations: parsed.successfulGenerations ?? 0,
          softUpsellDismissed: parsed.softUpsellDismissed ?? false,
        });
      }
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
        dailyGenerations: state.dailyGenerations,
        dailyDate: state.dailyDate,
        successfulGenerations: state.successfulGenerations,
        softUpsellDismissed: state.softUpsellDismissed,
      }),
    );
  } catch {
    // Ignore
  }
}
