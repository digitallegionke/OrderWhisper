import { Redis } from 'ioredis';
import crypto from 'crypto';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

interface SendMessageParams {
    to: string;
    message: string;
}

interface WhatsAppResponse {
    messaging_product: string;
    contacts: Array<{
        input: string;
        wa_id: string;
    }>;
    messages: Array<{
        id: string;
    }>;
}

/**
 * Encrypts sensitive data using environment-specific key
 */
function encryptSensitiveData(data: string): string {
    const envKey = process.env.ENCRYPTION_KEY;
    if (!envKey) {
        throw new Error('Encryption key not configured');
    }

    // In test environment, use a fixed key
    let key: Buffer;
    if (process.env.NODE_ENV === 'test') {
        key = Buffer.alloc(32).fill('test_key');
    } else {
        // For production, handle hex or raw key
        key = envKey.length === 64 
            ? Buffer.from(envKey, 'hex') 
            : Buffer.from(envKey).slice(0, 32);
    }

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${encrypted.toString('hex')}:${tag.toString('hex')}`;
}

/**
 * Validates phone number format
 */
function isValidPhoneNumber(phone: string): boolean {
    // Basic validation: must start with + and contain only digits after that
    return /^\+\d{10,15}$/.test(phone);
}

/**
 * Sends a WhatsApp message with rate limiting and encryption
 */
export async function sendWhatsAppMessage({ to, message }: SendMessageParams): Promise<WhatsAppResponse> {
    // Validate phone number format
    if (!isValidPhoneNumber(to)) {
        throw new Error('Invalid phone number');
    }

    // Validate environment variables
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

    if (!phoneNumberId || !accessToken) {
        throw new Error('WhatsApp credentials not configured');
    }

    // Validate rate limits from Redis
    const rateLimitKey = `whatsapp_rate_limit:${to}`;
    const currentTime = Date.now();
    const rateLimit = await redis.get(rateLimitKey);
    
    if (rateLimit) {
        throw new Error('Rate limit exceeded for this number. Please wait before sending another message.');
    }

    // Set rate limit (1 message per minute per number)
    await redis.set(rateLimitKey, currentTime, 'EX', 60);

    try {
        // Format phone number to remove any special characters and ensure it starts with country code
        const formattedPhone = to.replace(/\D/g, '');
        let finalPhone = formattedPhone;
        if (!formattedPhone.startsWith('254')) {
            finalPhone = `254${formattedPhone.replace(/^0+/, '')}`;
        }

        // Add request ID for tracking
        const requestId = crypto.randomUUID();

        // Encrypt sensitive data
        const encryptedToken = encryptSensitiveData(accessToken);

        const response = await fetch(`https://graph.facebook.com/v17.0/${phoneNumberId}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'X-Request-ID': requestId,
                'X-Encrypted-Token': encryptedToken
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
            console.error('WhatsApp API error:', {
                requestId,
                statusCode: response.status,
                error: errorData
            });
            throw new Error(`WhatsApp API error: ${JSON.stringify(errorData)}`);
        }

        const data = await response.json() as WhatsAppResponse;
        console.log('WhatsApp message sent successfully:', {
            requestId,
            messageId: data.messages?.[0]?.id
        });

        // Store success metrics in Redis
        await redis.incr('whatsapp_messages_sent_total');
        await redis.lpush('whatsapp_recent_messages', JSON.stringify({
            requestId,
            timestamp: currentTime,
            status: 'success',
            messageId: data.messages?.[0]?.id
        }));

        return data;
    } catch (error) {
        // Store error metrics in Redis
        await redis.incr('whatsapp_messages_failed_total');
        await redis.lpush('whatsapp_recent_errors', JSON.stringify({
            timestamp: currentTime,
            error: error instanceof Error ? error.message : 'Unknown error'
        }));

        console.error('Failed to send WhatsApp message:', error);
        throw error;
    }
}