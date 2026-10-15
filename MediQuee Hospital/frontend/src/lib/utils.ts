import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format patient address cleanly from stringified JSON, object, array, or plain text.
 * Handles database patterns like:
 * - '[{"type":"Home","street":"1","city":"adoni","pincode":"518302","state":"AP","id":"1790701277232"}]'
 * - '{"street":"123 Main St","city":"Hyderabad","state":"TS","pincode":"500001"}'
 * - 'Plot 42, Jubilee Hills, Hyderabad'
 * - null / undefined / ''
 */
export function formatPatientAddress(
  rawAddress: unknown,
  fallback = 'In-Person Lab / Clinic Walk-in'
): string {
  if (!rawAddress) return fallback;

  let data = rawAddress;

  // If string, check if it's JSON
  if (typeof rawAddress === 'string') {
    const trimmed = rawAddress.trim();
    if (!trimmed) return fallback;

    if (
      (trimmed.startsWith('[') && trimmed.endsWith(']')) ||
      (trimmed.startsWith('{') && trimmed.endsWith('}'))
    ) {
      try {
        data = JSON.parse(trimmed);
      } catch {
        data = trimmed;
      }
    } else {
      return trimmed;
    }
  }

  // If array of address objects
  if (Array.isArray(data)) {
    if (data.length === 0) return fallback;
    const target = data.find((item: any) => item?.isDefault) || data[0];
    return formatSingleAddressObj(target, fallback);
  }

  // If single address object
  if (typeof data === 'object' && data !== null) {
    return formatSingleAddressObj(data, fallback);
  }

  return String(data).trim() || fallback;
}

function formatSingleAddressObj(addr: any, fallback: string): string {
  if (!addr || typeof addr !== 'object') return fallback;

  const street = addr.street || addr.addressLine1 || addr.address || addr.line1 || '';
  const street2 = addr.addressLine2 || addr.line2 || addr.area || addr.landmark || '';
  const city = addr.city || addr.town || addr.district || '';
  const state = addr.state || addr.province || '';
  const pincode = addr.pincode || addr.pin || addr.zipCode || addr.postalCode || '';

  const rawParts = [street, street2, city, state].filter(Boolean).map((s: string) => String(s).trim());

  if (rawParts.length === 0 && !pincode) {
    return fallback;
  }

  const formatWord = (word: string) => {
    if (!word) return '';
    if (word.length <= 3) return word.toUpperCase();
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  };

  const formattedParts = rawParts.map(p => {
    return p.split(/\s+/).map(formatWord).join(' ');
  });

  let result = formattedParts.join(', ');
  if (pincode) {
    result += (result ? ' - ' : '') + String(pincode).trim();
  }

  if (addr.type && typeof addr.type === 'string' && addr.type.toLowerCase() !== 'other') {
    const typeLabel = addr.type.charAt(0).toUpperCase() + addr.type.slice(1).toLowerCase();
    result += ` (${typeLabel})`;
  }

  return result || fallback;
}
