import { parsePhoneNumber, isValidPhoneNumber as isValidNumber } from 'libphonenumber-js';

/**
 * Formats a phone number for WhatsApp API
 * Ensures the number is in E.164 format (e.g., +1234567890)
 * @throws Error if the phone number is invalid
 */
export function formatPhoneNumber(phone: string): string {
    try {
        const parsedNumber = parsePhoneNumber(phone);
        if (!parsedNumber) {
            throw new Error(`Could not parse phone number: ${phone}`);
        }
        return parsedNumber.format('E.164');
    } catch (error) {
        console.error(`Error formatting phone number: ${phone}`, error);
        throw error;
    }
}

/**
 * Validates if a phone number is in a valid format for WhatsApp
 * Uses libphonenumber-js for robust validation
 */
export function isValidPhoneNumber(phone: string): boolean {
    try {
        return isValidNumber(phone);
    } catch (error) {
        console.error(`Error validating phone number: ${phone}`, error);
        return false;
    }
}

/**
 * Gets the country code from a phone number
 * @returns The country code (e.g., 'US', 'GB', etc.) or null if invalid
 */
export function getPhoneNumberCountry(phone: string): string | null {
    try {
        const parsedNumber = parsePhoneNumber(phone);
        return parsedNumber?.country || null;
    } catch (error) {
        console.error(`Error getting country from phone number: ${phone}`, error);
        return null;
    }
} 