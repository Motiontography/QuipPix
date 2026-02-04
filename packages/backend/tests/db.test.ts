import { initDb, closeDb, getDb } from '../src/db';
import {
  createJob,
  getJobStatus,
  getJobResultKey,
  getJobInputKey,
  updateJobStatus,
  setJobResultKey,
  deleteJobRecord,
  createBatch,
  getBatchJobIds,
  getBatchCreatedAt,
} from '../src/db/repositories/jobRepository';
import {
  addSubmission,
  getSubmissionCount,
  getSubmissions,
} from '../src/db/repositories/challengeRepository';
import {
  createRemixRecord,
  getRemixRecord,
  incrementRemixViews,
  codeExists,
  getRemixStoreSize,
  cleanupExpiredRemixes,
} from '../src/db/repositories/remixRepository';
import {
  getServerEntitlement,
  setServerEntitlement,
  getEntitlementStoreSize,
} from '../src/db/repositories/entitlementRepository';

beforeAll(() => {
  initDb(':memory:');
});

afterAll(() => {
  closeDb();
});

describe('Database initialization', () => {
  it('creates all required tables', () => {
    const db = getDb();
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
      .all() as { name: string }[];
    const tableNames = tables.map((t) => t.name);

    expect(tableNames).toContain('jobs');
    expect(tableNames).toContain('batches');
    expect(tableNames).toContain('batch_jobs');
    expect(tableNames).toContain('challenge_submissions');
    expect(tableNames).toContain('remix_records');
    expect(tableNames).toContain('user_entitlements');
  });

  it('creates indexes', () => {
    const db = getDb();
    const indexes = db
      .prepare("SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%'")
      .all() as { name: string }[];
    const indexNames = indexes.map((i) => i.name);

    expect(indexNames).toContain('idx_challenge_submissions_challenge_id');
    expect(indexNames).toContain('idx_remix_records_expires_at');
  });
});

describe('Job repository', () => {
  it('creates and retrieves a job', () => {
    createJob('job-db-1', 'input/test.png');
    const status = getJobStatus('job-db-1');

    expect(status).not.toBeNull();
    expect(status!.jobId).toBe('job-db-1');
    expect(status!.status).toBe('queued');
    expect(status!.progress).toBe(0);
  });

  it('updates job status', () => {
    createJob('job-db-2', 'input/test2.png');
    updateJobStatus('job-db-2', 'running', 50);

    const status = getJobStatus('job-db-2');
    expect(status!.status).toBe('running');
    expect(status!.progress).toBe(50);
  });

  it('sets and retrieves result key', () => {
    createJob('job-db-3', 'input/test3.png');
    setJobResultKey('job-db-3', 'results/job-db-3.png');

    expect(getJobResultKey('job-db-3')).toBe('results/job-db-3.png');
  });

  it('retrieves input key', () => {
    createJob('job-db-4', 'input/original.png');
    expect(getJobInputKey('job-db-4')).toBe('input/original.png');
  });

  it('deletes a job record', () => {
    createJob('job-db-5', 'input/delete-me.png');
    expect(deleteJobRecord('job-db-5')).toBe(true);
    expect(getJobStatus('job-db-5')).toBeNull();
  });

  it('returns false for deleting nonexistent job', () => {
    expect(deleteJobRecord('nonexistent-job')).toBe(false);
  });

  it('returns null for unknown job', () => {
    expect(getJobStatus('unknown-job')).toBeNull();
  });

  it('stores error on failure', () => {
    createJob('job-db-6', 'input/fail.png');
    updateJobStatus('job-db-6', 'failed', 100, 'Moderation rejected');

    const status = getJobStatus('job-db-6');
    expect(status!.status).toBe('failed');
    expect(status!.error).toBe('Moderation rejected');
  });
});

describe('Batch repository', () => {
  it('creates and retrieves a batch', () => {
    createJob('batch-j1', 'in/1.png');
    createJob('batch-j2', 'in/2.png');
    createJob('batch-j3', 'in/3.png');

    createBatch('batch-db-1', ['batch-j1', 'batch-j2', 'batch-j3']);

    const jobIds = getBatchJobIds('batch-db-1');
    expect(jobIds).toEqual(['batch-j1', 'batch-j2', 'batch-j3']);
  });

  it('returns batch createdAt', () => {
    expect(getBatchCreatedAt('batch-db-1')).toBeDefined();
  });

  it('returns undefined for unknown batch', () => {
    expect(getBatchJobIds('no-batch')).toBeUndefined();
    expect(getBatchCreatedAt('no-batch')).toBeUndefined();
  });

  it('preserves job order', () => {
    createJob('order-1', 'in/o1.png');
    createJob('order-2', 'in/o2.png');

    createBatch('batch-order', ['order-2', 'order-1']);
    const ids = getBatchJobIds('batch-order');
    expect(ids).toEqual(['order-2', 'order-1']);
  });
});

describe('Challenge repository', () => {
  it('adds and counts submissions', () => {
    addSubmission({
      challengeId: 'challenge-2026-02-03',
      jobId: 'ch-job-1',
      submittedAt: new Date().toISOString(),
    });

    expect(getSubmissionCount('challenge-2026-02-03')).toBe(1);

    addSubmission({
      challengeId: 'challenge-2026-02-03',
      jobId: 'ch-job-2',
      submittedAt: new Date().toISOString(),
    });

    expect(getSubmissionCount('challenge-2026-02-03')).toBe(2);
  });

  it('returns 0 for unknown challenge', () => {
    expect(getSubmissionCount('challenge-unknown')).toBe(0);
  });

  it('retrieves submissions with correct fields', () => {
    const submissions = getSubmissions('challenge-2026-02-03');
    expect(submissions.length).toBe(2);
    expect(submissions[0].challengeId).toBe('challenge-2026-02-03');
    expect(submissions[0].jobId).toBeDefined();
    expect(submissions[0].submittedAt).toBeDefined();
  });
});

describe('Remix repository', () => {
  it('creates and retrieves a remix record', () => {
    const record = createRemixRecord('TESTCODE', {
      styleId: 'pop-art',
      sliders: { intensity: 50, faceFidelity: 70, backgroundStrength: 50, colorMood: 'warm', detail: 50 },
      toggles: { keepIdentity: true, preserveSkinTone: true },
    });

    expect(record.code).toBe('TESTCODE');
    expect(record.views).toBe(0);

    const retrieved = getRemixRecord('TESTCODE');
    expect(retrieved).toBeDefined();
    expect(retrieved!.template.styleId).toBe('pop-art');
  });

  it('checks code existence', () => {
    expect(codeExists('TESTCODE')).toBe(true);
    expect(codeExists('NOPE')).toBe(false);
  });

  it('increments views', () => {
    incrementRemixViews('TESTCODE');
    const record = getRemixRecord('TESTCODE');
    expect(record!.views).toBe(1);
  });

  it('returns undefined for unknown code', () => {
    expect(getRemixRecord('NOSUCHCODE')).toBeUndefined();
  });

  it('counts non-expired records', () => {
    expect(getRemixStoreSize()).toBeGreaterThan(0);
  });

  it('cleans up expired records', () => {
    // Insert a record with past expiry directly
    const db = getDb();
    db.prepare(
      "INSERT INTO remix_records (code, template, created_at, views, expires_at) VALUES (?, ?, ?, ?, ?)",
    ).run('EXPIRED1', '{}', '2020-01-01T00:00:00Z', 0, '2020-01-02T00:00:00Z');

    const cleaned = cleanupExpiredRemixes();
    expect(cleaned).toBeGreaterThanOrEqual(1);
    expect(getRemixRecord('EXPIRED1')).toBeUndefined();
  });
});

describe('Entitlement repository', () => {
  it('stores and retrieves entitlement', () => {
    setServerEntitlement({
      appUserId: 'db-user-1',
      proActive: true,
      proType: 'annual',
      expiresAt: '2027-01-01T00:00:00Z',
      verifiedAt: new Date().toISOString(),
    });

    const ent = getServerEntitlement('db-user-1');
    expect(ent).toBeDefined();
    expect(ent!.proActive).toBe(true);
    expect(ent!.proType).toBe('annual');
  });

  it('returns undefined for unknown user', () => {
    expect(getServerEntitlement('no-such-user')).toBeUndefined();
  });

  it('upserts existing entitlement', () => {
    setServerEntitlement({
      appUserId: 'db-user-2',
      proActive: true,
      proType: 'monthly',
      expiresAt: '2027-06-01T00:00:00Z',
      verifiedAt: new Date().toISOString(),
    });

    setServerEntitlement({
      appUserId: 'db-user-2',
      proActive: false,
      proType: null,
      expiresAt: null,
      verifiedAt: new Date().toISOString(),
    });

    const ent = getServerEntitlement('db-user-2');
    expect(ent!.proActive).toBe(false);
    expect(ent!.proType).toBeNull();
  });

  it('counts entries', () => {
    expect(getEntitlementStoreSize()).toBeGreaterThan(0);
  });
});
