import assert from 'assert';
import crypto from 'crypto';
import { PaymentsService } from '../modules/payments/payments.service';

async function runPaymentTests() {
  console.log('🧪 Starting Payments & Security Cryptographic Verification Tests...');
  const mockSecret = 'test_razorpay_secret_123456789';
  const originalSecret = process.env.RAZORPAY_KEY_SECRET;
  const originalWebhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  process.env.RAZORPAY_KEY_SECRET = mockSecret;
  process.env.RAZORPAY_WEBHOOK_SECRET = mockSecret;

  try {
    // 1. Valid Signature Test
    const orderId = 'order_DAE9401284';
    const paymentId = 'pay_9148204812';
    const validSignature = crypto
      .createHmac('sha256', mockSecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    const isValid = PaymentsService.verifySignature(orderId, paymentId, validSignature, mockSecret);
    assert.strictEqual(isValid, true, 'Valid signature must pass timingSafeEqual verification');
    console.log('✔ Passed: Valid Razorpay HMAC-SHA256 signature verification');

    // 2. Tampered Signature Test
    const forgedSignature = 'f'.repeat(64);
    const isForgedValid = PaymentsService.verifySignature(orderId, paymentId, forgedSignature, mockSecret);
    assert.strictEqual(isForgedValid, false, 'Forged signature must be rejected');
    console.log('✔ Passed: Forged signature rejection');

    // 3. Webhook Signature Test
    const rawPayload = JSON.stringify({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_123456',
            order_id: 'order_123456',
            amount: 50000
          }
        }
      }
    });

    const validWebhookSig = crypto
      .createHmac('sha256', mockSecret)
      .update(rawPayload)
      .digest('hex');

    const isWebhookValid = PaymentsService.verifyWebhookSignature(rawPayload, validWebhookSig, mockSecret);
    assert.strictEqual(isWebhookValid, true, 'Valid webhook signature must pass');
    console.log('✔ Passed: Webhook payload cryptographic verification');

    // 4. Tampered Webhook Test
    const isTamperedWebhookValid = PaymentsService.verifyWebhookSignature(rawPayload, '0'.repeat(64), mockSecret);
    assert.strictEqual(isTamperedWebhookValid, false, 'Tampered webhook must be rejected');
    console.log('✔ Passed: Tampered webhook rejection');

    console.log('\n🎉 ALL Payment Security & Cryptographic Tests Passed Successfully!\n');
  } finally {
    process.env.RAZORPAY_KEY_SECRET = originalSecret;
    process.env.RAZORPAY_WEBHOOK_SECRET = originalWebhookSecret;
  }
}

runPaymentTests().catch(err => {
  console.error('❌ Payment test failed:', err);
  process.exit(1);
});
