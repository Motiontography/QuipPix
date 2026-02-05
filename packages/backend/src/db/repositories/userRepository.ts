import { getDb } from '../index';

const DEFAULT_CREDITS = 3;

export interface User {
  id: string;
  credits: number;
  createdAt: string;
}

export function createUser(id: string): void {
  const db = getDb();
  db.prepare(
    'INSERT OR IGNORE INTO users (id, credits, created_at) VALUES (?, ?, ?)',
  ).run(id, DEFAULT_CREDITS, new Date().toISOString());
}

export function getUser(id: string): User | undefined {
  const db = getDb();
  const row = db
    .prepare('SELECT id, credits, created_at FROM users WHERE id = ?')
    .get(id) as { id: string; credits: number; created_at: string } | undefined;

  if (!row) return undefined;

  return {
    id: row.id,
    credits: row.credits,
    createdAt: row.created_at,
  };
}

/**
 * Ensures user exists and returns their current credits.
 * Creates user with default credits if they don't exist.
 */
export function ensureUserAndGetCredits(id: string): number {
  createUser(id); // INSERT OR IGNORE
  const user = getUser(id);
  return user?.credits ?? DEFAULT_CREDITS;
}

/**
 * Get user's credit balance (returns 0 if user doesn't exist)
 */
export function getCredits(userId: string): number {
  const db = getDb();
  const row = db
    .prepare('SELECT credits FROM users WHERE id = ?')
    .get(userId) as { credits: number } | undefined;
  return row?.credits ?? 0;
}

/**
 * Add credits to a user's balance
 */
export function addCredits(userId: string, amount: number): number {
  const db = getDb();
  createUser(userId); // Ensure user exists
  db.prepare('UPDATE users SET credits = credits + ? WHERE id = ?').run(amount, userId);
  return getCredits(userId);
}

/**
 * Deduct one credit from user's balance.
 * Returns true if successful, false if insufficient credits.
 */
export function deductCredit(userId: string): boolean {
  const db = getDb();
  const result = db
    .prepare('UPDATE users SET credits = credits - 1 WHERE id = ? AND credits > 0')
    .run(userId);
  return result.changes > 0;
}

/**
 * Check if user has at least one credit
 */
export function hasCredits(userId: string): boolean {
  return getCredits(userId) > 0;
}

export function userExists(id: string): boolean {
  const db = getDb();
  const row = db
    .prepare('SELECT 1 FROM users WHERE id = ? LIMIT 1')
    .get(id);
  return !!row;
}
