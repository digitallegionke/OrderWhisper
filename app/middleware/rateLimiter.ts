import { redis } from '../lib/redis';

interface RateLimitOptions {
  windowMs?: number;
  maxRequests?: number;
  keyPrefix?: string;
}

export class RateLimiter {
  private windowMs: number;
  private maxRequests: number;
  private keyPrefix: string;

  constructor(options: RateLimitOptions = {}) {
    this.windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutes default
    this.maxRequests = options.maxRequests || 100; // 100 requests default
    this.keyPrefix = options.keyPrefix || 'rate_limit:';
  }

  public async isRateLimited(key: string): Promise<boolean> {
    const redisKey = `${this.keyPrefix}${key}`;
    
    try {
      const currentCount = await redis.incr(redisKey);
      
      if (currentCount === 1) {
        await redis.expire(redisKey, Math.floor(this.windowMs / 1000));
      }
      
      return currentCount > this.maxRequests;
    } catch (error) {
      console.error('Rate limiter error:', error);
      return false; // Fail open on errors
    }
  }

  public async getRemainingRequests(key: string): Promise<number> {
    const redisKey = `${this.keyPrefix}${key}`;
    
    try {
      const currentCount = await redis.get(redisKey);
      return Math.max(0, this.maxRequests - (parseInt(currentCount || '0', 10)));
    } catch (error) {
      console.error('Rate limiter error:', error);
      return 0;
    }
  }

  public async resetLimit(key: string): Promise<void> {
    const redisKey = `${this.keyPrefix}${key}`;
    await redis.del(redisKey);
  }
}

// Create default instances for different use cases
export const globalRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
  keyPrefix: 'global_rate_limit:'
});

export const webhookRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 50,
  keyPrefix: 'webhook_rate_limit:'
});

export const whatsappRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30,
  keyPrefix: 'whatsapp_rate_limit:'
});