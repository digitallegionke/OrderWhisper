import Redis from 'ioredis';
import { config } from '../../config/development';

// Create Redis client
const redis = new Redis(config.redis.url, {
    retryStrategy: (times: number) => {
        // Retry connection with exponential backoff
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
    maxRetriesPerRequest: 3,
});

redis.on('error', (error) => {
    console.error('Redis Client Error:', error);
});

redis.on('connect', () => {
    console.log('Redis Client Connected');
});

// Cache wrapper
export async function getCache<T>(key: string): Promise<T | null> {
    try {
        const value = await redis.get(key);
        return value ? JSON.parse(value) : null;
    } catch (error) {
        console.error(`Error getting cache for key ${key}:`, error);
        return null;
    }
}

export async function setCache(key: string, value: any, expirySeconds: number = 3600): Promise<void> {
    try {
        await redis.set(key, JSON.stringify(value), 'EX', expirySeconds);
    } catch (error) {
        console.error(`Error setting cache for key ${key}:`, error);
    }
}

export async function deleteCache(key: string): Promise<void> {
    try {
        await redis.del(key);
    } catch (error) {
        console.error(`Error deleting cache for key ${key}:`, error);
    }
}

export default redis; 