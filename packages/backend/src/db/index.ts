import Database from 'better-sqlite3';
import { config } from '../config';
import { logger } from '../utils/logger';
import path from 'path';
import fs from 'fs';

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDb() first.');
  }
  return db;
}

export function initDb(dbPath?: string): Database.Database {
  const resolvedPath = dbPath ?? config.db.path;

  // Ensure directory exists (skip for :memory:)
  if (resolvedPath !== ':memory:') {
    const dir = path.dirname(resolvedPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  db = new Database(resolvedPath);

  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  runMigrations(db);
  logger.info({ path: resolvedPath }, 'Database initialized');
  return db;
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}

function runMigrations(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      status TEXT NOT NULL DEFAULT 'queued',
      progress REAL NOT NULL DEFAULT 0,
      result_key TEXT,
      input_key TEXT NOT NULL,
      error TEXT,
      user_id TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON jobs(user_id);

    CREATE TABLE IF NOT EXISTS batches (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS batch_jobs (
      batch_id TEXT NOT NULL,
      job_id TEXT NOT NULL,
      position INTEGER NOT NULL,
      PRIMARY KEY (batch_id, job_id),
      FOREIGN KEY (batch_id) REFERENCES batches(id)
    );

    CREATE TABLE IF NOT EXISTS challenge_submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      challenge_id TEXT NOT NULL,
      job_id TEXT NOT NULL,
      submitted_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_challenge_submissions_challenge_id
      ON challenge_submissions(challenge_id);

    CREATE TABLE IF NOT EXISTS remix_records (
      code TEXT PRIMARY KEY,
      template TEXT NOT NULL,
      created_at TEXT NOT NULL,
      views INTEGER NOT NULL DEFAULT 0,
      expires_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_remix_records_expires_at
      ON remix_records(expires_at);

    CREATE TABLE IF NOT EXISTS user_entitlements (
      app_user_id TEXT PRIMARY KEY,
      pro_active INTEGER NOT NULL DEFAULT 0,
      pro_type TEXT,
      expires_at TEXT,
      verified_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS device_tokens (
      device_id TEXT PRIMARY KEY,
      app_user_id TEXT NOT NULL,
      platform TEXT NOT NULL CHECK(platform IN ('ios', 'android')),
      push_token TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_device_tokens_app_user_id
      ON device_tokens(app_user_id);

    CREATE TABLE IF NOT EXISTS analytics_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event TEXT NOT NULL,
      properties TEXT,
      timestamp TEXT NOT NULL,
      received_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_analytics_events_event
      ON analytics_events(event);

    CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp
      ON analytics_events(timestamp);
  `);
}
