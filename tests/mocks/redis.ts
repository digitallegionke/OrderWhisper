import { jest } from '@jest/globals';

const createMockFn = <T>(value: T) => jest.fn().mockImplementation(() => Promise.resolve(value));

export const redisMock = {
    flushdb: createMockFn('OK'),
    flushall: createMockFn('OK'),
    get: createMockFn(null),
    set: createMockFn('OK'),
    setex: createMockFn('OK'),
    incr: createMockFn(1),
    lpush: createMockFn(1),
    hset: createMockFn(1),
    llen: createMockFn(0),
    hgetall: createMockFn({}),
    quit: createMockFn('OK'),
    multi: jest.fn().mockReturnThis(),
    exec: createMockFn([]),
    disconnect: jest.fn().mockImplementation(() => undefined)
} as const;

export const createRedisMock = () => {
    class MockRedis {
        constructor() {
            return redisMock;
        }
    }
    return {
        Redis: MockRedis,
        default: MockRedis
    };
}; 