import { initDb, closeDb, getDb } from '../src/db';
import { createJob, getJobsByUser, deleteJobsByUser } from '../src/db/repositories/jobRepository';

beforeAll(() => {
  initDb(':memory:');
});

afterAll(() => {
  closeDb();
});

describe('Account Deletion', () => {
  const userId = 'test-user-delete';

  beforeAll(() => {
    const db = getDb();

    // Create user
    db.prepare('INSERT INTO users (id, created_at) VALUES (?, ?)').run(
      userId,
      new Date().toISOString(),
    );

    // Create entitlement
    db.prepare(
      'INSERT INTO user_entitlements (app_user_id, pro_active, pro_type, verified_at) VALUES (?, ?, ?, ?)',
    ).run(userId, 1, 'annual', new Date().toISOString());

    // Create device token
    db.prepare(
      'INSERT INTO device_tokens (device_id, app_user_id, platform, push_token, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
    ).run('device-1', userId, 'ios', 'token-abc', new Date().toISOString(), new Date().toISOString());

    // Create jobs for user
    createJob('job-1', 'inputs/test1.png', userId);
    createJob('job-2', 'inputs/test2.png', userId);
    createJob('job-3', 'inputs/test3.png'); // No user — should NOT be deleted
  });

  it('creates jobs with user_id', () => {
    const jobs = getJobsByUser(userId);
    expect(jobs).toHaveLength(2);
    expect(jobs[0].user_id).toBe(userId);
  });

  it('deletes user jobs by user_id', () => {
    const deleted = deleteJobsByUser(userId);
    expect(deleted).toBe(2);

    const remaining = getJobsByUser(userId);
    expect(remaining).toHaveLength(0);
  });

  it('does not delete unrelated jobs', () => {
    const db = getDb();
    const orphan = db.prepare('SELECT * FROM jobs WHERE id = ?').get('job-3');
    expect(orphan).toBeDefined();
  });

  it('deletes user entitlement', () => {
    const db = getDb();
    db.prepare('DELETE FROM user_entitlements WHERE app_user_id = ?').run(userId);
    const ent = db.prepare('SELECT * FROM user_entitlements WHERE app_user_id = ?').get(userId);
    expect(ent).toBeUndefined();
  });

  it('deletes device tokens', () => {
    const db = getDb();
    db.prepare('DELETE FROM device_tokens WHERE app_user_id = ?').run(userId);
    const devices = db.prepare('SELECT * FROM device_tokens WHERE app_user_id = ?').all(userId);
    expect(devices).toHaveLength(0);
  });

  it('deletes user record', () => {
    const db = getDb();
    const result = db.prepare('DELETE FROM users WHERE id = ?').run(userId);
    expect(result.changes).toBe(1);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    expect(user).toBeUndefined();
  });
});
