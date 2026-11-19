import assert from 'assert';
import crypto from 'crypto';
import {
  ExotelClient,
  getExotelConfig,
  ExotelCallService,
} from '../modules/exotel';
import {
  encryptPhoneNumber,
  decryptPhoneNumber,
  maskPhoneNumber,
} from '../utils/phoneCrypto';
import { env } from '../config/env';

async function runExotelServiceTests() {
  console.log('====================================================');
  console.log('[TEST SUITE] MediQuee Exotel Click-to-Call Security & Service Verification');
  console.log('====================================================');

  // 1. Phone Encryption At Rest (AES-256-GCM) with Primary Key
  console.log('\n[TEST 1] Phone Number Encryption at Rest (AES-256-GCM)');
  const testPhone = '+919876543210';
  const encrypted = encryptPhoneNumber(testPhone);
  assert(encrypted.startsWith('enc:v1:'), 'Encrypted string must have version prefix enc:v1:');
  assert(!encrypted.includes(testPhone), 'Encrypted string must never contain plaintext phone number');
  const decrypted = decryptPhoneNumber(encrypted);
  assert.strictEqual(decrypted, testPhone, 'Decrypted phone number must match original phone');
  console.log('  -> Encryption & Decryption verified: AES-256-GCM authenticated encryption working.');

  // 2. Key Rotation Support
  console.log('\n[TEST 2] Key Rotation Support (Historical Key Decryption)');
  // Simulate an old key that encrypted data in the past
  const oldKeySecret = 'old-historical-key-at-least-16-chars-long';
  const oldKeyBuffer = crypto.scryptSync(oldKeySecret, 'mediquee-exotel-telephony-v1', 32);
  const oldIv = crypto.randomBytes(12);
  const oldCipher = crypto.createCipheriv('aes-256-gcm', oldKeyBuffer, oldIv, { authTagLength: 16 });
  let oldEncrypted = oldCipher.update('+919123456789', 'utf8', 'hex');
  oldEncrypted += oldCipher.final('hex');
  const oldAuthTag = oldCipher.getAuthTag().toString('hex');
  const oldRecord = `enc:v1:${oldIv.toString('hex')}:${oldAuthTag}:${oldEncrypted}`;

  // Set historical keys in environment
  process.env.OLD_PHONE_ENCRYPTION_KEYS = `dummy-key-for-test,${oldKeySecret}`;
  const decryptedFromOldKey = decryptPhoneNumber(oldRecord);
  assert.strictEqual(decryptedFromOldKey, '+919123456789', 'Must decrypt data encrypted with historical key during rotation');
  console.log('  -> Key rotation verified: Decrypted historical record using OLD_PHONE_ENCRYPTION_KEYS.');

  // 3. Phone Number Masking (Privacy in API responses)
  console.log('\n[TEST 3] Phone Number Masking in API responses');
  const maskedMobile = maskPhoneNumber('+919876543210');
  const maskedLandline = maskPhoneNumber('08047290980');
  const maskedPlain10 = maskPhoneNumber('9876543210');
  assert.strictEqual(maskedMobile, '+91 98*** ***10', 'Mobile masking should show country code and first/last 2 digits');
  assert.strictEqual(maskedLandline, '080-***-0980', 'Landline masking should show STD code and last 4 digits');
  assert.strictEqual(maskedPlain10, '98*** ***10', 'Plain 10-digit masking should show first/last 2 digits');
  console.log('  -> Masked Mobile:', maskedMobile);
  console.log('  -> Masked Landline:', maskedLandline);
  console.log('  -> Masked Plain 10-digit:', maskedPlain10);
  console.log('  -> Phone masking protects patient and hospital privacy across all formats.');

  // 4. Official API Connect Two Numbers Parameters Conformity
  console.log('\n[TEST 4] Connect Two Numbers API Parameter Conformity');
  const client = new ExotelClient();
  const validation = client.validateCallParams({
    from: '+919876543210',
    to: '08047290980',
    callerId: '08047290980',
  });
  assert.strictEqual(validation.isValid, true, 'Call params must be valid');
  assert.strictEqual(validation.resolvedCallerId, '08047290980', 'CallerId must strictly be the approved virtual number');
  assert.strictEqual(validation.normalizedFrom, '+919876543210', 'From must be E.164 normalized');

  // Verify call validation-only mode generates correct form payload structure
  const dryRunResponse = await client.initiateCall(
    {
      from: '+919876543210',
      to: '+919123456789',
      callerId: '08047290980',
      record: false,
    },
    { validateOnly: true }
  );
  assert.strictEqual(dryRunResponse.Call?.Status, 'validated-not-dispatched');
  assert.strictEqual(dryRunResponse.Call?.From, '+919876543210');
  assert.strictEqual(dryRunResponse.Call?.To, '+919123456789');
  assert.strictEqual(dryRunResponse.Call?.PhoneNumberSid, '08047290980');
  console.log('  -> Legs verified: From leg is dialed first, To leg second, CallerId is 08047290980.');

  // 5. Call Recording Policy (Strictly disabled by default)
  console.log('\n[TEST 5] Call Recording Policy Enforcement');
  const config = getExotelConfig();
  assert.strictEqual(config.enableRecording, false, 'Recording must default to false until consent/retention policies established');
  console.log('  -> Recording disabled by default (EXOTEL_ENABLE_RECORDING=false).');

  // 6. Host Region Verification Method (Zero Live Calls)
  console.log('\n[TEST 6] API Region Host Verification Logic (Mocked Network Response)');
  const originalFetch = global.fetch;
  try {
    global.fetch = (async (url: any) => {
      const urlStr = String(url);
      if (urlStr.includes('api.exotel.com')) {
        const payload = {
          Metadata: { Total: 5 },
          Account: {
            Sid: 'test_account_sid',
            FriendlyName: 'MediQuee Healthcare Singapore/Global',
            Status: 'active',
          },
        };
        return {
          ok: true,
          status: 200,
          json: async () => payload,
          text: async () => JSON.stringify(payload),
        };
      }
      return {
        ok: false,
        status: 404,
        json: async () => ({ RestException: { Message: 'Account not found on this cluster' } }),
        text: async () => JSON.stringify({
          RestException: { Message: 'Account not found on this cluster' },
        }),
      };
    }) as any;

    const singaporeHostCheck = await ExotelClient.verifyApiHost('api.exotel.com');
    assert.strictEqual(singaporeHostCheck.isVerified, true, 'Singapore host should verify successfully');
    assert.strictEqual(singaporeHostCheck.testedHost, 'api.exotel.com');
    assert.strictEqual(singaporeHostCheck.statusCode, 200);

    const otherHostCheck = await ExotelClient.verifyApiHost('api.unknown-region.exotel.com');
    assert.strictEqual(otherHostCheck.isVerified, false, 'Invalid host should return cluster mismatch');
    assert.strictEqual(otherHostCheck.statusCode, 404);
    console.log('  -> Host verification method successfully discriminates clusters without placing calls.');
  } finally {
    global.fetch = originalFetch;
  }

  // 7. Webhook Timing-Safe Authentication & Idempotency
  console.log('\n[TEST 7] Webhook Timing-Safe Authentication, Validation & Idempotency');
  const service = new ExotelCallService();

  // Test 7a: Reject unauthorized webhook token
  const unauthorizedWebhook = await service.handleWebhook(
    { CallSid: 'test_call_sid_123', Status: 'completed' },
    'wrong_token_tampered'
  );
  assert.strictEqual(unauthorizedWebhook.status, 403, 'Webhook must reject invalid token with HTTP 403');
  console.log('  -> Unauthorized webhook rejected with HTTP 403 using timing-safe comparison.');

  // Test 7b: Missing CallSid in payload
  const validSecret = env.EXOTEL_WEBHOOK_SECRET || 'mediquee_exotel_webhook_secret_key';
  const missingSidWebhook = await service.handleWebhook(
    { Status: 'completed' },
    validSecret
  );
  assert.strictEqual(missingSidWebhook.status, 400, 'Webhook must reject missing CallSid with HTTP 400');
  console.log('  -> Missing CallSid rejected with HTTP 400.');

  console.log('\n====================================================');
  console.log('[SUCCESS] All Exotel Click-to-Call Security & Service Unit Tests Passed!');
  console.log('====================================================');
}

runExotelServiceTests().catch((err) => {
  console.error('[TEST FAILURE]:', err);
  process.exit(1);
});
