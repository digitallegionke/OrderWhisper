import { sendWhatsAppMessage } from "../../utils/whatsapp";
import { whatsappTemplates } from "../../config/whatsappTemplates";
import { formatPhoneNumber, isValidPhoneNumber } from "../../utils/phone";
import { sessionStorage } from "../../shopify.server";

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

            // Send WhatsApp notification if we have a valid phone number
            if (orderDetails.customerPhone && isValidPhoneNumber(orderDetails.customerPhone)) {
                const formattedPhone = formatPhoneNumber(orderDetails.customerPhone);
                try {
                    await sendWhatsAppMessage({
                        to: formattedPhone,
                        message,
                    });
                    console.log(`Successfully sent WhatsApp notification for fulfillment ${fulfillmentId}`);
                } catch (whatsappError) {
                    console.error("Error sending WhatsApp message:", whatsappError);
                    // Don't throw here to prevent webhook failure
                }
            } else {
                console.warn(`No valid phone number found for order ${orderId}`);
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
        // Get the offline session from storage
        const session = await sessionStorage.findSessionsByShop(shop);
        
        if (!session || session.length === 0) {
            throw new Error(`No session found for shop ${shop}`);
        }

        // Use the first valid session
        const accessToken = session[0].accessToken;
        
        if (!accessToken) {
            throw new Error('No access token found in session');
        }

        const headers = new Headers({
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': accessToken,
        });

        const response = await fetch(`https://${shop}/admin/api/2024-01/graphql.json`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                query: `
                    query getOrder($id: ID!) {
                        order(id: $id) {
                            id
                            name
                            customer {
                                phone
                            }
                        }
                    }
                `,
                variables: {
                    id: `gid://shopify/Order/${orderId}`,
                },
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const { data, errors } = await response.json();

        if (errors?.length > 0) {
            console.error("GraphQL Errors:", errors);
            throw new Error("GraphQL query failed");
        }

        const order = data?.order;

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