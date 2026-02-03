import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChallengeCompletion } from '../types';

const CHALLENGE_KEY = '@quippix/challenges';

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

function getYesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

interface ChallengeState {
  completions: ChallengeCompletion[];
  currentStreak: number;
  longestStreak: number;

  // Actions
  addCompletion: (completion: ChallengeCompletion) => void;
  hasCompletedToday: () => boolean;
  getCompletionForDate: (date: string) => ChallengeCompletion | undefined;
  loadChallengeState: () => Promise<void>;
}

export const useChallengeStore = create<ChallengeState>((set, get) => ({
  completions: [],
  currentStreak: 0,
  longestStreak: 0,

  addCompletion: async (completion: ChallengeCompletion) => {
    const existing = get().completions;
    // Don't duplicate completions for the same challenge
    if (existing.some((c) => c.challengeId === completion.challengeId)) return;

    const updated = [completion, ...existing];
    const { current, longest } = computeStreak(updated);

    set({
      completions: updated,
      currentStreak: current,
      longestStreak: longest,
    });

    await persist(updated);
  },

  hasCompletedToday: () => {
    const today = getToday();
    return get().completions.some((c) => c.date === today);
  },

  getCompletionForDate: (date: string) => {
    return get().completions.find((c) => c.date === date);
  },

  loadChallengeState: async () => {
    try {
      const raw = await AsyncStorage.getItem(CHALLENGE_KEY);
      if (raw) {
        const completions: ChallengeCompletion[] = JSON.parse(raw);
        const { current, longest } = computeStreak(completions);
        set({ completions, currentStreak: current, longestStreak: longest });
      }
    } catch {
      // Ignore parse errors
    }
  },
}));

function computeStreak(completions: ChallengeCompletion[]): {
  current: number;
  longest: number;
} {
  if (completions.length === 0) return { current: 0, longest: 0 };

  // Get unique completion dates, sorted descending
  const dates = [...new Set(completions.map((c) => c.date))].sort().reverse();

  const today = getToday();
  const yesterday = getYesterday();

  // Current streak: count consecutive days ending today or yesterday
  let current = 0;
  const startDate = dates[0] === today || dates[0] === yesterday ? dates[0] : null;

  if (startDate) {
    const d = new Date(startDate + 'T00:00:00Z');
    for (const date of dates) {
      const expected = d.toISOString().split('T')[0];
      if (date === expected) {
        current++;
        d.setUTCDate(d.getUTCDate() - 1);
      } else {
        break;
      }
    }
  }

  // Longest streak: scan all dates
  let longest = 0;
  let streak = 1;
  const sortedAsc = [...dates].reverse();

  for (let i = 1; i < sortedAsc.length; i++) {
    const prev = new Date(sortedAsc[i - 1] + 'T00:00:00Z');
    const curr = new Date(sortedAsc[i] + 'T00:00:00Z');
    const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays === 1) {
      streak++;
    } else {
      longest = Math.max(longest, streak);
      streak = 1;
    }
  }
  longest = Math.max(longest, streak, current);

  return { current, longest };
}

async function persist(completions: ChallengeCompletion[]): Promise<void> {
  try {
    // Keep last 90 days of completions
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);
    const cutoffStr = cutoff.toISOString().split('T')[0];
    const trimmed = completions.filter((c) => c.date >= cutoffStr);
    await AsyncStorage.setItem(CHALLENGE_KEY, JSON.stringify(trimmed));
  } catch {
    // Ignore
  }
}
