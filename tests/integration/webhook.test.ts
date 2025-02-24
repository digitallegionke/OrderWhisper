import { jest } from '@jest/globals';
import { ordersCreateCallback } from '../../app/webhooks/orders-create';
import crypto from 'crypto';

// Mock environment variables
process.env.WHATSAPP_PHONE_NUMBER_ID = 'test_phone_number_id';
process.env.WHATSAPP_ACCESS_TOKEN = 'test_access_token';
process.env.ENCRYPTION_KEY = 'test_encryption_key_32_bytes_long_key';

const createMockFn = <T>(value: T) => jest.fn().mockImplementation(() => Promise.resolve(value));

const redisMock = {
    flushdb: createMockFn('OK'),
    get: createMockFn(null),
    set: createMockFn('OK'),
    setex: createMockFn('OK'),
    hset: createMockFn(1),
    hgetall: createMockFn({}),
    lpush: createMockFn(1),
    llen: createMockFn(0),
    quit: createMockFn('OK')
} as const;

// Mock Redis module
jest.unstable_mockModule('ioredis', () => {
    class MockRedis {
        constructor() {
            return redisMock;
        }
    }
    return {
        Redis: MockRedis,
        default: MockRedis
    };
});

describe('Webhook Integration Tests', () => {
    beforeEach(async () => {
        await redisMock.flushdb();
        jest.clearAllMocks();
    });

    afterAll(async () => {
        await redisMock.quit();
    });

    const generateTestOrder = (overrides = {}) => ({
        id: 12345,
        order_number: "1001",
        total_price: "99.99",
        created_at: new Date().toISOString(),
        customer: {
            phone: "+254712345678",
            email: "test@example.com",
            first_name: "Test",
            last_name: "User"
        },
        ...overrides
    });

    const generateWebhookSignature = (body: string) => {
        const secret = process.env.SHOPIFY_API_SECRET || 'test_secret';
        return crypto
            .createHmac('sha256', secret)
            .update(body, 'utf8')
            .digest('base64');
    };

    describe('Order Creation Webhook', () => {
        it('should process valid order webhook', async () => {
            const testOrder = generateTestOrder();
            const body = JSON.stringify(testOrder);
            const signature = generateWebhookSignature(body);

            const headers = new Headers({
                'X-Shopify-Hmac-Sha256': signature,
                'X-Shopify-Topic': 'orders/create',
                'X-Shopify-Shop-Domain': 'test-shop.myshopify.com'
            });

            const response = await ordersCreateCallback(
                'orders/create',
                'test-shop.myshopify.com',
                body,
                'test-webhook-id',
                headers
            );

            expect(response.status).toBe(200);
            expect(redisMock.setex).toHaveBeenCalled();
            expect(redisMock.hset).toHaveBeenCalled();
        });

        it('should reject invalid webhook signature', async () => {
            const testOrder = generateTestOrder();
            const body = JSON.stringify(testOrder);
            
            const headers = new Headers({
                'X-Shopify-Hmac-Sha256': 'invalid_signature',
                'X-Shopify-Topic': 'orders/create',
                'X-Shopify-Shop-Domain': 'test-shop.myshopify.com'
            });

            const response = await ordersCreateCallback(
                'orders/create',
                'test-shop.myshopify.com',
                body,
                'test-webhook-id',
                headers
            );

            expect(response.status).toBe(401);
            expect(redisMock.setex).not.toHaveBeenCalled();
        });

        it('should handle missing phone number', async () => {
            const testOrder = generateTestOrder({
                customer: {
                    email: "test@example.com",
                    first_name: "Test",
                    last_name: "User"
                }
            });
            
            const body = JSON.stringify(testOrder);
            const signature = generateWebhookSignature(body);

            const headers = new Headers({
                'X-Shopify-Hmac-Sha256': signature,
                'X-Shopify-Topic': 'orders/create',
                'X-Shopify-Shop-Domain': 'test-shop.myshopify.com'
            });

            const response = await ordersCreateCallback(
                'orders/create',
                'test-shop.myshopify.com',
                body,
                'test-webhook-id',
                headers
            );

            expect(response.status).toBe(200);
            expect(redisMock.hset).toHaveBeenCalledWith(
                `order:${testOrder.id}:notifications`,
                expect.objectContaining({
                    whatsapp_sent: 'skipped',
                    reason: 'no_valid_phone'
                })
            );
        });

        it('should handle rate limiting', async () => {
            const testOrder = generateTestOrder();
            const body = JSON.stringify(testOrder);
            const signature = generateWebhookSignature(body);

            const headers = new Headers({
                'X-Shopify-Hmac-Sha256': signature,
                'X-Shopify-Topic': 'orders/create',
                'X-Shopify-Shop-Domain': 'test-shop.myshopify.com'
            });

            // Send multiple requests quickly
            const requests = Array(10).fill(null).map(() => 
                ordersCreateCallback(
                    'orders/create',
                    'test-shop.myshopify.com',
                    body,
                    'test-webhook-id',
                    headers
                )
            );

            const responses = await Promise.all(requests);
            const rateLimitedResponses = responses.filter(r => r.status === 429);
            expect(rateLimitedResponses.length).toBeGreaterThan(0);
        });
    });
}); 