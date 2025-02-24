import { Redis, RedisOptions } from 'ioredis';

function parseRedisUrl(url: string): RedisOptions {
  try {
    const parsedUrl = new URL(url);
    return {
      host: parsedUrl.hostname,
      port: parseInt(parsedUrl.port, 10),
      username: parsedUrl.username,
      password: parsedUrl.password,
      db: parseInt(parsedUrl.pathname.split('/')[1] || '0', 10),
      tls: parsedUrl.protocol === 'rediss:' ? {} : undefined,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        console.log(`Redis retry attempt ${times} with delay ${delay}ms`);
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      reconnectOnError: (err: Error) => {
        console.error('Redis reconnect error:', err);
        return true;
      }
    };
  } catch (error) {
    console.error('Error parsing Redis URL:', error);
    return defaultConfig;
  }
}

const defaultConfig: RedisOptions = {
  host: 'localhost',
  port: 6379,
  retryStrategy: (times: number) => Math.min(times * 50, 2000),
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true
};

class RedisClient {
  private static instance: Redis | null = null;

  public static getInstance(): Redis {
    if (!RedisClient.instance) {
      const redisUrl = process.env.REDIS_URL;
      const config = redisUrl ? parseRedisUrl(redisUrl) : defaultConfig;

      RedisClient.instance = new Redis(config);

      RedisClient.instance.on('error', (error: Error) => {
        console.error('Redis connection error:', error);
      });

      RedisClient.instance.on('connect', () => {
        console.log('Redis client connected');
      });

      RedisClient.instance.on('ready', () => {
        console.log('Redis client ready');
      });

      RedisClient.instance.on('reconnecting', () => {
        console.log('Redis client reconnecting');
      });

      RedisClient.instance.on('end', () => {
        console.log('Redis connection ended');
      });

      // Handle process termination
      process.on('SIGTERM', async () => {
        await RedisClient.cleanup();
        process.exit(0);
      });
    }

    return RedisClient.instance;
  }

  public static async cleanup(): Promise<void> {
    if (RedisClient.instance) {
      console.log('Cleaning up Redis connection...');
      await RedisClient.instance.quit();
      RedisClient.instance = null;
      console.log('Redis connection cleaned up');
    }
  }
}

export const redis = RedisClient.getInstance();
export default redis; 