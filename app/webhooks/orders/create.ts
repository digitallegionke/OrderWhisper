import sendWhatsAppMessage from '../../helperFunctions/sendWhatsAppMessage';
import whatsappTemplates from '../../../config/whatsappTemplates';

interface ShopifyOrder {
    id: number;
    order_number: string;
    customer?: {
        phone?: string;
        email?: string;
        first_name?: string;
    };
}

export default async function ordersCreate(topic: string, shop: string, body: string) {
    try {
        const order = JSON.parse(body) as ShopifyOrder;
        const phone = order.customer?.phone;
        const whatsappPhoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
        const whatsappAccessToken = process.env.WHATSAPP_ACCESS_TOKEN;

        // Validate webhook configuration
        if (!whatsappPhoneNumberId || !whatsappAccessToken) {
            const error = new Error('WhatsApp configuration is missing. Please check WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN environment variables.');
            console.error(error);
            throw error;
        }

        // Validate order data
        if (!order.id || !order.order_number) {
            const error = new Error('Required order fields are missing. Please check webhook include_fields configuration.');
            console.error(error);
            throw error;
        }

        // Log order details for debugging
        console.log(`Processing order #${order.order_number} for ${order.customer?.first_name || 'customer'}`);

        if (phone) {
            const message = whatsappTemplates.orderCreated(order.order_number);

            try {
                await sendWhatsAppMessage(phone, message, whatsappPhoneNumberId, whatsappAccessToken);
                console.log(`WhatsApp message sent for order #${order.order_number}`);
            } catch (error) {
                // Log WhatsApp error but don't fail the webhook
                console.error(`Failed to send WhatsApp message for order #${order.order_number}:`, error);
                // You might want to implement a retry mechanism or queue here
            }
        } else {
            console.warn(`No phone number found for order #${order.order_number}. Customer email: ${order.customer?.email || 'not provided'}`);
        }

        console.log('Successfully handled orders/create webhook');
    } catch (error) {
        console.error('Failed to handle orders/create webhook:', error);
        throw error; // Rethrow to ensure Shopify knows the webhook failed
    }
}