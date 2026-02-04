import { useChallengeStore } from '../store/useChallengeStore';
import { ChallengeCompletion } from '../types';

function makeCompletion(date: string, challengeId?: string): ChallengeCompletion {
  return {
    challengeId: challengeId ?? `challenge-${date}`,
    date,
    jobId: `job-${date}`,
    resultUrl: `https://example.com/${date}.png`,
    styleId: 'caricature-classic',
    completedAt: `${date}T12:00:00Z`,
  };
}

function resetStore() {
  useChallengeStore.setState({
    completions: [],
    currentStreak: 0,
    longestStreak: 0,
  });
}

describe('useChallengeStore', () => {
  beforeEach(resetStore);

  it('starts with empty state', () => {
    const state = useChallengeStore.getState();
    expect(state.completions).toEqual([]);
    expect(state.currentStreak).toBe(0);
    expect(state.longestStreak).toBe(0);
  });

  it('adds completion and computes streak', async () => {
    const today = new Date().toISOString().split('T')[0];
    await useChallengeStore.getState().addCompletion(makeCompletion(today));

    expect(useChallengeStore.getState().completions).toHaveLength(1);
    expect(useChallengeStore.getState().currentStreak).toBe(1);
  });

  it('hasCompletedToday returns true when completed', async () => {
    const today = new Date().toISOString().split('T')[0];
    await useChallengeStore.getState().addCompletion(makeCompletion(today));
    expect(useChallengeStore.getState().hasCompletedToday()).toBe(true);
  });

  it('hasCompletedToday returns false when not completed', () => {
    expect(useChallengeStore.getState().hasCompletedToday()).toBe(false);
  });

  it('deduplicates completions by challengeId', async () => {
    const today = new Date().toISOString().split('T')[0];
    const completion = makeCompletion(today, 'same-challenge');
    await useChallengeStore.getState().addCompletion(completion);
    await useChallengeStore.getState().addCompletion(completion);

    expect(useChallengeStore.getState().completions).toHaveLength(1);
  });

  it('computes streak for consecutive days', async () => {
    const today = new Date();
    const dates: string[] = [];
    for (let i = 2; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }

    for (const date of dates) {
      await useChallengeStore.getState().addCompletion(makeCompletion(date));
    }

    expect(useChallengeStore.getState().currentStreak).toBe(3);
  });

  it('streak breaks on gap', async () => {
    const today = new Date();
    // Add completion for 3 days ago and today (gap of 2 days)
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const todayStr = today.toISOString().split('T')[0];
    const threeDaysAgoStr = threeDaysAgo.toISOString().split('T')[0];

    await useChallengeStore.getState().addCompletion(makeCompletion(threeDaysAgoStr));
    await useChallengeStore.getState().addCompletion(makeCompletion(todayStr));

    expect(useChallengeStore.getState().currentStreak).toBe(1);
  });

  it('tracks longest streak', async () => {
    const today = new Date();
    // Build a 4-day streak ending yesterday, then a gap, then today
    const dates: string[] = [];
    for (let i = 5; i >= 2; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }

    for (const date of dates) {
      await useChallengeStore.getState().addCompletion(makeCompletion(date));
    }

    // longest should be 4
    expect(useChallengeStore.getState().longestStreak).toBeGreaterThanOrEqual(4);
  });

  it('getCompletionForDate returns correct item', async () => {
    const today = new Date().toISOString().split('T')[0];
    await useChallengeStore.getState().addCompletion(makeCompletion(today));

    const completion = useChallengeStore.getState().getCompletionForDate(today);
    expect(completion).toBeDefined();
    expect(completion?.date).toBe(today);

    const missing = useChallengeStore.getState().getCompletionForDate('2020-01-01');
    expect(missing).toBeUndefined();
  });
});
