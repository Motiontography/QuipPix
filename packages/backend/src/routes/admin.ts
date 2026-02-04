import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { config } from '../config';
import { getDb } from '../db';
import { getEventCounts, getPopularStyles } from '../db/repositories/analyticsRepository';

export async function adminRoutes(app: FastifyInstance): Promise<void> {
  /**
   * GET /admin/stats
   * Returns aggregated platform stats. Protected by API key.
   */
  app.get('/admin/stats', async (request: FastifyRequest, reply: FastifyReply) => {
    const apiKey = request.headers['x-admin-key'] as string | undefined;

    if (!apiKey || apiKey !== config.admin.apiKey) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const db = getDb();
    const now = new Date();

    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Users
    const totalUsers = (db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }).count;
    const users24h = (db.prepare('SELECT COUNT(*) as count FROM users WHERE created_at >= ?').get(last24h) as { count: number }).count;
    const users7d = (db.prepare('SELECT COUNT(*) as count FROM users WHERE created_at >= ?').get(last7d) as { count: number }).count;

    // Devices
    const totalDevices = (db.prepare('SELECT COUNT(*) as count FROM device_tokens').get() as { count: number }).count;
    const iosDevices = (db.prepare("SELECT COUNT(*) as count FROM device_tokens WHERE platform = 'ios'").get() as { count: number }).count;
    const androidDevices = (db.prepare("SELECT COUNT(*) as count FROM device_tokens WHERE platform = 'android'").get() as { count: number }).count;

    // Generations (jobs)
    const totalGenerations = (db.prepare('SELECT COUNT(*) as count FROM jobs').get() as { count: number }).count;
    const generations24h = (db.prepare('SELECT COUNT(*) as count FROM jobs WHERE created_at >= ?').get(last24h) as { count: number }).count;
    const generations7d = (db.prepare('SELECT COUNT(*) as count FROM jobs WHERE created_at >= ?').get(last7d) as { count: number }).count;

    // Popular styles (from analytics)
    const popularStyles = getPopularStyles(undefined, 10);

    // Challenges
    const totalSubmissions = (db.prepare('SELECT COUNT(*) as count FROM challenge_submissions').get() as { count: number }).count;

    // Entitlements
    const proUsers = (db.prepare('SELECT COUNT(*) as count FROM user_entitlements WHERE pro_active = 1').get() as { count: number }).count;
    const freeUsers = Math.max(0, totalUsers - proUsers);

    // Analytics event summary
    const eventCounts = getEventCounts();

    return reply.send({
      users: { total: totalUsers, last24h: users24h, last7d: users7d },
      devices: { total: totalDevices, byPlatform: { ios: iosDevices, android: androidDevices } },
      generations: { total: totalGenerations, last24h: generations24h, last7d: generations7d },
      styles: { popular: popularStyles },
      challenges: { totalSubmissions },
      entitlements: { proUsers, freeUsers },
      events: eventCounts,
    });
  });
}
