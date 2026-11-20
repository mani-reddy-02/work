import { API_BASE_URL } from '../lib/apiConfig';

export type ServiceType = 
  | 'OP_BOOKING' 
  | 'VIDEO_CONSULTATION' 
  | 'LAB_BOOKING' 
  | 'HOME_SAMPLE' 
  | 'HOME_NURSING';

export interface PaymentOrderResponse {
  orderId: string;
  amount: number;
  amountInINR: number;
  currency: string;
  keyId: string;
  serviceType: ServiceType;
  bookingId: string;
  description: string;
  receipt: string;
}

export interface VerifyPaymentPayload {
  orderId: string;
  paymentId: string;
  signature: string;
  serviceType: ServiceType;
  bookingId: string;
}

export interface InitiatePaymentOptions {
  serviceType: ServiceType;
  bookingId: string;
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  serviceName?: string;
  onSuccess: (verificationResult: any) => void;
  onFailure: (errorMessage: string) => void;
}

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('mediquee_token') || localStorage.getItem('token') || localStorage.getItem('auth_token') || sessionStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

export const paymentApi = {
  /**
   * 1. Fetches server Razorpay public config (keyId)
   */
  async getConfig(): Promise<{ success: boolean; data?: { keyId: string; isConfigured: boolean }; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/payments/config`, {
        headers: getAuthHeaders()
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to fetch payment configuration' };
    }
  },

  /**
   * 2. Requests an authoritative order creation from backend
   */
  async createPaymentOrder(
    serviceType: ServiceType,
    bookingId: string,
    notes?: Record<string, string>
  ): Promise<{ success: boolean; data?: PaymentOrderResponse; error?: string | { message: string } }> {
    try {
      const res = await fetch(`${API_BASE_URL}/payments/create-order`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          serviceType,
          bookingId,
          notes
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        return {
          success: false,
          error: json.error?.message || json.error || 'Failed to initiate payment order'
        };
      }

      return { success: true, data: json.data };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error while connecting to payment gateway' };
    }
  },

  /**
   * 3. Sends Razorpay payment signature for cryptographic verification
   */
  async verifyPayment(
    payload: VerifyPaymentPayload
  ): Promise<{ success: boolean; data?: any; error?: string | { message: string } }> {
    try {
      const res = await fetch(`${API_BASE_URL}/payments/verify`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        return {
          success: false,
          error: json.error?.message || json.error || 'Payment verification failed'
        };
      }

      return { success: true, data: json.data };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error during payment verification' };
    }
  },

  /**
   * 4. Helper to ensure Razorpay SDK script is loaded
   */
  async loadRazorpayScript(): Promise<boolean> {
    if ((window as any).Razorpay) return true;

    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  },

  /**
   * 5. Unified End-to-End Razorpay Checkout Trigger
   */
  async initiatePayment(options: InitiatePaymentOptions) {
    const {
      serviceType,
      bookingId,
      patientName,
      patientPhone,
      patientEmail,
      serviceName,
      onSuccess,
      onFailure
    } = options;

    const isLoaded = await this.loadRazorpayScript();
    if (!isLoaded || !(window as any).Razorpay) {
      onFailure('Unable to load Razorpay payment gateway. Please check your internet connection.');
      return;
    }

    // 1. Create order on backend (amount calculated server-side from Prisma)
    const orderRes = await this.createPaymentOrder(serviceType, bookingId);
    if (!orderRes.success || !orderRes.data) {
      const errMsg = typeof orderRes.error === 'object' ? orderRes.error.message : (orderRes.error || 'Failed to initialize payment.');
      onFailure(errMsg);
      return;
    }

    const orderData = orderRes.data;

    // 2. Open standard Razorpay Checkout
    const razorpayOptions = {
      key: orderData.keyId,
      amount: orderData.amount, // in paise
      currency: orderData.currency || 'INR',
      name: 'MediQuee Healthcare',
      description: orderData.description || serviceName || 'Healthcare Service Payment',
      image: '/favicon.png',
      order_id: orderData.orderId,
      prefill: {
        name: patientName || '',
        contact: patientPhone || '',
        email: patientEmail || ''
      },
      theme: {
        color: '#1769E0'
      },
      modal: {
        ondismiss: () => {
          onFailure('Payment cancelled by user.');
        }
      },
      handler: async (response: {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
      }) => {
        // 3. Cryptographically verify payment on server
        const verifyRes = await paymentApi.verifyPayment({
          orderId: response.razorpay_order_id,
          paymentId: response.razorpay_payment_id,
          signature: response.razorpay_signature,
          serviceType,
          bookingId
        });

        if (verifyRes.success) {
          onSuccess(verifyRes.data);
        } else {
          const verifyErrMsg = typeof verifyRes.error === 'object' 
            ? verifyRes.error.message 
            : (verifyRes.error || 'Payment verification failed on server.');
          onFailure(verifyErrMsg);
        }
      }
    };

    const rzpInstance = new (window as any).Razorpay(razorpayOptions);
    rzpInstance.on('payment.failed', (failRes: any) => {
      onFailure(failRes?.error?.description || 'Payment transaction failed.');
    });
    rzpInstance.open();
  }
};
