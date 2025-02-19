import { sendWhatsAppMessage } from "../../utils/whatsapp";

interface ShopifyFulfillment {
    order_id: number;
    order?: {
        customer?: {
            phone?: string;
        };
    };
}

export default async function fulfillmentsCreate(topic: string, shop: string, body: string, webhookId: string) {
    const payload = JSON.parse(body);
    
    try {
        // Extract relevant fulfillment information
        const fulfillmentId = payload.id;
        const orderId = payload.order_id;
        const trackingNumber = payload.tracking_number;
        const trackingUrl = payload.tracking_url;
        const orderDetails = await getOrderDetails(orderId, shop);
        
        // Prepare WhatsApp message
        const message = `Order #${orderDetails.orderNumber} Update!\n\n` +
            `Status: Order shipped\n` +
            (trackingNumber ? `Tracking Number: ${trackingNumber}\n` : '') +
            (trackingUrl ? `Track your order: ${trackingUrl}` : '');

        // Send WhatsApp notification
        if (orderDetails.customerPhone) {
            await sendWhatsAppMessage({
                to: orderDetails.customerPhone,
                message: message,
            });
        }

        console.log(`Successfully processed fulfillment ${fulfillmentId} webhook`);
    } catch (error) {
        console.error("Error processing fulfillment webhook:", error);
        throw error;
    }
}

async function getOrderDetails(orderId: string, shop: string) {
    // TODO: Implement order details retrieval using Shopify Admin API
    return {
        orderNumber: "placeholder",
        customerPhone: process.env.CUSTOMER_SUPPORT_PHONE_NUMBER,
    };
}