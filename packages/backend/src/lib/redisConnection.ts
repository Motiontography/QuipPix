import IORedis from 'ioredis';
import { config } from '../config';
import { logger } from '../utils/logger';

export function createRedisConnection(): IORedis {
  const connection = config.redis.url
    ? new IORedis(config.redis.url, { maxRetriesPerRequest: null })
    : new IORedis({
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
        maxRetriesPerRequest: null,
      });

  connection.on('error', (err) => {
    logger.error({ error: err.message }, 'Redis connection error');
  });

  return connection;
}
