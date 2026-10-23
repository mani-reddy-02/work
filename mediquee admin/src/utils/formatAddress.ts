/**
 * Utility to format raw address data (which may be a string, JSON object, or JSON array)
 * into a clean, human-readable address line.
 */
export const formatAddress = (rawAddress: any): string => {
  if (!rawAddress) return '—';

  if (typeof rawAddress === 'object') {
    if (Array.isArray(rawAddress)) {
      if (rawAddress.length === 0) return '—';
      const firstValid = rawAddress.find(a => a && (a.street || a.city || a.addressLine1 || a.address));
      return formatAddress(firstValid || rawAddress[0]);
    }

    const typePrefix = rawAddress.type && rawAddress.type !== 'Other' ? `(${rawAddress.type}) ` : '';
    const parts = [
      rawAddress.street || rawAddress.addressLine1 || rawAddress.address || rawAddress.houseNo,
      rawAddress.area || rawAddress.addressLine2 || rawAddress.locality || rawAddress.landmark,
      rawAddress.city,
      rawAddress.state,
      rawAddress.pincode || rawAddress.pinCode || rawAddress.postalCode,
    ].filter(Boolean);

    if (parts.length === 0) return '—';
    return `${typePrefix}${parts.join(', ')}`.trim();
  }

  if (typeof rawAddress === 'string') {
    const trimmed = rawAddress.trim();
    if (!trimmed || trimmed === 'N/A' || trimmed === 'null' || trimmed === 'undefined' || trimmed === '—') {
      return '—';
    }

    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        return formatAddress(parsed);
      } catch {
        return trimmed;
      }
    }

    return trimmed;
  }

  return String(rawAddress);
};
