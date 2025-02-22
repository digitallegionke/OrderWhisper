import { logger } from "./logger";

interface WhatsAppMessage {
    to: string;
    message: {
        type: string;
        template: {
            name: string;
            language: {
                code: string;
            };
            components: Array<{
                type: string;
                parameters: Array<{
                    type: string;
                    text: string;
                }>;
            }>;
        };
    };
}

export async function sendWhatsAppMessage({ to, message }: WhatsAppMessage): Promise<void> {
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

    if (!phoneNumberId || !accessToken) {
        const error = new Error("WhatsApp configuration missing");
        logger.error("WhatsApp configuration missing", error, { phoneNumberId: !!phoneNumberId });
        throw error;
    }

    try {
        const response = await fetch(
            `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                    messaging_product: "whatsapp",
                    to,
                    ...message,
                }),
            }
        );

        if (!response.ok) {
            const error = new Error(`WhatsApp API error: ${response.statusText}`);
            logger.error("WhatsApp API error", error, {
                status: response.status,
                to,
                template: message.template.name,
            });
            throw error;
        }

        logger.debug("WhatsApp message sent successfully", {
            to,
            template: message.template.name,
        });
    } catch (error) {
        logger.error("Failed to send WhatsApp message", error as Error, {
            to,
            template: message.template.name,
        });
        throw error;
    }
} 