import AsyncStorage from '@react-native-async-storage/async-storage';
import { GenerateParams } from '../types';
import { trackEvent } from './analytics';

const RECOVERY_KEY = '@quippix/pendingGeneration';

export interface PendingGeneration {
  jobId: string;
  imageUri: string;
  params: GenerateParams;
  challengeId?: string;
  startedAt: string;
}

/**
 * Save the current generation state for recovery after crash/restart.
 */
export async function savePendingGeneration(pending: PendingGeneration): Promise<void> {
  try {
    await AsyncStorage.setItem(RECOVERY_KEY, JSON.stringify(pending));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Clear the pending generation (call on success or explicit cancel).
 */
export async function clearPendingGeneration(): Promise<void> {
  try {
    await AsyncStorage.removeItem(RECOVERY_KEY);
  } catch {
    // Ignore
  }
}

/**
 * Check if there's a pending generation from a previous session.
 * Returns null if none found or if it's too old (>10 minutes).
 */
export async function getPendingGeneration(): Promise<PendingGeneration | null> {
  try {
    const raw = await AsyncStorage.getItem(RECOVERY_KEY);
    if (!raw) return null;

    const pending: PendingGeneration = JSON.parse(raw);
    const age = Date.now() - new Date(pending.startedAt).getTime();

    // Discard if older than 10 minutes
    if (age > 10 * 60 * 1000) {
      await clearPendingGeneration();
      return null;
    }

    return pending;
  } catch {
    return null;
  }
}
