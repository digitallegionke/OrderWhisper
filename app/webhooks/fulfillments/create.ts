import { sendWhatsAppMessage } from "../../utils/whatsapp";
import { whatsappTemplates } from "../../config/whatsappTemplates";
import { authenticate } from "../../shopify.server";

interface ShopifyFulfillment {
    id: number;
    order_id: number;
    tracking_number?: string;
    tracking_url?: string;
}

interface OrderDetails {
    orderNumber: string;
    customerPhone?: string;
}

export default async function fulfillmentsCreate(topic: string, shop: string, body: string, webhookId: string) {
    if (!process.env.WHATSAPP_PHONE_NUMBER_ID || !process.env.WHATSAPP_ACCESS_TOKEN) {
        console.error("WhatsApp credentials are not properly configured. Please check WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN environment variables.");
        return;
    }

    try {
        const payload = JSON.parse(body) as ShopifyFulfillment;
        
        // Validate required fields
        if (!payload.id || !payload.order_id) {
            throw new Error('Required fulfillment fields are missing. Please check webhook include_fields configuration.');
        }

        // Extract relevant fulfillment information
        const fulfillmentId = payload.id;
        const orderId = payload.order_id;
        const trackingNumber = payload.tracking_number;
        const trackingUrl = payload.tracking_url;

        try {
            // Get order details using Shopify Admin API
            const orderDetails = await getOrderDetails(orderId.toString(), shop);
            
            if (!orderDetails) {
                console.warn(`Order details not found for order ${orderId}`);
                return;
            }

            // Prepare WhatsApp message using template
            const message = whatsappTemplates.fulfillmentCreated({
                orderNumber: orderDetails.orderNumber,
                trackingNumber,
                trackingUrl,
            });

            // Send WhatsApp notification
            if (orderDetails.customerPhone) {
                try {
                    await sendWhatsAppMessage({
                        to: orderDetails.customerPhone,
                        message,
                    });
                    console.log(`Successfully sent WhatsApp notification for fulfillment ${fulfillmentId}`);
                } catch (whatsappError) {
                    console.error("Error sending WhatsApp message:", whatsappError);
                    // Don't throw here to prevent webhook failure
                }
            } else {
                console.warn(`No phone number found for order ${orderId}`);
            }
        } catch (apiError) {
            console.error(`Error retrieving order details for order ${orderId}:`, apiError);
            // Don't throw here to prevent webhook failure
        }

        console.log(`Successfully processed fulfillment ${fulfillmentId} webhook`);
    } catch (error) {
        console.error("Error processing fulfillment webhook:", error);
        throw error; // Rethrow to ensure Shopify knows the webhook failed
    }
}

async function getOrderDetails(orderId: string, shop: string): Promise<OrderDetails | null> {
    try {
        // Create a fake request object for authentication
        const fakeRequest = new Request(`https://${shop}/admin/api`, {
            headers: {
                'X-Shopify-Shop-Domain': shop,
            },
        });

        const { admin } = await authenticate.admin(fakeRequest);
        
        const response = await admin.graphql(
            `query getOrder($id: ID!) {
                order(id: $id) {
                    id
                    name
                    customer {
                        phone
                    }
                }
            }`,
            {
                variables: {
                    id: `gid://shopify/Order/${orderId}`,
                },
            },
        );

        const responseJson = await response.json();
        const order = responseJson.data?.order;

        if (!order) {
            return null;
        }

        return {
            orderNumber: order.name,
            customerPhone: order.customer?.phone,
        };
    } catch (error) {
        console.error(`Error fetching order details from Shopify API:`, error);
        throw error;
    }
}