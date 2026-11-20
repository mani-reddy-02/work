import Razorpay from 'razorpay';
import { env } from '../../config/env';

let razorpayInstance: Razorpay | null = null;

export const isRazorpayConfigured = (): boolean => {
  return Boolean(
    env.RAZORPAY_KEY_ID &&
    env.RAZORPAY_KEY_ID.trim().length > 5 &&
    env.RAZORPAY_KEY_SECRET &&
    env.RAZORPAY_KEY_SECRET.trim().length > 5
  );
};

export const getRazorpayClient = (): Razorpay => {
  const keyId = env.RAZORPAY_KEY_ID?.trim();
  const keySecret = env.RAZORPAY_KEY_SECRET?.trim();

  if (!keyId || !keySecret) {
    throw new Error('Razorpay credentials not configured in environment variables (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET).');
  }

  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }

  return razorpayInstance;
};
