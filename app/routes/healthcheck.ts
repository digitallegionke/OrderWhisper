import type { LoaderFunction } from '@remix-run/node';
import { getRedisClient } from '../lib/redis';
import { logger } from '../lib/logger';

async function getRedisInfo() {
    try {
        const redis = await getRedisClient();
        const info = await redis.info();
        const parsedInfo = info.split('\n').reduce((acc, line) => {
            const [key, value] = line.split(':');
            if (key && value) {
                acc[key.trim()] = value.trim();
            }
            return acc;
        }, {} as Record<string, string>);

        return {
            status: 'connected',
            version: parsedInfo.redis_version,
            memory_used: parsedInfo.used_memory_human,
            connected_clients: parsedInfo.connected_clients,
            uptime: parsedInfo.uptime_in_seconds
        };
    } catch (error) {
        logger.error('Error getting Redis info', error instanceof Error ? error : new Error('Unknown error'));
        return {
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

async function getRateLimitMetrics() {
    try {
        const redis = await getRedisClient();
        const [
            globalLimits,
            webhookLimits,
            whatsappLimits
        ] = await Promise.all([
            redis.keys('global_rate_limit:*'),
            redis.keys('webhook_rate_limit:*'),
            redis.keys('whatsapp_rate_limit:*')
        ]);

        // Get counts for rate-limited requests
        const [
            globalBlocked,
            webhookBlocked,
            whatsappBlocked
        ] = await Promise.all([
            redis.get('rate_limit_blocked:global').then(val => val || '0'),
            redis.get('rate_limit_blocked:webhook').then(val => val || '0'),
            redis.get('rate_limit_blocked:whatsapp').then(val => val || '0')
        ]);

        return {
            global: {
                active_limits: globalLimits.length,
                blocked_requests: parseInt(globalBlocked, 10)
            },
            webhook: {
                active_limits: webhookLimits.length,
                blocked_requests: parseInt(webhookBlocked, 10)
            },
            whatsapp: {
                active_limits: whatsappLimits.length,
                blocked_requests: parseInt(whatsappBlocked, 10)
            }
        };
    } catch (error) {
        logger.error('Error getting rate limit metrics', error instanceof Error ? error : new Error('Unknown error'));
        return {
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

export const loader: LoaderFunction = async () => {
    try {
        logger.info('Starting health check');
        
        // Check Redis connection
        const redis = await getRedisClient();
        await redis.ping();
        const redisInfo = await getRedisInfo();

        // Check WhatsApp configuration
        const whatsappConfigured = process.env.WHATSAPP_PHONE_NUMBER_ID && 
                                 process.env.WHATSAPP_ACCESS_TOKEN;

        // Check Shopify configuration
        const shopifyConfigured = process.env.SHOPIFY_API_KEY && 
                                process.env.SHOPIFY_API_SECRET;

        // Get metrics
        const [
            messagesSent,
            messagesFailed,
            webhookErrors,
            rateLimitMetrics
        ] = await Promise.all([
            redis.get('whatsapp_messages_sent_total'),
            redis.get('whatsapp_messages_failed_total'),
            redis.llen('webhook_errors'),
            getRateLimitMetrics()
        ]);

        const status = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            services: {
                redis: redisInfo,
                whatsapp: {
                    status: whatsappConfigured ? 'configured' : 'not_configured',
                    phone_number_id: process.env.WHATSAPP_PHONE_NUMBER_ID ? 'set' : 'missing'
                },
                shopify: {
                    status: shopifyConfigured ? 'configured' : 'not_configured',
                    api_key: process.env.SHOPIFY_API_KEY ? 'set' : 'missing'
                }
            },
            metrics: {
                whatsapp_messages_sent: parseInt(messagesSent || '0'),
                whatsapp_messages_failed: parseInt(messagesFailed || '0'),
                webhook_errors: webhookErrors,
                rate_limits: rateLimitMetrics
            },
            version: process.env.npm_package_version || '1.0.0',
            environment: process.env.NODE_ENV,
            deployment: {
                platform: 'render',
                region: process.env.RENDER_REGION || 'unknown',
                service_id: process.env.RENDER_SERVICE_ID || 'unknown',
                instance_id: process.env.RENDER_INSTANCE_ID || 'unknown'
            }
        };

        logger.info('Health check completed successfully', { status: status.status });

        return new Response(JSON.stringify(status, null, 2), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store'
            }
        });
    } catch (error) {
        logger.error('Health check failed', error instanceof Error ? error : new Error('Unknown error'));
        
        return new Response(
            JSON.stringify({
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                error: error instanceof Error ? error.message : 'Unknown error',
                environment: process.env.NODE_ENV,
                deployment: {
                    platform: 'render',
                    region: process.env.RENDER_REGION || 'unknown',
                    service_id: process.env.RENDER_SERVICE_ID || 'unknown',
                    instance_id: process.env.RENDER_INSTANCE_ID || 'unknown'
                }
            }, null, 2),
            {
                status: 503,
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-store'
                }
            }
        );
    }
}; 