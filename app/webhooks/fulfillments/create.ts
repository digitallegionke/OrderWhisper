import sendWhatsAppMessage from '../../helperFunctions/sendWhatsAppMessage';

interface ShopifyFulfillment {
    order_id: number;
    order?: {
        customer?: {
            phone?: string;
        };
    };
}

export default async function fulfillmentsCreate(topic: string, shop: string, body: string) {
    try {
        const fulfillment = JSON.parse(body) as ShopifyFulfillment;
        const orderId = fulfillment.order_id;
        const phone = fulfillment.order?.customer?.phone;
        const whatsappPhoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
        const whatsappAccessToken = process.env.WHATSAPP_ACCESS_TOKEN;

        if (!whatsappPhoneNumberId || !whatsappAccessToken) {
            throw new Error('WhatsApp configuration is missing. Please check WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN environment variables.');
        }

        if (!orderId) {
            throw new Error('Required fulfillment fields are missing. Please check webhook include_fields configuration.');
        }

        if (phone) {
            const message = `Your order #${orderId} has been dispatched! Expect delivery soon.`;

            await sendWhatsAppMessage(phone, message, whatsappPhoneNumberId, whatsappAccessToken);
            console.log(`WhatsApp message sent for order #${orderId} fulfillment`);
        } else {
            console.warn(`No phone number found for order ${orderId}`);
        }

        console.log('Successfully handled fulfillments/create webhook');
    } catch (error) {
        console.error('Failed to handle fulfillments/create webhook:', error);
        throw error; // Rethrow to ensure Shopify knows the webhook failed
    }
}