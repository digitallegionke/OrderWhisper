import { Redis, RedisOptions } from 'ioredis';
import { logger } from './logger';

function parseRedisUrl(url: string): RedisOptions {
  try {
    // Handle Render's Redis URL format
    const connectionString = url.replace(/^rediss?:\/\//, '');
    const [authPart, hostPart] = connectionString.split('@');
    const [username, password] = authPart.split(':');
    const [host, port] = hostPart.split(':');

    return {
      host,
      port: parseInt(port, 10),
      username: username || undefined,
      password: password || undefined,
      tls: url.startsWith('rediss://') ? {
        rejectUnauthorized: false,
        servername: host // Required for SNI
      } : undefined,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 500, 5000); // Increased delays
        logger.info(`Redis retry attempt ${times} with delay ${delay}ms`, {
          attempt: times,
          delay,
          host: host.split('.')[0] // Log partial host for debugging
        });
        return delay;
      },
      maxRetriesPerRequest: 5, // Increased retries
      enableReadyCheck: true,
      reconnectOnError: (err: Error) => {
        logger.error('Redis reconnect error', err, {
          attempt: 'reconnect',
          errorCode: err.name,
          willRetry: true
        });
        return true; // Always retry on error
      },
      connectTimeout: 30000, // Increased timeout
      disconnectTimeout: 5000,
      commandTimeout: 15000,
      keepAlive: 30000,
      enableOfflineQueue: true,
      maxLoadingRetryTime: 30000,
      autoResubscribe: true,
      autoResendUnfulfilledCommands: true,
      lazyConnect: false // Ensure immediate connection attempt
    };
  } catch (error) {
    logger.error('Error parsing Redis URL', error instanceof Error ? error : new Error('Unknown error'), {
      url: url.replace(/\/\/.*@/, '//***@') // Redact credentials
    });
    throw error; // Don't fall back to default config in production
  }
}

class RedisClient {
  private static instance: Redis | null = null;
  private static connectionPromise: Promise<Redis> | null = null;
  private static reconnectTimer: NodeJS.Timeout | null = null;

  private static async connect(config: RedisOptions): Promise<Redis> {
    if (RedisClient.instance) {
      try {
        await RedisClient.instance.quit();
      } catch (error) {
        logger.warn('Error while closing existing Redis connection', { error });
      }
      RedisClient.instance = null;
    }

    const client = new Redis(config);

    client.on('error', (error: Error) => {
      logger.error('Redis connection error', error, {
        event: 'error',
        connectionId: client.status
      });
      RedisClient.scheduleReconnect();
    });

    client.on('connect', () => {
      logger.info('Redis client connected', {
        event: 'connect',
        connectionId: client.status
      });
    });

    client.on('ready', () => {
      logger.info('Redis client ready', {
        event: 'ready',
        connectionId: client.status
      });
      if (RedisClient.reconnectTimer) {
        clearTimeout(RedisClient.reconnectTimer);
        RedisClient.reconnectTimer = null;
      }
    });

    client.on('reconnecting', () => {
      logger.info('Redis client reconnecting', {
        event: 'reconnecting',
        connectionId: client.status,
        attempt: client.status
      });
    });

    client.on('end', () => {
      logger.info('Redis connection ended', {
        event: 'end',
        connectionId: client.status
      });
      RedisClient.scheduleReconnect();
    });

    // Test connection
    try {
      await client.ping();
      logger.info('Redis connection test successful', {
        connectionId: client.status
      });
      return client;
    } catch (error) {
      logger.error('Redis connection test failed', error instanceof Error ? error : new Error('Unknown error'), {
        connectionId: client.status
      });
      throw error;
    }
  }

  private static scheduleReconnect(): void {
    if (!RedisClient.reconnectTimer) {
      RedisClient.reconnectTimer = setTimeout(() => {
        logger.info('Attempting Redis reconnection');
        RedisClient.connectionPromise = null;
        RedisClient.getInstance().catch(error => {
          logger.error('Scheduled reconnection failed', error instanceof Error ? error : new Error('Unknown error'));
        });
      }, 5000); // Wait 5 seconds before reconnecting
    }
  }

  public static async getInstance(): Promise<Redis> {
    if (!RedisClient.connectionPromise) {
      RedisClient.connectionPromise = (async () => {
        try {
          const redisUrl = process.env.REDIS_URL;
          if (!redisUrl) {
            throw new Error('REDIS_URL environment variable is not set');
          }

          logger.info('Initializing Redis connection', {
            environment: process.env.NODE_ENV,
            renderInstance: process.env.RENDER_INSTANCE_ID || 'unknown'
          });

          RedisClient.instance = await RedisClient.connect(parseRedisUrl(redisUrl));

          // Handle process termination
          process.on('SIGTERM', async () => {
            logger.info('Received SIGTERM signal');
            await RedisClient.cleanup();
            process.exit(0);
          });

          return RedisClient.instance;
        } catch (error) {
          logger.error('Failed to initialize Redis connection', error instanceof Error ? error : new Error('Unknown error'), {
            environment: process.env.NODE_ENV,
            renderInstance: process.env.RENDER_INSTANCE_ID || 'unknown'
          });
          RedisClient.connectionPromise = null;
          throw error;
        }
      })();
    }

    return RedisClient.connectionPromise;
  }

  public static async cleanup(): Promise<void> {
    if (RedisClient.reconnectTimer) {
      clearTimeout(RedisClient.reconnectTimer);
      RedisClient.reconnectTimer = null;
    }

    if (RedisClient.instance) {
      logger.info('Cleaning up Redis connection...');
      try {
        await RedisClient.instance.quit();
        RedisClient.instance = null;
        RedisClient.connectionPromise = null;
        logger.info('Redis connection cleaned up successfully');
      } catch (error) {
        logger.error('Error cleaning up Redis connection', error instanceof Error ? error : new Error('Unknown error'));
        // Force cleanup even if quit fails
        RedisClient.instance = null;
        RedisClient.connectionPromise = null;
      }
    }
  }
}

export const getRedisClient = RedisClient.getInstance;
export default getRedisClient; 