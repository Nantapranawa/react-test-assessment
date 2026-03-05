
/**
 * Normalizes a phone number to a standard format for comparison.
 * Removes all non-digit characters and standardizes the country code prefix.
 * 
 * Examples:
 * 08123... -> 628123...
 * 8123...  -> 628123...
 * 628123... -> 628123...
 * +628123... -> 628123...
 */
export const normalizePhone = (phone: string | null | undefined): string => {
    if (!phone) return '';

    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');

    // If it starts with '0', replace with '62'
    if (cleaned.startsWith('0')) {
        return '62' + cleaned.substring(1);
    }

    // If it doesn't start with '62' and seems to be a local number (starts with 8), add '62'
    if (cleaned.startsWith('8')) {
        return '62' + cleaned;
    }

    return cleaned;
};

/**
 * Compares two phone numbers for equality after normalization.
 */
export const comparePhones = (phone1: string | null | undefined, phone2: string | null | undefined): boolean => {
    const p1 = normalizePhone(phone1);
    const p2 = normalizePhone(phone2);

    if (!p1 || !p2) return false;
    return p1 === p2;
};
