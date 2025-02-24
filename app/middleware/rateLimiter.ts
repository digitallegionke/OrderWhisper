import { getRedisClient } from '../lib/redis';
import { logger } from '../lib/logger';
import { NextFunction, Request, Response } from 'express';

interface RateLimitOptions {
  windowMs?: number;
  maxRequests?: number;
  keyPrefix?: string;
  errorMessage?: string;
  statusCode?: number;
  skipFailedRequests?: boolean;
  headers?: boolean;
}

interface RateLimitInfo {
  limit: number;
  current: number;
  remaining: number;
  resetTime: Date;
}

export class RateLimiter {
  private windowMs: number;
  private maxRequests: number;
  private keyPrefix: string;
  private errorMessage: string;
  private statusCode: number;
  private skipFailedRequests: boolean;
  private headers: boolean;

  constructor(options: RateLimitOptions = {}) {
    this.windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutes default
    this.maxRequests = options.maxRequests || 100; // 100 requests default
    this.keyPrefix = options.keyPrefix || 'rate_limit:';
    this.errorMessage = options.errorMessage || 'Too many requests, please try again later';
    this.statusCode = options.statusCode || 429;
    this.skipFailedRequests = options.skipFailedRequests || false;
    this.headers = options.headers !== false;
  }

  public middleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      const key = this.generateKey(req);
      
      try {
        const info = await this.checkRateLimit(key);
        
        if (this.headers) {
          this.setHeaders(res, info);
        }

        if (info.remaining < 0) {
          logger.warn('Rate limit exceeded', {
            ip: req.ip,
            path: req.path,
            limit: info.limit,
            current: info.current,
            resetTime: info.resetTime
          });

          return res
            .status(this.statusCode)
            .json({
              error: this.errorMessage,
              retryAfter: Math.ceil((info.resetTime.getTime() - Date.now()) / 1000)
            });
        }

        // Log rate limit status for monitoring
        logger.debug('Rate limit status', {
          ip: req.ip,
          path: req.path,
          remaining: info.remaining,
          limit: info.limit
        });

        next();
      } catch (error) {
        logger.error('Rate limiter error', error instanceof Error ? error : new Error('Unknown error'), {
          ip: req.ip,
          path: req.path
        });

        if (this.skipFailedRequests) {
          next();
        } else {
          next(error);
        }
      }
    };
  }

  private async checkRateLimit(key: string): Promise<RateLimitInfo> {
    const redis = await getRedisClient();
    const redisKey = `${this.keyPrefix}${key}`;
    
    const pipeline = redis.pipeline();
    pipeline.incr(redisKey);
    pipeline.pttl(redisKey);
    
    const results = await pipeline.exec();
    
    if (!results) {
      throw new Error('Redis pipeline execution failed');
    }

    const count = (results[0][1] as number) || 0;
    const ttl = (results[1][1] as number) || 0;
    
    if (count === 1) {
      await redis.expire(redisKey, Math.floor(this.windowMs / 1000));
    }

    const resetTime = new Date(Date.now() + (ttl > 0 ? ttl : this.windowMs));
    
    return {
      limit: this.maxRequests,
      current: count,
      remaining: this.maxRequests - count,
      resetTime
    };
  }

  private generateKey(req: Request): string {
    // Use X-Forwarded-For if behind proxy, otherwise use req.ip
    const clientIp = req.get('X-Forwarded-For')?.split(',')[0] || req.ip;
    return `${clientIp}:${req.path}`;
  }

  private setHeaders(res: Response, info: RateLimitInfo) {
    res.setHeader('X-RateLimit-Limit', info.limit);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, info.remaining));
    res.setHeader('X-RateLimit-Reset', Math.ceil(info.resetTime.getTime() / 1000));
    
    if (info.remaining < 0) {
      res.setHeader('Retry-After', Math.ceil((info.resetTime.getTime() - Date.now()) / 1000));
    }
  }

  public async getRemainingRequests(key: string): Promise<number> {
    try {
      const redis = await getRedisClient();
      const redisKey = `${this.keyPrefix}${key}`;
      const currentCount = await redis.get(redisKey);
      return Math.max(0, this.maxRequests - (parseInt(currentCount || '0', 10)));
    } catch (error) {
      logger.error('Error getting remaining requests', error instanceof Error ? error : new Error('Unknown error'), {
        key
      });
      return 0;
    }
  }

  public async resetLimit(key: string): Promise<void> {
    try {
      const redis = await getRedisClient();
      const redisKey = `${this.keyPrefix}${key}`;
      await redis.del(redisKey);
      logger.info('Rate limit reset', { key });
    } catch (error) {
      logger.error('Error resetting rate limit', error instanceof Error ? error : new Error('Unknown error'), {
        key
      });
      throw error;
    }
  }
}

// Create default instances for different use cases
export const globalRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
  keyPrefix: 'global_rate_limit:',
  errorMessage: 'Too many requests. Please try again in a few minutes.',
  headers: true,
  skipFailedRequests: true
});

export const webhookRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 50,
  keyPrefix: 'webhook_rate_limit:',
  errorMessage: 'Too many webhook requests. Please try again in a minute.',
  headers: true
});

export const whatsappRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30,
  keyPrefix: 'whatsapp_rate_limit:',
  errorMessage: 'WhatsApp API rate limit exceeded. Please try again in a minute.',
  headers: true
});