import type { LoaderFunction } from '@remix-run/node';
import { redis } from '../lib/redis';

async function getRedisInfo() {
    try {
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
        console.error('Error getting Redis info:', error);
        return {
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

export const loader: LoaderFunction = async () => {
    try {
        // Check Redis connection
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
            activeRateLimits
        ] = await Promise.all([
            redis.get('whatsapp_messages_sent_total'),
            redis.get('whatsapp_messages_failed_total'),
            redis.llen('webhook_errors'),
            redis.keys('rate_limit:*')
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
                active_rate_limits: activeRateLimits.length
            },
            version: process.env.npm_package_version || '1.0.0',
            environment: process.env.NODE_ENV,
            deployment: {
                platform: 'render',
                region: process.env.RENDER_REGION || 'unknown',
                service_id: process.env.RENDER_SERVICE_ID || 'unknown'
            }
        };

        return new Response(JSON.stringify(status, null, 2), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store'
            }
        });
    } catch (error) {
        console.error('Health check failed:', error);
        
        return new Response(
            JSON.stringify({
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                error: error instanceof Error ? error.message : 'Unknown error',
                environment: process.env.NODE_ENV,
                deployment: {
                    platform: 'render',
                    region: process.env.RENDER_REGION || 'unknown',
                    service_id: process.env.RENDER_SERVICE_ID || 'unknown'
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