export default async function sendWhatsAppMessage(
    phoneNumber: string,
    message: string,
    whatsappPhoneNumberId: string,
    whatsappAccessToken: string
): Promise<any> {
    try {
        // Format phone number to remove any special characters and ensure it starts with country code
        const formattedPhone = phoneNumber.replace(/\D/g, '');
        let finalPhone = formattedPhone;
        if (!formattedPhone.startsWith('254')) {
            // Add Kenya country code if not present
            finalPhone = `254${formattedPhone.replace(/^0+/, '')}`;
        }

        const response = await fetch(`https://graph.facebook.com/v17.0/${whatsappPhoneNumberId}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${whatsappAccessToken}`,
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