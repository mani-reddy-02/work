// Finance Utilities

export const ADMIN_COMMISSION_RATE = 0.20;
export const PROVIDER_SHARE_RATE = 0.80;

export interface RevenueBreakdown {
  grossAmount: number;
  adminCommission: number;
  providerShare: number;
}

/**
 * Calculates the revenue breakdown based on the global platform commission model.
 * 20% Admin Commission, 80% Provider Share.
 * 
 * @param grossAmount The total amount paid by the customer
 * @returns RevenueBreakdown object containing the split
 */
export const calculateRevenueBreakdown = (grossAmount: number): RevenueBreakdown => {
  return {
    grossAmount,
    adminCommission: grossAmount * ADMIN_COMMISSION_RATE,
    providerShare: grossAmount * PROVIDER_SHARE_RATE,
  };
};

/**
 * Formats a number as INR currency
 * @param amount Number to format
 * @param compact Whether to use compact notation (e.g. 1.2L) for large numbers
 * @returns Formatted string
 */
export const formatCurrency = (amount: number, compact: boolean = false): string => {
  if (compact) {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)}Cr`;
    }
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(2)}L`;
    }
    if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(1)}K`;
    }
  }
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};
