import sendWhatsAppMessage from '../../helperFunctions/sendWhatsAppMessage';
import whatsappTemplates from '../../../config/whatsappTemplates';

interface ShopifyFulfillment {
    id: number;
    order_id: number;
    status: string;
    tracking_number?: string;
    tracking_url?: string;
    order?: {
        order_number: string;
        customer?: {
            phone?: string;
            email?: string;
            first_name?: string;
        };
    };
}

export default async function fulfillmentsCreate(topic: string, shop: string, body: string) {
    try {
        const fulfillment = JSON.parse(body) as ShopifyFulfillment;
        const orderId = fulfillment.order_id;
        const orderNumber = fulfillment.order?.order_number;
        const phone = fulfillment.order?.customer?.phone;
        const whatsappPhoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
        const whatsappAccessToken = process.env.WHATSAPP_ACCESS_TOKEN;

        // Validate webhook configuration
        if (!whatsappPhoneNumberId || !whatsappAccessToken) {
            const error = new Error('WhatsApp configuration is missing. Please check WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN environment variables.');
            console.error(error);
            throw error;
        }

        // Validate fulfillment data
        if (!orderId || !orderNumber) {
            const error = new Error('Required fulfillment fields are missing. Please check webhook include_fields configuration.');
            console.error(error);
            throw error;
        }

        // Log fulfillment details for debugging
        console.log(`Processing fulfillment for order #${orderNumber} (${fulfillment.status})`);

        if (phone) {
            let message = whatsappTemplates.orderFulfilled(orderNumber);
            
            // Add tracking information if available
            if (fulfillment.tracking_number && fulfillment.tracking_url) {
                message += `\nTrack your order here: ${fulfillment.tracking_url}`;
            }

            try {
                await sendWhatsAppMessage(phone, message, whatsappPhoneNumberId, whatsappAccessToken);
                console.log(`WhatsApp message sent for order #${orderNumber} fulfillment`);
            } catch (error) {
                // Log WhatsApp error but don't fail the webhook
                console.error(`Failed to send WhatsApp message for order #${orderNumber} fulfillment:`, error);
                // You might want to implement a retry mechanism or queue here
            }
        } else {
            console.warn(`No phone number found for order ${orderNumber}. Customer email: ${fulfillment.order?.customer?.email || 'not provided'}`);
        }

        console.log('Successfully handled fulfillments/create webhook');
    } catch (error) {
        console.error('Failed to handle fulfillments/create webhook:', error);
        throw error; // Rethrow to ensure Shopify knows the webhook failed
    }
}