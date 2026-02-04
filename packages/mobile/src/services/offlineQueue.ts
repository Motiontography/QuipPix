import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { GenerateParams } from '../types';
import { api } from '../api/client';

const QUEUE_KEY = '@quippix/offline_queue';

export interface QueueItem {
  id: string;
  imageUri: string;
  params: GenerateParams;
  createdAt: string;
}

let isProcessing = false;

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export async function queueGeneration(
  imageUri: string,
  params: GenerateParams,
): Promise<string> {
  const id = generateId();
  const item: QueueItem = {
    id,
    imageUri,
    params,
    createdAt: new Date().toISOString(),
  };

  const existing = await getQueuedItems();
  existing.push(item);
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(existing));

  return id;
}

export async function getQueuedItems(): Promise<QueueItem[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function getQueueCount(): Promise<number> {
  const items = await getQueuedItems();
  return items.length;
}

export async function removeFromQueue(id: string): Promise<void> {
  const items = await getQueuedItems();
  const updated = items.filter((item) => item.id !== id);
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(updated));
}

export async function processQueue(): Promise<void> {
  if (isProcessing) return;
  isProcessing = true;

  try {
    const items = await getQueuedItems();
    if (items.length === 0) return;

    for (const item of items) {
      try {
        await api.generate(item.imageUri, item.params);
        await removeFromQueue(item.id);
      } catch {
        // Leave in queue for next retry
        break;
      }
    }
  } finally {
    isProcessing = false;
  }
}

export function initOfflineQueue(): () => void {
  let wasDisconnected = false;

  const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
    const isConnected = state.isConnected ?? false;

    if (isConnected && wasDisconnected) {
      processQueue();
    }

    wasDisconnected = !isConnected;
  });

  return unsubscribe;
}
