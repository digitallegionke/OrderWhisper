# Shopify WhatsApp Notifications

A Shopify app that sends WhatsApp notifications to customers for order updates and fulfillment tracking.

## Features

### Order Notifications
- Sends instant WhatsApp messages when new orders are created
- Includes order number, total price, and status
- Validates customer phone numbers before sending
- Uses templated messages for consistent communication

### Fulfillment Tracking
- Notifies customers when orders are shipped
- Includes tracking numbers and tracking URLs when available
- Integrates with Shopify's fulfillment system
- Automatically fetches order details using GraphQL API

### Technical Implementation

#### WhatsApp Integration
- Uses WhatsApp Business API for message sending
- Implements retry logic for failed messages
- Validates and formats phone numbers using libphonenumber-js
- Configurable message templates for different notification types

#### Webhook Handling
- Processes Shopify webhooks for orders/create and fulfillments/create events
- Implements rate limiting to prevent API abuse
- Validates webhook payloads
- Proper error handling and logging

#### Security & Performance
- Rate limiting on webhook endpoints
- Environment variable validation
- Secure storage of WhatsApp credentials
- Error monitoring and logging

### Project Structure

```
app/
├── config/
│   └── whatsappTemplates.ts     # Message templates
├── helperFunctions/
│   └── sendWhatsAppMessage.ts   # WhatsApp API integration
├── middleware/
│   └── rateLimiter.ts          # Rate limiting implementation
├── utils/
│   └── phone.ts                # Phone number utilities
└── webhooks/
    ├── orders-create.ts        # Order creation webhook
    └── fulfillments-create.ts  # Fulfillment webhook
```

## Environment Variables

```env
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_access_token
```

## Webhook Configuration

The app subscribes to the following Shopify webhooks:
- `orders/create`: Triggered when a new order is created
- `fulfillments/create`: Triggered when a fulfillment is created

Webhook configuration is managed in `shopify.app.toml`:
```toml
[[webhooks.subscriptions]]
topics = [ "orders/create" ]
uri = "/webhooks/orders/create"
include_fields = ["id", "order_number", "customer"]

[[webhooks.subscriptions]]
topics = [ "fulfillments/create" ]
uri = "/webhooks/fulfillments/create"
include_fields = ["order_id", "order"]
```

## Rate Limiting

The app implements rate limiting to prevent API abuse:
- 100 requests per 15 minutes per shop
- Configurable window and limit
- Returns 429 status code when limit exceeded

## Phone Number Handling

Phone numbers are handled using libphonenumber-js:
- Validation of phone number format
- Conversion to E.164 format for WhatsApp
- Country code detection
- Error handling for invalid numbers

## Message Templates

Message templates are centralized in `whatsappTemplates.ts`:
- Order creation notifications
- Fulfillment tracking notifications
- Customizable message format
- Support for dynamic content

## Error Handling

The app implements comprehensive error handling:
- WhatsApp API errors
- Invalid phone numbers
- Webhook payload validation
- GraphQL API errors
- Rate limit exceeded
- Missing environment variables

## Development

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables in .env

3. Run the development server:
```bash
npm run dev
```

## Testing

To test webhooks locally:
1. Use ngrok to expose local server
2. Update Shopify webhook URLs
3. Create test orders in development store

## Deployment

1. Ensure all environment variables are set
2. Configure proper database for session storage
3. Set up monitoring and logging
4. Deploy to your hosting platform

## Future Improvements

- Add unit tests for webhook handlers
- Implement message queueing system
- Add support for more notification types
- Enhance error monitoring and alerting
- Add performance monitoring
- Set up CI/CD pipeline
