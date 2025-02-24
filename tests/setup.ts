import { jest } from '@jest/globals';

const createMockFn = <T>(value: T) => jest.fn().mockReturnValue(Promise.resolve(value));

const redisMock = {
    flushdb: createMockFn('OK'),
    flushall: createMockFn('OK'),
    get: createMockFn(null),
    set: createMockFn('OK'),
    incr: createMockFn(1),
    lpush: createMockFn(1),
    hset: createMockFn(1),
    llen: createMockFn(0),
    setex: createMockFn('OK'),
    exec: createMockFn([]),
    hgetall: createMockFn({}),
    quit: createMockFn('OK')
};

jest.unstable_mockModule('ioredis', () => ({
    default: jest.fn().mockImplementation(() => redisMock)
}));

// Mock fetch for WhatsApp API calls
const mockResponseData = {
    messaging_product: 'whatsapp',
    contacts: [{ wa_id: '254712345678' }],
    messages: [{ id: 'wamid.test123' }]
};

const mockFetch = jest.fn(
    (input: RequestInfo | URL, init?: RequestInit): Promise<Response> =>
        Promise.resolve(new Response(JSON.stringify(mockResponseData), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        }))
);

global.fetch = mockFetch;

// Set up environment variables for testing
process.env.WHATSAPP_API_URL = 'https://graph.facebook.com/v17.0/123456789/messages';
process.env.WHATSAPP_ACCESS_TOKEN = 'test_token';
process.env.SHOPIFY_API_SECRET = 'test_secret';

// Configure Jest
jest.setTimeout(60000); // 60 seconds
beforeEach(() => {
    jest.clearAllMocks();
}); 