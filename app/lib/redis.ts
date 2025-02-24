import { Redis, RedisOptions } from 'ioredis';

const redisConfig: RedisOptions = {
  host: process.env.REDIS_URL?.split('://')[1]?.split(':')[0] || 'localhost',
  port: 6379,
  enableReadyCheck: true,
  maxRetriesPerRequest: 3,
  retryStrategy: (times: number) => {
    return Math.min(times * 50, 2000);
  },
  reconnectOnError: (err: Error) => {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      return true;
    }
    return false;
  }
};

class RedisClient {
  private static instance: Redis | null = null;

  public static getInstance(): Redis {
    if (!RedisClient.instance) {
      RedisClient.instance = process.env.REDIS_URL 
        ? new Redis(process.env.REDIS_URL)
        : new Redis(redisConfig);

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
    }

    return RedisClient.instance;
  }

  public static async cleanup(): Promise<void> {
    if (RedisClient.instance) {
      await RedisClient.instance.quit();
      RedisClient.instance = null;
    }
  }
}

export const redis = RedisClient.getInstance();
export default redis; 