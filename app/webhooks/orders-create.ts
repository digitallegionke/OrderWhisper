import { DeliveryMethod } from "@shopify/shopify-app-remix/server";
import { sendWhatsAppMessage } from "../helperFunctions/sendWhatsAppMessage";
import { whatsappTemplates } from "../config/whatsappTemplates";
import { formatPhoneNumber, isValidPhoneNumber } from "../utils/phone";
import { webhookRateLimiter } from "../middleware/rateLimiter";

interface ShopifyOrder {
    id: number;
    order_number: string;
    email?: string;
    total_price: string;
    customer?: {
        phone?: string;
    };
}

async function ordersCreateCallback(topic: string, shop: string, body: string, webhookId: string) {
    // Apply rate limiting
    const { limited, headers } = webhookRateLimiter(shop);
    
    if (limited) {
        return new Response("Too many requests, please try again later.", {
            status: 429,
            headers,
        });
    }

    if (!process.env.WHATSAPP_PHONE_NUMBER_ID || !process.env.WHATSAPP_ACCESS_TOKEN) {
        console.error("WhatsApp credentials are not properly configured. Please check WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN environment variables.");
        return;
    }

    try {
        const payload = JSON.parse(body) as ShopifyOrder;
        
        // Validate required fields
        if (!payload.id || !payload.order_number) {
            throw new Error('Required order fields are missing. Please check webhook include_fields configuration.');
        }

        // Extract relevant order information
        const orderId = payload.id;
        const customerEmail = payload.email;
        const customerPhone = payload.customer?.phone;
        const orderNumber = payload.order_number;
        const totalPrice = payload.total_price;
        
        // Prepare WhatsApp message using template
        const message = whatsappTemplates.orderCreated({
            orderNumber,
            totalPrice,
            customerEmail,
        });

        // Send WhatsApp notification if we have a valid phone number
        if (customerPhone && isValidPhoneNumber(customerPhone)) {
            const formattedPhone = formatPhoneNumber(customerPhone);
            try {
                await sendWhatsAppMessage({
                    to: formattedPhone,
                    message,
                });
                console.log(`Successfully sent WhatsApp notification for order ${orderId}`);
            } catch (whatsappError) {
                console.error("Error sending WhatsApp message:", whatsappError);
                // Don't throw here to prevent webhook failure
            }
        } else {
            console.warn(`No valid phone number found for order ${orderId}`);
        }

        console.log(`Successfully processed order ${orderId} webhook`);
    } catch (error) {
        console.error("Error processing order webhook:", error);
        throw error; // Rethrow to ensure Shopify knows the webhook failed
    }
}

export const orderCreatedWebhook = {
    deliveryMethod: DeliveryMethod.Http,
    callbackUrl: "/api/webhooks/orders/create",
    callback: ordersCreateCallback,
} as const;