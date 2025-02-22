export const config = {
  environment: 'development',
  apiUrl: process.env.SHOPIFY_APP_URL || 'http://localhost:3000',
  whatsapp: {
    apiVersion: 'v17.0',
    baseUrl: 'https://graph.facebook.com',
  },
  database: {
    url: process.env.DATABASE_URL || 'file:./dev.db',
  },
  logging: {
    level: 'debug',
    format: 'development',
  },
  webhooks: {
    rateLimits: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100, // Limit each shop to 100 requests per windowMs
    },
  },
}; 