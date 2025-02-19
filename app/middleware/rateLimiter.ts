// Simple in-memory rate limiter for webhooks
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 100; // Limit each shop to 100 requests per windowMs

// In-memory store for rate limiting
const store = new Map<string, { count: number; resetTime: number }>();

export function webhookRateLimiter(shop: string): { limited: boolean; headers: Headers } {
  const now = Date.now();

  // Clean up expired entries
  for (const [key, value] of store.entries()) {
    if (now > value.resetTime) {
      store.delete(key);
    }
  }

  // Get or create rate limit entry for this shop
  let entry = store.get(shop);
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 0,
      resetTime: now + WINDOW_MS,
    };
    store.set(shop, entry);
  }

  // Increment request count
  entry.count++;

  // Set rate limit headers
  const headers = new Headers({
    "RateLimit-Limit": MAX_REQUESTS.toString(),
    "RateLimit-Remaining": Math.max(0, MAX_REQUESTS - entry.count).toString(),
    "RateLimit-Reset": new Date(entry.resetTime).toUTCString(),
  });

  // Check if rate limit exceeded
  return {
    limited: entry.count > MAX_REQUESTS,
    headers
  };
}