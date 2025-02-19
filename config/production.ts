export const config = {
  environment: 'production',
  apiUrl: process.env.SHOPIFY_APP_URL,
  whatsapp: {
    apiVersion: 'v17.0',
    baseUrl: 'https://graph.facebook.com',
  },
  database: {
    url: process.env.DATABASE_URL,
  },
  redis: {
    url: process.env.REDIS_URL,
    tls: {
      rejectUnauthorized: false,
    },
  },
  logging: {
    level: 'info',
    format: 'json',
  },
  webhooks: {
    rateLimits: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 500, // Higher limit for production
    },
  },
}; 