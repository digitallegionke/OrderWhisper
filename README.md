# OrderWhisper - Shopify WhatsApp Notifications

A Shopify app that sends WhatsApp notifications for order updates.

## Features

- WhatsApp notifications for order creation
- WhatsApp notifications for order fulfillment
- Customizable notification settings
- Secure WhatsApp Business API integration
- Health check endpoint for monitoring
- Built-in error tracking and logging
- Production-ready deployment configurations

## Prerequisites

- Node.js 18.x or higher
- npm 8.x or higher
- A Shopify Partner account
- A WhatsApp Business account
- Meta Business API access

## Development Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd whatsapp-notification
```

2. Install dependencies:
```bash
npm install
```

3. Copy the example environment file:
```bash
cp .env.example .env
```

4. Update the environment variables in `.env` with your credentials

5. Start the development server:
```bash
npm run dev
```

## Production Deployment

### Option 1: Deploy to DigitalOcean (Recommended)

[![Deploy to DigitalOcean](https://www.deploytodo.com/do-btn-blue.svg)](https://cloud.digitalocean.com/apps/new?repo=https://github.com/yourusername/orderwhisper/tree/main)

1. Click the "Deploy to DigitalOcean" button above
2. Create a DigitalOcean account or log in
3. The app.yaml configuration will be automatically loaded
4. Fill in the required environment variables:
   - SHOPIFY_API_KEY: Your Shopify API key
   - SHOPIFY_API_SECRET: Your Shopify API secret
   - WHATSAPP_PHONE_NUMBER_ID: Your WhatsApp Business phone number ID
   - WHATSAPP_ACCESS_TOKEN: Your WhatsApp Business API token
5. Choose your deployment region
6. Click "Deploy to DigitalOcean"

### Manual DigitalOcean Deployment

1. Install doctl (DigitalOcean CLI):
```bash
brew install doctl # macOS
```

2. Authenticate with DigitalOcean:
```bash
doctl auth init
```

3. Create a new app:
```bash
doctl apps create --spec app.yaml
```

4. Set up environment variables:
```bash
doctl apps update YOUR_APP_ID --set-env-vars "SHOPIFY_API_KEY=your_key,SHOPIFY_API_SECRET=your_secret"
```

### Option 2: Manual Deployment

1. Create a production environment file:
```bash
cp .env.example .env.production
```

2. Update `.env.production` with your production credentials:
- SHOPIFY_API_KEY: Your Shopify API key
- SHOPIFY_API_SECRET: Your Shopify API secret
- HOST: Your production domain
- SHOPIFY_APP_URL: Your production domain
- WHATSAPP_PHONE_NUMBER_ID: Your WhatsApp Business phone number ID
- WHATSAPP_ACCESS_TOKEN: Your WhatsApp Business API token

3. Build the app:
```bash
npm run build
```

4. Start the production server:
```bash
npm start
```

## Post-Deployment Steps

1. Update your Shopify app settings:
   - App URL: Your new production URL
   - Allowed redirection URL(s): Add your production URLs
   - Webhook endpoints: Update to use production URLs

2. Test the app:
   - Create a test order
   - Check WhatsApp notifications
   - Verify webhook functionality
   - Test health check endpoint (/healthcheck)

3. Monitor the app:
   - Check server logs in DigitalOcean dashboard
   - Monitor WhatsApp API usage
   - Track order notifications
   - Set up alerts for health check failures
   - Configure error tracking (e.g., Sentry)
   - Set up performance monitoring

## Production Monitoring

The app includes built-in monitoring capabilities:

1. Health Check:
   - Endpoint: `/healthcheck`
   - Monitors: Application status, database connectivity
   - Automatically monitored by DigitalOcean
   - Alerts on health check failures

2. Error Tracking:
   - Built-in error logging
   - Logs viewable in DigitalOcean dashboard
   - Ready for integration with error tracking services
   - Supports context and metadata

3. Performance Metrics:
   - Request timing
   - WhatsApp API latency
   - Database performance
   - Memory usage
   - CPU utilization tracking
   - Automatic scaling triggers

4. Logging:
   - Structured JSON logs
   - Timestamp and correlation IDs
   - Log forwarding to external services
   - Log retention and search

## Security Considerations

- Never commit environment files (.env, .env.production) to version control
- Keep your WhatsApp Business API credentials secure
- Regularly rotate your API keys and tokens
- Use HTTPS in production (automatically configured by DigitalOcean)
- Follow Shopify's security best practices
- Monitor for unusual activity
- Set up rate limiting for webhooks
- Enable security alerts
- Regular database backups (automated by DigitalOcean)
- SSL/TLS certificate management (automated by DigitalOcean)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
