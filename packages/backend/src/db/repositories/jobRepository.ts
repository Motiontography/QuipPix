import { getDb } from '../index';
import { JobStatus, JobStatusResponse } from '../../types';

interface JobRow {
  id: string;
  status: string;
  progress: number;
  result_key: string | null;
  input_key: string;
  error: string | null;
  created_at: string;
}

export function createJob(jobId: string, inputKey: string): void {
  const db = getDb();
  db.prepare(
    'INSERT INTO jobs (id, status, progress, input_key, created_at) VALUES (?, ?, ?, ?, ?)',
  ).run(jobId, 'queued', 0, inputKey, new Date().toISOString());
}

export function getJobEntry(jobId: string): JobRow | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId) as JobRow | undefined;
}

export function updateJobStatus(jobId: string, status: JobStatus, progress: number, error?: string): void {
  const db = getDb();
  db.prepare(
    'UPDATE jobs SET status = ?, progress = ?, error = ? WHERE id = ?',
  ).run(status, progress, error ?? null, jobId);
}

export function updateJobProgress(jobId: string, progress: number): void {
  const db = getDb();
  db.prepare('UPDATE jobs SET progress = ? WHERE id = ?').run(progress, jobId);
}

export function setJobResultKey(jobId: string, resultKey: string): void {
  const db = getDb();
  db.prepare('UPDATE jobs SET result_key = ? WHERE id = ?').run(resultKey, jobId);
}

export function getJobStatus(jobId: string): JobStatusResponse | null {
  const entry = getJobEntry(jobId);
  if (!entry) return null;
  return {
    jobId,
    status: entry.status as JobStatus,
    progress: entry.progress,
    error: entry.error ?? undefined,
    createdAt: entry.created_at,
  };
}

export function getJobResultKey(jobId: string): string | undefined {
  const entry = getJobEntry(jobId);
  return entry?.result_key ?? undefined;
}

export function getJobInputKey(jobId: string): string | undefined {
  const entry = getJobEntry(jobId);
  return entry?.input_key;
}

export function deleteJobRecord(jobId: string): boolean {
  const db = getDb();
  const result = db.prepare('DELETE FROM jobs WHERE id = ?').run(jobId);
  return result.changes > 0;
}

// ─── Batch operations ────────────────────────────────────────────────

export function createBatch(batchId: string, jobIds: string[]): void {
  const db = getDb();
  const insertBatch = db.prepare('INSERT INTO batches (id, created_at) VALUES (?, ?)');
  const insertBatchJob = db.prepare(
    'INSERT INTO batch_jobs (batch_id, job_id, position) VALUES (?, ?, ?)',
  );

  const transaction = db.transaction(() => {
    insertBatch.run(batchId, new Date().toISOString());
    jobIds.forEach((jobId, index) => {
      insertBatchJob.run(batchId, jobId, index);
    });
  });
  transaction();
}

export function getBatchJobIds(batchId: string): string[] | undefined {
  const db = getDb();
  const batch = db.prepare('SELECT id FROM batches WHERE id = ?').get(batchId) as
    | { id: string }
    | undefined;
  if (!batch) return undefined;

  const rows = db
    .prepare('SELECT job_id FROM batch_jobs WHERE batch_id = ? ORDER BY position')
    .all(batchId) as { job_id: string }[];

  return rows.map((r) => r.job_id);
}

export function getBatchCreatedAt(batchId: string): string | undefined {
  const db = getDb();
  const row = db.prepare('SELECT created_at FROM batches WHERE id = ?').get(batchId) as
    | { created_at: string }
    | undefined;
  return row?.created_at;
}
