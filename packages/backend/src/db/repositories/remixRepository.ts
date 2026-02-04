import { getDb } from '../index';
import { RemixRecord } from '../../types';
import { config } from '../../config';

export function createRemixRecord(
  code: string,
  template: RemixRecord['template'],
): RemixRecord {
  const db = getDb();
  const createdAt = new Date().toISOString();
  const expiresAt = new Date(
    Date.now() + config.remix.codeTtlDays * 24 * 60 * 60 * 1000,
  ).toISOString();

  db.prepare(
    'INSERT INTO remix_records (code, template, created_at, views, expires_at) VALUES (?, ?, ?, ?, ?)',
  ).run(code, JSON.stringify(template), createdAt, 0, expiresAt);

  return { code, template, createdAt, views: 0 };
}

export function getRemixRecord(code: string): RemixRecord | undefined {
  const db = getDb();
  const row = db
    .prepare(
      "SELECT code, template, created_at, views FROM remix_records WHERE code = ? AND expires_at > datetime('now')",
    )
    .get(code) as
    | { code: string; template: string; created_at: string; views: number }
    | undefined;

  if (!row) return undefined;

  return {
    code: row.code,
    template: JSON.parse(row.template),
    createdAt: row.created_at,
    views: row.views,
  };
}

export function incrementRemixViews(code: string): void {
  const db = getDb();
  db.prepare('UPDATE remix_records SET views = views + 1 WHERE code = ?').run(code);
}

export function codeExists(code: string): boolean {
  const db = getDb();
  const row = db.prepare('SELECT 1 FROM remix_records WHERE code = ?').get(code);
  return !!row;
}

export function getRemixStoreSize(): number {
  const db = getDb();
  const row = db
    .prepare(
      "SELECT COUNT(*) as count FROM remix_records WHERE expires_at > datetime('now')",
    )
    .get() as { count: number };
  return row.count;
}

export function cleanupExpiredRemixes(): number {
  const db = getDb();
  const result = db
    .prepare("DELETE FROM remix_records WHERE expires_at <= datetime('now')")
    .run();
  return result.changes;
}
