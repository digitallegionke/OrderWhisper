/**
 * Formats a phone number for WhatsApp API
 * Ensures the number is in E.164 format (e.g., +1234567890)
 */
export function formatPhoneNumber(phone: string): string {
    // Remove all non-numeric characters
    let cleaned = phone.replace(/\D/g, '');
    
    // If number doesn't start with '+', add it
    if (!phone.startsWith('+')) {
        cleaned = '+' + cleaned;
    }
    
    return cleaned;
}

/**
 * Validates if a phone number is in a valid format for WhatsApp
 */
export function isValidPhoneNumber(phone: string): boolean {
    // Basic validation: should start with + and have 10-15 digits
    const phoneRegex = /^\+\d{10,15}$/;
    return phoneRegex.test(formatPhoneNumber(phone));
} 