import { sendWhatsAppMessage } from "../../utils/whatsapp";

interface ShopifyOrder {
    id: number;
    order_number: string;
    customer?: {
        phone?: string;
    };
}

export default async function ordersCreate(topic: string, shop: string, body: string, webhookId: string) {
    const payload = JSON.parse(body);
    
    try {
        // Extract relevant order information
        const orderId = payload.id;
        const customerEmail = payload.email;
        const customerPhone = payload.phone || payload.customer?.phone;
        const orderNumber = payload.order_number;
        const totalPrice = payload.total_price;
        
        // Prepare WhatsApp message
        const message = `New Order #${orderNumber}!\n\n` +
            `Amount: $${totalPrice}\n` +
            `Customer: ${customerEmail}\n` +
            `Status: Order received`;

        // Send WhatsApp notification
        if (customerPhone) {
            await sendWhatsAppMessage({
                to: customerPhone,
                message: message,
            });
        }

        console.log(`Successfully processed order ${orderId} webhook`);
    } catch (error) {
        console.error("Error processing order webhook:", error);
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