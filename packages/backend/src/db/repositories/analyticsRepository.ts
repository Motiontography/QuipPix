import { getDb } from '../index';

interface AnalyticsEvent {
  event: string;
  properties?: Record<string, string | number | boolean>;
  timestamp: string;
}

interface EventCount {
  event: string;
  count: number;
}

interface StyleCount {
  styleId: string;
  count: number;
}

export function insertEvents(events: AnalyticsEvent[]): void {
  const db = getDb();
  const stmt = db.prepare(
    'INSERT INTO analytics_events (event, properties, timestamp, received_at) VALUES (?, ?, ?, ?)',
  );

  const now = new Date().toISOString();
  const insertMany = db.transaction((evts: AnalyticsEvent[]) => {
    for (const evt of evts) {
      stmt.run(
        evt.event,
        evt.properties ? JSON.stringify(evt.properties) : null,
        evt.timestamp,
        now,
      );
    }
  });

  insertMany(events);
}

export function getEventCounts(since?: string): EventCount[] {
  const db = getDb();

  if (since) {
    return db
      .prepare(
        'SELECT event, COUNT(*) as count FROM analytics_events WHERE timestamp >= ? GROUP BY event ORDER BY count DESC',
      )
      .all(since) as EventCount[];
  }

  return db
    .prepare(
      'SELECT event, COUNT(*) as count FROM analytics_events GROUP BY event ORDER BY count DESC',
    )
    .all() as EventCount[];
}

export function getPopularStyles(since?: string, limit: number = 10): StyleCount[] {
  const db = getDb();

  if (since) {
    return db
      .prepare(
        `SELECT json_extract(properties, '$.styleId') as styleId, COUNT(*) as count
         FROM analytics_events
         WHERE event = 'generation_completed'
           AND properties IS NOT NULL
           AND json_extract(properties, '$.styleId') IS NOT NULL
           AND timestamp >= ?
         GROUP BY styleId
         ORDER BY count DESC
         LIMIT ?`,
      )
      .all(since, limit) as StyleCount[];
  }

  return db
    .prepare(
      `SELECT json_extract(properties, '$.styleId') as styleId, COUNT(*) as count
       FROM analytics_events
       WHERE event = 'generation_completed'
         AND properties IS NOT NULL
         AND json_extract(properties, '$.styleId') IS NOT NULL
       GROUP BY styleId
       ORDER BY count DESC
       LIMIT ?`,
    )
    .all(limit) as StyleCount[];
}

export function getTotalEventCount(): number {
  const db = getDb();
  const row = db
    .prepare('SELECT COUNT(*) as count FROM analytics_events')
    .get() as { count: number };
  return row.count;
}

export function getEventCountSince(since: string): number {
  const db = getDb();
  const row = db
    .prepare('SELECT COUNT(*) as count FROM analytics_events WHERE timestamp >= ?')
    .get(since) as { count: number };
  return row.count;
}
