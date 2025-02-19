import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';

interface WhatsAppResponse {
    messaging_product: string;
    contacts: Array<{ wa_id: string }>;
    messages: Array<{ id: string }>;
}

interface WhatsAppError {
    error: {
        message: string;
        type: string;
        code: number;
        fbtrace_id: string;
    };
}

export default async function sendWhatsAppMessage(
    phoneNumber: string,
    message: string,
    whatsappPhoneNumberId: string,
    whatsappAccessToken: string
): Promise<WhatsAppResponse> {
    try {
        // Parse and validate phone number
        let parsedNumber;
        try {
            parsedNumber = parsePhoneNumber(phoneNumber, 'KE');
            if (!parsedNumber || !isValidPhoneNumber(parsedNumber.number)) {
                throw new Error(`Invalid phone number: ${phoneNumber}`);
            }
        } catch (error) {
            console.error('Phone number parsing error:', error);
            throw new Error(`Invalid phone number format: ${phoneNumber}`);
        }

        // Format phone number to E.164 format without the '+' symbol
        const finalPhone = parsedNumber.number.replace('+', '');

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

        const data = await response.json();

        if (!response.ok) {
            const errorData = data as WhatsAppError;
            console.error('WhatsApp API error:', errorData);
            throw new Error(`WhatsApp API error: ${errorData.error.message}`);
        }

        console.log('WhatsApp message sent successfully:', data);
        return data as WhatsAppResponse;
    } catch (error) {
        console.error('Failed to send WhatsApp message:', error);
        throw error;
    }
}