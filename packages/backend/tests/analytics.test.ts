import { initDb, closeDb } from '../src/db';
import {
  insertEvents,
  getEventCounts,
  getPopularStyles,
  getTotalEventCount,
  getEventCountSince,
} from '../src/db/repositories/analyticsRepository';

beforeAll(() => {
  initDb(':memory:');
});

afterAll(() => {
  closeDb();
});

describe('Analytics Repository', () => {
  it('inserts a batch of events', () => {
    insertEvents([
      { event: 'generation_completed', properties: { styleId: 'caricature' }, timestamp: '2025-01-15T10:00:00Z' },
      { event: 'generation_completed', properties: { styleId: 'pop_art' }, timestamp: '2025-01-15T10:01:00Z' },
      { event: 'share_clicked', timestamp: '2025-01-15T10:02:00Z' },
    ]);

    expect(getTotalEventCount()).toBe(3);
  });

  it('returns event counts grouped by event type', () => {
    const counts = getEventCounts();
    const genCount = counts.find((c) => c.event === 'generation_completed');
    const shareCount = counts.find((c) => c.event === 'share_clicked');

    expect(genCount?.count).toBe(2);
    expect(shareCount?.count).toBe(1);
  });

  it('filters event counts by timestamp', () => {
    insertEvents([
      { event: 'paywall_shown', timestamp: '2025-02-01T10:00:00Z' },
    ]);

    const counts = getEventCounts('2025-02-01T00:00:00Z');
    expect(counts.length).toBe(1);
    expect(counts[0].event).toBe('paywall_shown');
  });

  it('returns popular styles from generation_completed events', () => {
    insertEvents([
      { event: 'generation_completed', properties: { styleId: 'caricature' }, timestamp: '2025-01-15T11:00:00Z' },
      { event: 'generation_completed', properties: { styleId: 'caricature' }, timestamp: '2025-01-15T12:00:00Z' },
      { event: 'generation_completed', properties: { styleId: 'watercolor' }, timestamp: '2025-01-15T13:00:00Z' },
    ]);

    const styles = getPopularStyles();
    expect(styles[0].styleId).toBe('caricature');
    expect(styles[0].count).toBe(3); // 1 from first insert + 2 more = 3
  });

  it('returns event count since a given timestamp', () => {
    const count = getEventCountSince('2025-02-01T00:00:00Z');
    expect(count).toBe(1); // Only the paywall_shown event
  });

  it('handles events without properties', () => {
    insertEvents([
      { event: 'daily_limit_reached', timestamp: '2025-01-15T14:00:00Z' },
    ]);

    const counts = getEventCounts();
    const limitCount = counts.find((c) => c.event === 'daily_limit_reached');
    expect(limitCount?.count).toBe(1);
  });

  it('handles empty batch gracefully', () => {
    const countBefore = getTotalEventCount();
    insertEvents([]);
    expect(getTotalEventCount()).toBe(countBefore);
  });
});
