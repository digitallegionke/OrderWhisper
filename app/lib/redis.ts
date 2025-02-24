import { Redis, RedisOptions } from 'ioredis';
import { logger } from './logger';

function parseRedisUrl(url: string): RedisOptions {
  try {
    const parsedUrl = new URL(url);
    return {
      host: parsedUrl.hostname,
      port: parseInt(parsedUrl.port, 10),
      username: parsedUrl.username,
      password: parsedUrl.password,
      db: parseInt(parsedUrl.pathname.split('/')[1] || '0', 10),
      tls: parsedUrl.protocol === 'rediss:' ? { rejectUnauthorized: false } : undefined,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        logger.info(`Redis retry attempt ${times} with delay ${delay}ms`);
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      reconnectOnError: (err: Error) => {
        logger.error('Redis reconnect error', err, { attempt: 'reconnect' });
        return true;
      },
      connectTimeout: 20000,
      disconnectTimeout: 20000,
      commandTimeout: 10000,
      keepAlive: 10000,
      enableOfflineQueue: true,
      maxLoadingRetryTime: 20000
    };
  } catch (error) {
    logger.error('Error parsing Redis URL', error instanceof Error ? error : new Error('Unknown error'));
    return defaultConfig;
  }
}

const defaultConfig: RedisOptions = {
  host: 'localhost',
  port: 6379,
  retryStrategy: (times: number) => Math.min(times * 50, 2000),
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
  connectTimeout: 20000,
  disconnectTimeout: 20000,
  commandTimeout: 10000,
  keepAlive: 10000,
  enableOfflineQueue: true
};

class RedisClient {
  private static instance: Redis | null = null;
  private static connectionPromise: Promise<void> | null = null;

  private static async connect(config: RedisOptions): Promise<Redis> {
    const client = new Redis(config);

    client.on('error', (error: Error) => {
      logger.error('Redis connection error', error, { event: 'error' });
    });

    client.on('connect', () => {
      logger.info('Redis client connected', { event: 'connect' });
    });

    client.on('ready', () => {
      logger.info('Redis client ready', { event: 'ready' });
    });

    client.on('reconnecting', () => {
      logger.info('Redis client reconnecting', { event: 'reconnecting' });
    });

    client.on('end', () => {
      logger.info('Redis connection ended', { event: 'end' });
    });

    // Test connection
    try {
      await client.ping();
      logger.info('Redis connection test successful');
      return client;
    } catch (error) {
      logger.error('Redis connection test failed', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }

  public static async getInstance(): Promise<Redis> {
    if (!RedisClient.instance) {
      if (!RedisClient.connectionPromise) {
        RedisClient.connectionPromise = (async () => {
          try {
            const redisUrl = process.env.REDIS_URL;
            logger.info('Initializing Redis connection', { 
              url: redisUrl ? 'provided' : 'default',
              environment: process.env.NODE_ENV
            });

            const config = redisUrl ? parseRedisUrl(redisUrl) : defaultConfig;
            RedisClient.instance = await RedisClient.connect(config);

            // Handle process termination
            process.on('SIGTERM', async () => {
              await RedisClient.cleanup();
              process.exit(0);
            });

          } catch (error) {
            logger.error('Failed to initialize Redis connection', error instanceof Error ? error : new Error('Unknown error'));
            RedisClient.connectionPromise = null;
            throw error;
          }
        })();
      }
      await RedisClient.connectionPromise;
    }

    return RedisClient.instance!;
  }

  public static async cleanup(): Promise<void> {
    if (RedisClient.instance) {
      logger.info('Cleaning up Redis connection...');
      try {
        await RedisClient.instance.quit();
        RedisClient.instance = null;
        RedisClient.connectionPromise = null;
        logger.info('Redis connection cleaned up successfully');
      } catch (error) {
        logger.error('Error cleaning up Redis connection', error instanceof Error ? error : new Error('Unknown error'));
        throw error;
      }
    }
  }
}

export const getRedisClient = RedisClient.getInstance;
export default getRedisClient; 