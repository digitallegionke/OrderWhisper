import { Redis } from 'ioredis';
import { sendWhatsAppMessage } from '../app/helperFunctions/sendWhatsAppMessage';
import { ordersCreateCallback } from '../app/webhooks/orders-create';
import '@types/jest';

jest.setTimeout(60000); // Set timeout to 60 seconds for all tests

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

describe('Scalability Tests', () => {
    beforeAll(async () => {
        // Clear Redis test data
        await redis.flushall();
    });

    afterAll(async () => {
        await redis.quit();
    });

    describe('Rate Limiting', () => {
        it('should handle concurrent requests within rate limits', async () => {
            const phoneNumber = '+254712345678';
            const message = 'Test message';
            const concurrentRequests = 50;

            const requests = Array(concurrentRequests).fill(null).map(() => 
                sendWhatsAppMessage({ to: phoneNumber, message })
            );

            const results = await Promise.allSettled(requests);
            const fulfilled = results.filter(r => r.status === 'fulfilled').length;
            const rejected = results.filter(r => r.status === 'rejected').length;

            // We expect only 1 request to succeed due to rate limiting
            expect(fulfilled).toBe(1);
            expect(rejected).toBe(concurrentRequests - 1);
        });
    });

    describe('Webhook Processing', () => {
        it('should handle high volume of concurrent webhooks', async () => {
            const concurrentWebhooks = 100;
            const shop = 'test-shop.myshopify.com';
            const topic = 'orders/create';

            const mockHeaders = new Headers({
                'X-Shopify-Hmac-Sha256': 'mock-signature',
                'X-Shopify-Topic': topic,
                'X-Shopify-Shop-Domain': shop
            });

            const mockOrders = Array(concurrentWebhooks).fill(null).map((_, i) => ({
                id: i + 1,
                order_number: `#${i + 1000}`,
                total_price: '99.99',
                customer: {
                    phone: '+254712345678',
                    email: 'test@example.com'
                },
                created_at: new Date().toISOString()
            }));

            const webhookCalls = mockOrders.map(order => 
                ordersCreateCallback(
                    topic,
                    shop,
                    JSON.stringify(order),
                    `webhook-${order.id}`,
                    mockHeaders
                )
            );

            const startTime = Date.now();
            const results = await Promise.allSettled(webhookCalls);
            const endTime = Date.now();

            const processingTime = endTime - startTime;
            console.log(`Processed ${concurrentWebhooks} webhooks in ${processingTime}ms`);
            console.log(`Average processing time: ${processingTime / concurrentWebhooks}ms per webhook`);

            // Verify Redis metrics
            const errorCount = await redis.llen('webhook_errors');
            const messagesSent = await redis.get('whatsapp_messages_sent_total');
            const messagesFailed = await redis.get('whatsapp_messages_failed_total');

            console.log('Metrics:', {
                errorCount,
                messagesSent,
                messagesFailed
            });

            // Performance expectations
            expect(processingTime).toBeLessThan(30000); // Should process all webhooks within 30 seconds
            expect(processingTime / concurrentWebhooks).toBeLessThan(300); // Average < 300ms per webhook
        });
    });

    describe('Redis Performance', () => {
        it('should handle high volume of concurrent Redis operations', async () => {
            const operations = 1000;
            const startTime = Date.now();

            // Simulate high volume of concurrent Redis operations
            const promises = Array(operations).fill(null).map((_, i) => {
                const multi = redis.multi();
                multi.incr('test_counter');
                multi.hset(`test:${i}`, {
                    field1: 'value1',
                    field2: 'value2'
                });
                multi.expire(`test:${i}`, 3600);
                return multi.exec();
            });

            await Promise.all(promises);
            const endTime = Date.now();
            const processingTime = endTime - startTime;

            console.log(`Processed ${operations} Redis operations in ${processingTime}ms`);
            console.log(`Average processing time: ${processingTime / operations}ms per operation`);

            // Performance expectations
            expect(processingTime).toBeLessThan(5000); // Should process all operations within 5 seconds
            expect(processingTime / operations).toBeLessThan(5); // Average < 5ms per operation
        });
    });

    describe('Memory Usage', () => {
        it('should monitor memory usage under load', async () => {
            const initialMemory = process.memoryUsage();
            
            // Simulate memory-intensive operations
            const largeDataSets = Array(1000).fill(null).map((_, i) => ({
                id: i,
                data: Buffer.alloc(1024 * 10) // 10KB per item
            }));

            // Process large datasets
            for (const data of largeDataSets) {
                await redis.set(`large:${data.id}`, data.data);
            }

            const finalMemory = process.memoryUsage();

            console.log('Memory Usage (MB):', {
                heapUsedInitial: Math.round(initialMemory.heapUsed / 1024 / 1024),
                heapUsedFinal: Math.round(finalMemory.heapUsed / 1024 / 1024),
                rssInitial: Math.round(initialMemory.rss / 1024 / 1024),
                rssFinal: Math.round(finalMemory.rss / 1024 / 1024)
            });

            // Memory usage expectations
            expect(finalMemory.heapUsed - initialMemory.heapUsed).toBeLessThan(100 * 1024 * 1024); // Less than 100MB increase
        });
    });
}); 