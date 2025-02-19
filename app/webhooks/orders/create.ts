import sendWhatsAppMessage from '../../helperFunctions/sendWhatsAppMessage';

interface ShopifyOrder {
    id: number;
    order_number: string;
    customer?: {
        phone?: string;
    };
}

export default async function ordersCreate(topic: string, shop: string, body: string) {
    try {
        const order = JSON.parse(body) as ShopifyOrder;
        const phone = order.customer?.phone;
        const whatsappPhoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
        const whatsappAccessToken = process.env.WHATSAPP_ACCESS_TOKEN;

        if (!whatsappPhoneNumberId || !whatsappAccessToken) {
            throw new Error('WhatsApp configuration is missing. Please check WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN environment variables.');
        }

        if (!order.id || !order.order_number) {
            throw new Error('Required order fields are missing. Please check webhook include_fields configuration.');
        }

        if (phone) {
            const message = `Thank you for your order! Order #${order.order_number} has been placed.`;

            await sendWhatsAppMessage(phone, message, whatsappPhoneNumberId, whatsappAccessToken);
            console.log(`WhatsApp message sent for order #${order.order_number}`);
        } else {
            console.warn(`No phone number found for order #${order.order_number}`);
        }

        console.log('Successfully handled orders/create webhook');
    } catch (error) {
        console.error('Failed to handle orders/create webhook:', error);
        throw error; // Rethrow to ensure Shopify knows the webhook failed
    }
}