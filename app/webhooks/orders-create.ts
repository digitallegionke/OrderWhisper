import { DeliveryMethod } from "@shopify/shopify-app-remix/server";
import { sendWhatsAppMessage } from "../helperFunctions/sendWhatsAppMessage";
import { whatsappTemplates } from "../config/whatsappTemplates";
import { formatPhoneNumber, isValidPhoneNumber } from "../utils/phone";
import { webhookRateLimiter } from "../middleware/rateLimiter";
import { Redis } from 'ioredis';
import crypto from 'crypto';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

interface ShopifyOrder {
    id: number;
    order_number: string;
    email?: string;
    total_price: string;
    customer?: {
        phone?: string;
        email?: string;
        first_name?: string;
        last_name?: string;
    };
    created_at: string;
    financial_status?: string;
    fulfillment_status?: string;
}

/**
 * Verifies the webhook signature to ensure it's from Shopify
 */
function verifyWebhookSignature(body: string, headers: Headers): boolean {
    const hmac = headers.get('X-Shopify-Hmac-Sha256');
    const topic = headers.get('X-Shopify-Topic');
    const shopDomain = headers.get('X-Shopify-Shop-Domain');

    if (!hmac || !topic || !shopDomain) {
        console.error('Missing required webhook headers');
        return false;
    }

    const secret = process.env.SHOPIFY_API_SECRET;
    if (!secret) {
        console.error('SHOPIFY_API_SECRET not configured');
        return false;
    }

    const hash = crypto
        .createHmac('sha256', secret)
        .update(body, 'utf8')
        .digest('base64');

    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(hmac));
}

async function ordersCreateCallback(topic: string, shop: string, body: string, webhookId: string, headers: Headers) {
    // Verify webhook signature
    if (!verifyWebhookSignature(body, headers)) {
        console.error('Invalid webhook signature');
        return new Response('Invalid signature', { status: 401 });
    }

    // Apply rate limiting
    const { limited, headers: rateLimitHeaders } = webhookRateLimiter(shop);
    
    if (limited) {
        return new Response("Too many requests, please try again later.", {
            status: 429,
            headers: rateLimitHeaders,
        });
    }

    if (!process.env.WHATSAPP_PHONE_NUMBER_ID || !process.env.WHATSAPP_ACCESS_TOKEN) {
        console.error("WhatsApp credentials are not properly configured");
        return new Response("Configuration error", { status: 500 });
    }

    try {
        const payload = JSON.parse(body) as ShopifyOrder;
        
        // Validate required fields
        if (!payload.id || !payload.order_number) {
            throw new Error('Required order fields are missing');
        }

        // Log order details
        console.log('Processing order:', {
            orderId: payload.id,
            orderNumber: payload.order_number,
            shop,
            timestamp: new Date().toISOString()
        });

        // Store order in Redis for tracking
        await redis.setex(
            `order:${payload.id}`,
            86400, // 24 hours TTL
            JSON.stringify({
                id: payload.id,
                number: payload.order_number,
                status: 'processing',
                created_at: payload.created_at,
                shop
            })
        );

        // Extract order information
        const orderId = payload.id;
        const customerEmail = payload.customer?.email || payload.email;
        const customerPhone = payload.customer?.phone;
        const orderNumber = payload.order_number;
        const totalPrice = payload.total_price;
        const customerName = [payload.customer?.first_name, payload.customer?.last_name]
            .filter(Boolean)
            .join(' ');
        
        // Prepare WhatsApp message
        const message = whatsappTemplates.orderCreated({
            orderNumber,
            totalPrice,
            customerEmail,
            customerName
        });

        // Send WhatsApp notification if we have a valid phone number
        if (customerPhone && isValidPhoneNumber(customerPhone)) {
            const formattedPhone = formatPhoneNumber(customerPhone);
            try {
                const result = await sendWhatsAppMessage({
                    to: formattedPhone,
                    message,
                });

                // Update order status in Redis
                await redis.hset(`order:${orderId}:notifications`, {
                    whatsapp_sent: 'true',
                    whatsapp_message_id: result.messages[0]?.id,
                    sent_at: new Date().toISOString()
                });

                console.log(`Successfully sent WhatsApp notification for order ${orderId}`);
            } catch (whatsappError) {
                console.error("Error sending WhatsApp message:", {
                    orderId,
                    error: whatsappError instanceof Error ? whatsappError.message : 'Unknown error'
                });

                // Store failed notification attempt
                await redis.hset(`order:${orderId}:notifications`, {
                    whatsapp_sent: 'false',
                    error: whatsappError instanceof Error ? whatsappError.message : 'Unknown error',
                    attempted_at: new Date().toISOString()
                });
            }
        } else {
            console.warn(`No valid phone number found for order ${orderId}`);
            
            // Log missing phone number
            await redis.hset(`order:${orderId}:notifications`, {
                whatsapp_sent: 'skipped',
                reason: 'no_valid_phone',
                checked_at: new Date().toISOString()
            });
        }

        console.log(`Successfully processed order ${orderId} webhook`);
        return new Response('OK', { status: 200 });
    } catch (error) {
        console.error("Error processing order webhook:", {
            shop,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        });

        // Store error in Redis for monitoring
        await redis.lpush('webhook_errors', JSON.stringify({
            topic,
            shop,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        }));

        return new Response('Internal Server Error', { status: 500 });
    }
}

export { ordersCreateCallback };

export const orderCreatedWebhook = {
    deliveryMethod: DeliveryMethod.Http,
    callbackUrl: "/api/webhooks/orders/create",
    callback: ordersCreateCallback,
} as const;