import { Redis } from 'ioredis';
import type { LoaderFunction } from '@remix-run/node';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export const loader: LoaderFunction = async () => {
    try {
        // Check Redis connection
        await redis.ping();

        // Check WhatsApp configuration
        const whatsappConfigured = process.env.WHATSAPP_PHONE_NUMBER_ID && 
                                 process.env.WHATSAPP_ACCESS_TOKEN;

        // Check Shopify configuration
        const shopifyConfigured = process.env.SHOPIFY_API_KEY && 
                                process.env.SHOPIFY_API_SECRET;

        // Get metrics
        const messagesSent = await redis.get('whatsapp_messages_sent_total') || '0';
        const messagesFailed = await redis.get('whatsapp_messages_failed_total') || '0';
        const webhookErrors = await redis.llen('webhook_errors') || 0;

        const status = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            services: {
                redis: 'connected',
                whatsapp: whatsappConfigured ? 'configured' : 'not_configured',
                shopify: shopifyConfigured ? 'configured' : 'not_configured'
            },
            metrics: {
                whatsapp_messages_sent: parseInt(messagesSent),
                whatsapp_messages_failed: parseInt(messagesFailed),
                webhook_errors: webhookErrors
            },
            version: process.env.npm_package_version || '1.0.0'
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
                error: error instanceof Error ? error.message : 'Unknown error'
            }, null, 2),
            {
                status: 503,
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-store'
                }
            }
        );
    } finally {
        // Don't keep the Redis connection open
        redis.disconnect();
    }
}; 