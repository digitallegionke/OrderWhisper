import { jest } from '@jest/globals';

// Mock environment variables
process.env.WHATSAPP_PHONE_NUMBER_ID = 'test_phone_number_id';
process.env.WHATSAPP_ACCESS_TOKEN = 'test_access_token';
process.env.ENCRYPTION_KEY = 'test_encryption_key_32_bytes_long_key';

// Mock Redis client
const redisMock = {
    hset: jest.fn().mockImplementation(() => Promise.resolve(1)),
    get: jest.fn().mockImplementation(() => Promise.resolve(null)),
    set: jest.fn().mockImplementation(() => Promise.resolve('OK')),
    quit: jest.fn().mockImplementation(() => Promise.resolve('OK')),
    flushdb: jest.fn().mockImplementation(() => Promise.resolve('OK')),
    incr: jest.fn().mockImplementation(() => Promise.resolve(1)),
    lpush: jest.fn().mockImplementation(() => Promise.resolve(1))
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

// Import after mocking
const { sendWhatsAppMessage } = await import('../../app/helperFunctions/sendWhatsAppMessage');

describe('WhatsApp Integration Tests', () => {
    beforeEach(async () => {
        await redisMock.flushdb();
        jest.clearAllMocks();
    });

    afterAll(async () => {
        await redisMock.quit();
    });

    it('should send WhatsApp message successfully', async () => {
        const phoneNumber = '+254712345678';
        const message = 'Test message';

        const response = await sendWhatsAppMessage({ to: phoneNumber, message });
        expect(response.messaging_product).toBe('whatsapp');
        expect(response.messages[0].id).toBeTruthy();
        expect(redisMock.incr).toHaveBeenCalledWith('whatsapp_messages_sent_total');
        expect(redisMock.lpush).toHaveBeenCalled();
    });

    it('should handle invalid phone numbers', async () => {
        const phoneNumber = 'invalid';
        const message = 'Test message';

        await expect(sendWhatsAppMessage({ to: phoneNumber, message }))
            .rejects.toThrow('Invalid phone number');

        expect(redisMock.incr).toHaveBeenCalledWith('whatsapp_messages_failed_total');
        expect(redisMock.lpush).toHaveBeenCalledWith('whatsapp_recent_errors', expect.any(String));
    });

    it('should handle WhatsApp API errors', async () => {
        const phoneNumber = '+254712345678';
        const message = 'Test message';

        // Mock fetch to simulate API error
        global.fetch = jest.fn().mockImplementation(() =>
            Promise.resolve(new Response(JSON.stringify({ error: 'API Error' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }))
        ) as jest.MockedFunction<typeof fetch>;

        await expect(sendWhatsAppMessage({ to: phoneNumber, message }))
            .rejects.toThrow('WhatsApp API error');

        expect(redisMock.incr).toHaveBeenCalledWith('whatsapp_messages_failed_total');
        expect(redisMock.lpush).toHaveBeenCalledWith('whatsapp_recent_errors', expect.any(String));
    });

    it('should handle rate limiting', async () => {
        const phoneNumber = '+254712345678';
        const message = 'Test message';

        // Mock rate limit check
        const mockTimestamp = Date.now().toString();
        jest.spyOn(redisMock, 'get').mockImplementationOnce(() => Promise.resolve(mockTimestamp));

        await expect(sendWhatsAppMessage({ to: phoneNumber, message }))
            .rejects.toThrow('Rate limit exceeded');

        expect(redisMock.incr).toHaveBeenCalledWith('whatsapp_messages_failed_total');
        expect(redisMock.lpush).toHaveBeenCalledWith('whatsapp_recent_errors', expect.any(String));
    });
}); 