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

## Security Considerations

- Never commit environment files (.env, .env.production) to version control
- Keep your WhatsApp Business API credentials secure
- Regularly rotate your API keys and tokens
- Use HTTPS in production
- Follow Shopify's security best practices

## License

[Your License Here]
