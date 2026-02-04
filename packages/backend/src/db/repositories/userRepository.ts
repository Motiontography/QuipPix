import { getDb } from '../index';

export interface User {
  id: string;
  createdAt: string;
}

export function createUser(id: string): void {
  const db = getDb();
  db.prepare(
    'INSERT OR IGNORE INTO users (id, created_at) VALUES (?, ?)',
  ).run(id, new Date().toISOString());
}

export function getUser(id: string): User | undefined {
  const db = getDb();
  const row = db
    .prepare('SELECT id, created_at FROM users WHERE id = ?')
    .get(id) as { id: string; created_at: string } | undefined;

  if (!row) return undefined;

  return {
    id: row.id,
    createdAt: row.created_at,
  };
}

export function userExists(id: string): boolean {
  const db = getDb();
  const row = db
    .prepare('SELECT 1 FROM users WHERE id = ? LIMIT 1')
    .get(id);
  return !!row;
}
