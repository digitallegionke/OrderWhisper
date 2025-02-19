interface SendMessageParams {
    to: string;
    message: string;
}

export async function sendWhatsAppMessage({ to, message }: SendMessageParams): Promise<any> {
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

    if (!phoneNumberId || !accessToken) {
        throw new Error('WhatsApp credentials not configured');
    }

    try {
        // Format phone number to remove any special characters and ensure it starts with country code
        const formattedPhone = to.replace(/\D/g, '');
        let finalPhone = formattedPhone;
        if (!formattedPhone.startsWith('254')) {
            // Add Kenya country code if not present
            finalPhone = `254${formattedPhone.replace(/^0+/, '')}`;
        }

        const response = await fetch(`https://graph.facebook.com/v17.0/${phoneNumberId}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messaging_product: "whatsapp",
                to: finalPhone,
                type: "text",
                text: {
                    body: message
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`WhatsApp API error: ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();
        console.log('WhatsApp message sent successfully:', data);
        return data;
    } catch (error) {
        console.error('Failed to send WhatsApp message:', error);
        throw error;
    }
}