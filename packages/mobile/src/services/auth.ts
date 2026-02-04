import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../api/client';

const AUTH_TOKEN_KEY = '@quippix/auth_token';
const USER_ID_KEY = '@quippix/user_id';

function generateUserId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function initAuth(): Promise<string> {
  // Check for existing token
  const existing = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  if (existing) {
    api.setAuthToken(existing);
    const userId = await AsyncStorage.getItem(USER_ID_KEY);
    return userId ?? '';
  }

  // Generate new user ID and register
  const userId = generateUserId();

  try {
    const response = await fetch(`${api.getBaseUrl()}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });

    if (response.ok) {
      const data = await response.json();
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, data.token);
      await AsyncStorage.setItem(USER_ID_KEY, data.userId);
      api.setAuthToken(data.token);
      return data.userId;
    }
  } catch {
    // Registration failed — continue without auth
    // Will fall back to header-based tier on the server
  }

  await AsyncStorage.setItem(USER_ID_KEY, userId);
  return userId;
}

export async function getAuthToken(): Promise<string | null> {
  return AsyncStorage.getItem(AUTH_TOKEN_KEY);
}

export async function getUserId(): Promise<string | null> {
  return AsyncStorage.getItem(USER_ID_KEY);
}

export async function refreshToken(): Promise<void> {
  const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  if (!token) return;

  try {
    const response = await fetch(`${api.getBaseUrl()}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });

    if (response.ok) {
      const data = await response.json();
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, data.token);
      api.setAuthToken(data.token);
    }
  } catch {
    // Refresh failed — keep existing token
  }
}
