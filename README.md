# OrderWhisper - Shopify WhatsApp Notifications

A Shopify app that sends WhatsApp notifications for order updates.

## Features

- WhatsApp notifications for order creation
- WhatsApp notifications for order fulfillment
- Customizable notification settings
- Secure WhatsApp Business API integration

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

### Option 1: Deploy to Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/orderwhisper)

1. Click the "Deploy on Railway" button above
2. Create a new Railway account or log in
3. Fill in the required environment variables:
   - SHOPIFY_API_KEY: Your Shopify API key
   - SHOPIFY_API_SECRET: Your Shopify API secret
   - WHATSAPP_PHONE_NUMBER_ID: Your WhatsApp Business phone number ID
   - WHATSAPP_ACCESS_TOKEN: Your WhatsApp Business API token
4. Click "Deploy"
5. Once deployed, update your Shopify app settings with the new Railway URL

### Manual Railway Deployment

1. Install Railway CLI:
```bash
npm install -g @railway/cli
```

2. Login to Railway:
```bash
railway login
```

3. Create a new project:
```bash
railway init
```

4. Set up environment variables:
```bash
railway vars set SHOPIFY_API_KEY=your_api_key
railway vars set SHOPIFY_API_SECRET=your_api_secret
railway vars set WHATSAPP_PHONE_NUMBER_ID=your_whatsapp_id
railway vars set WHATSAPP_ACCESS_TOKEN=your_whatsapp_token
```

5. Deploy the app:
```bash
railway up
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

3. Monitor the app:
   - Check server logs
   - Monitor WhatsApp API usage
   - Track order notifications

## Security Considerations

- Never commit environment files (.env, .env.production) to version control
- Keep your WhatsApp Business API credentials secure
- Regularly rotate your API keys and tokens
- Use HTTPS in production
- Follow Shopify's security best practices

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
