import fs from 'fs';
import path from 'path';
import { config } from '../config';
import { logger } from '../utils/logger';
import { v4 as uuid } from 'uuid';

// Use the same data directory as the database (Railway volume: /app/data)
const DB_DIR = path.dirname(path.resolve(config.db.path));
const STORAGE_DIR = process.env.STORAGE_PATH || path.join(DB_DIR, 'storage');

// Ensure storage directories exist on startup
for (const sub of ['inputs', 'results']) {
  const dir = path.join(STORAGE_DIR, sub);
  fs.mkdirSync(dir, { recursive: true });
}

// Public base URL for serving files
function getPublicBase(): string {
  const domain = process.env.RAILWAY_PUBLIC_DOMAIN;
  if (domain) return `https://${domain}`;
  return `http://localhost:${config.server.port}`;
}

export async function uploadInput(imageBuffer: Buffer): Promise<string> {
  const key = `inputs/${uuid()}.png`;
  const filePath = path.join(STORAGE_DIR, key);
  fs.writeFileSync(filePath, imageBuffer);
  logger.debug({ key }, 'Uploaded input image');
  return key;
}

export async function uploadResult(imageBuffer: Buffer, jobId: string): Promise<string> {
  const key = `results/${jobId}.png`;
  const filePath = path.join(STORAGE_DIR, key);
  fs.writeFileSync(filePath, imageBuffer);
  logger.debug({ key }, 'Uploaded result image');
  return key;
}

export async function getSignedDownloadUrl(key: string): Promise<string> {
  return `${getPublicBase()}/files/${key}`;
}

export async function deleteObject(key: string): Promise<void> {
  const filePath = path.join(STORAGE_DIR, key);
  try {
    fs.unlinkSync(filePath);
    logger.debug({ key }, 'Deleted file');
  } catch (err: any) {
    if (err.code !== 'ENOENT') throw err;
  }
}

export async function getObjectBuffer(key: string): Promise<Buffer> {
  const filePath = path.join(STORAGE_DIR, key);
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${key}`);
  }
  return fs.readFileSync(filePath);
}

/**
 * Resolve an absolute path for a storage key (used by the file-serving route).
 */
export function resolveStoragePath(key: string): string | null {
  // Prevent path traversal
  const resolved = path.resolve(STORAGE_DIR, key);
  if (!resolved.startsWith(path.resolve(STORAGE_DIR))) return null;
  if (!fs.existsSync(resolved)) return null;
  return resolved;
}

/**
 * TTL cleanup: delete files older than the configured TTL.
 */
export async function cleanupExpired(): Promise<number> {
  let deleted = 0;
  const now = Date.now();
  const ttlMs = config.storage.ttlSeconds * 1000;

  for (const sub of ['inputs', 'results']) {
    const dir = path.join(STORAGE_DIR, sub);
    if (!fs.existsSync(dir)) continue;

    for (const file of fs.readdirSync(dir)) {
      const filePath = path.join(dir, file);
      try {
        const stat = fs.statSync(filePath);
        if (now - stat.mtimeMs > ttlMs) {
          fs.unlinkSync(filePath);
          deleted++;
        }
      } catch {
        // File may have been deleted concurrently
      }
    }
  }

  logger.info({ deleted }, 'TTL cleanup completed');
  return deleted;
}
