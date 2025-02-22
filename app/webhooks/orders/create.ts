import { sendWhatsAppMessage } from "~/utils/whatsapp";
import whatsappTemplates from '~/config/whatsappTemplates';
import { isNotificationEnabled } from "~/services/notificationSettings.server";
import { logger } from "~/utils/logger";

interface ShopifyOrder {
    id: number;
    order_number: string;
    customer?: {
        phone?: string;
        email?: string;
        first_name?: string;
    };
}

export default async function ordersCreate(topic: string, shop: string, body: string, webhookId: string) {
    try {
        // Check if notifications are enabled for this event
        const isEnabled = await isNotificationEnabled(shop, "orders/create");
        if (!isEnabled) {
            logger.info("Notifications disabled for orders/create", { shop });
            return;
        }

        const order: ShopifyOrder = JSON.parse(body);
        
        // Validate webhook configuration
        const whatsappPhoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
        const whatsappAccessToken = process.env.WHATSAPP_ACCESS_TOKEN;

        if (!whatsappPhoneNumberId || !whatsappAccessToken) {
            const error = new Error('WhatsApp configuration is missing. Please check WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN environment variables.');
            logger.error('WhatsApp configuration missing', error, { shop });
            throw error;
        }

        // Validate order data
        if (!order.id || !order.order_number) {
            const error = new Error('Required order fields are missing. Please check webhook include_fields configuration.');
            logger.error('Missing order fields', error, { shop, orderId: order.id });
            throw error;
        }

        // Log order details for debugging
        logger.info(`Processing order`, { 
            shop,
            orderNumber: order.order_number,
            customerName: order.customer?.first_name || 'customer'
        });

        const phone = order.customer?.phone;

        if (phone) {
            const message = whatsappTemplates.orderCreated(order.order_number);

            try {
                await sendWhatsAppMessage({
                    to: phone,
                    message: message,
                });
                logger.info('WhatsApp message sent', { 
                    shop,
                    orderNumber: order.order_number,
                    phone 
                });
            } catch (error) {
                // Log WhatsApp error but don't fail the webhook
                logger.error('Failed to send WhatsApp message', error as Error, {
                    shop,
                    orderNumber: order.order_number,
                    phone
                });
                // You might want to implement a retry mechanism or queue here
            }
        } else {
            logger.warn('No phone number found for order', {
                shop,
                orderNumber: order.order_number,
                customerEmail: order.customer?.email || 'not provided'
            });
        }

        logger.info('Successfully handled orders/create webhook', { shop });
    } catch (error) {
        logger.error("Error processing order webhook", error as Error, { shop });
        throw error;
    }
}

async function sendWhatsAppMessage({ to, message }: { to: string; message: string }) {
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

    try {
        const response = await fetch(
            `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`,
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    messaging_product: "whatsapp",
                    to: to,
                    type: "text",
                    text: { body: message },
                }),
            }
        );

        if (!response.ok) {
            throw new Error(`WhatsApp API error: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error sending WhatsApp message:", error);
        throw error;
    }
}