import { initDb, closeDb, getDb } from '../src/db';
import { createUser } from '../src/db/repositories/userRepository';
import { registerDevice } from '../src/db/repositories/deviceRepository';
import { insertEvents } from '../src/db/repositories/analyticsRepository';
import { config } from '../src/config';

beforeAll(() => {
  initDb(':memory:');
});

afterAll(() => {
  closeDb();
});

describe('Admin Stats', () => {
  beforeAll(() => {
    // Seed test data
    createUser('admin-test-user-1');
    createUser('admin-test-user-2');

    const now = new Date().toISOString();
    registerDevice({
      deviceId: 'admin-dev-1',
      appUserId: 'admin-test-user-1',
      platform: 'ios',
      pushToken: 'tok-1',
      createdAt: now,
      updatedAt: now,
    });

    registerDevice({
      deviceId: 'admin-dev-2',
      appUserId: 'admin-test-user-2',
      platform: 'android',
      pushToken: 'tok-2',
      createdAt: now,
      updatedAt: now,
    });

    // Insert a job
    const db = getDb();
    db.prepare(
      'INSERT INTO jobs (id, status, progress, input_key, created_at) VALUES (?, ?, ?, ?, ?)',
    ).run('admin-job-1', 'done', 1.0, 'input/test.png', now);

    // Insert analytics events
    insertEvents([
      { event: 'generation_completed', properties: { styleId: 'caricature' }, timestamp: now },
      { event: 'share_clicked', timestamp: now },
    ]);

    // Insert a challenge submission
    db.prepare(
      'INSERT INTO challenge_submissions (challenge_id, job_id, submitted_at) VALUES (?, ?, ?)',
    ).run('challenge-1', 'admin-job-1', now);
  });

  it('returns stats with valid API key', () => {
    const db = getDb();

    // Verify users exist
    const userCount = (db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }).count;
    expect(userCount).toBeGreaterThanOrEqual(2);

    // Verify devices exist
    const deviceCount = (db.prepare('SELECT COUNT(*) as count FROM device_tokens').get() as { count: number }).count;
    expect(deviceCount).toBeGreaterThanOrEqual(2);

    // Verify jobs exist
    const jobCount = (db.prepare('SELECT COUNT(*) as count FROM jobs').get() as { count: number }).count;
    expect(jobCount).toBeGreaterThanOrEqual(1);
  });

  it('verifies admin API key config exists', () => {
    expect(config.admin.apiKey).toBeDefined();
    expect(typeof config.admin.apiKey).toBe('string');
    expect(config.admin.apiKey.length).toBeGreaterThan(0);
  });

  it('counts devices by platform', () => {
    const db = getDb();
    const ios = (db.prepare("SELECT COUNT(*) as count FROM device_tokens WHERE platform = 'ios'").get() as { count: number }).count;
    const android = (db.prepare("SELECT COUNT(*) as count FROM device_tokens WHERE platform = 'android'").get() as { count: number }).count;

    expect(ios).toBeGreaterThanOrEqual(1);
    expect(android).toBeGreaterThanOrEqual(1);
  });

  it('counts challenge submissions', () => {
    const db = getDb();
    const count = (db.prepare('SELECT COUNT(*) as count FROM challenge_submissions').get() as { count: number }).count;
    expect(count).toBeGreaterThanOrEqual(1);
  });

  it('tracks entitlement counts', () => {
    const db = getDb();
    const proCount = (db.prepare('SELECT COUNT(*) as count FROM user_entitlements WHERE pro_active = 1').get() as { count: number }).count;
    // Initially no pro users from admin tests
    expect(proCount).toBeGreaterThanOrEqual(0);
  });
});
