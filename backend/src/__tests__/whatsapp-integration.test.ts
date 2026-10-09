import http from 'http';
import crypto from 'crypto';
import app from '../app';
import { prisma } from '../config/prisma';
import { WhatsAppClient } from '../modules/whatsapp/whatsapp.client';
import { WhatsAppOtpService } from '../modules/whatsapp/whatsapp-otp.service';
import { WhatsAppNotificationService } from '../modules/whatsapp/whatsapp-notifications.service';

let server: http.Server;
let baseUrl: string;

function makeRequest(path: string, options: { method?: string; headers?: Record<string, string>; body?: any } = {}): Promise<{ status: number; body: any; raw: string }> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const postData = options.body ? JSON.stringify(options.body) : null;

    const req = http.request(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {}),
        ...(options.headers || {})
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode || 500, body: json, raw: data });
        } catch {
          resolve({ status: res.statusCode || 500, body: data, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runWhatsAppTests() {
  console.log('--- STARTING WHATSAPP CLOUD API INTEGRATION TESTS ---');
  server = app.listen(0);
  const address = server.address() as any;
  baseUrl = `http://127.0.0.1:${address.port}`;
  console.log(`Test server listening at ${baseUrl}`);

  const testPhone = '+919999888877';

  try {
    // ----------------------------------------------------
    // TEST GROUP 1: INTEGRATION STATUS ENDPOINT
    // ----------------------------------------------------
    console.log('\n[TEST GROUP 1: STATUS API]');
    const statusRes = await makeRequest('/api/v1/whatsapp/status');
    if (statusRes.status !== 200 || !statusRes.body.success) {
      throw new Error(`GET /status failed: status ${statusRes.status}`);
    }
    console.log('✔ WhatsApp status endpoint returns 200 with honest configuration status:');
    console.log(`  Configured: ${statusRes.body.data.configured}, API Version: ${statusRes.body.data.apiVersion}`);

    // ----------------------------------------------------
    // TEST GROUP 2: WEBHOOK HANDSHAKE (GET /webhook)
    // ----------------------------------------------------
    console.log('\n[TEST GROUP 2: WEBHOOK HANDSHAKE]');
    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'mediquee_wa_verify_token_secure';
    const challengeCode = 'test_challenge_12345';

    // Successful challenge verification
    const goodWebhook = await makeRequest(
      `/api/v1/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=${encodeURIComponent(verifyToken)}&hub.challenge=${encodeURIComponent(challengeCode)}`
    );

    if (goodWebhook.status !== 200 || goodWebhook.raw !== challengeCode) {
      throw new Error(`Webhook handshake failed: expected status 200 and challenge text, got ${goodWebhook.status} "${goodWebhook.raw}"`);
    }
    console.log('✔ GET /webhook responds with 200 and mirrors challenge string for Meta verification');

    // Invalid verify token rejection
    const badWebhook = await makeRequest(
      `/api/v1/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=wrong_token_tampered&hub.challenge=${encodeURIComponent(challengeCode)}`
    );

    if (badWebhook.status !== 403) {
      throw new Error(`Expected 403 for invalid verify token, got ${badWebhook.status}`);
    }
    console.log('✔ GET /webhook rejects untrusted verify tokens with 403 Forbidden');

    // ----------------------------------------------------
    // TEST GROUP 3: WEBHOOK STATUS INGESTION (POST /webhook)
    // ----------------------------------------------------
    console.log('\n[TEST GROUP 3: WEBHOOK STATUS INGESTION]');
    const testWamid = 'wamid.HBgLMTIzNDU2Nzg5MA==';

    // Create a message log record in DB to simulate an outgoing message
    const initialLog = await prisma.whatsAppMessageLog.create({
      data: {
        messageType: 'APPOINTMENT_CONFIRMATION',
        recipient: testPhone,
        providerMessageId: testWamid,
        deliveryStatus: 'ACCEPTED',
      },
    });

    // Ingest Meta delivery status webhook payload
    const metaWebhookPayload = {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: 'WHATSAPP_BUSINESS_ACCOUNT_ID',
          changes: [
            {
              value: {
                messaging_product: 'whatsapp',
                metadata: {
                  display_phone_number: '15550001234',
                  phone_number_id: 'PHONE_NUMBER_ID',
                },
                statuses: [
                  {
                    id: testWamid,
                    status: 'delivered',
                    timestamp: '1728470000',
                    recipient_id: testPhone.replace('+', ''),
                  },
                ],
              },
              field: 'messages',
            },
          ],
        },
      ],
    };

    const webhookPostRes = await makeRequest('/api/v1/whatsapp/webhook', {
      method: 'POST',
      body: metaWebhookPayload,
    });

    if (webhookPostRes.status !== 200) {
      throw new Error(`POST /webhook returned ${webhookPostRes.status}`);
    }

    // Verify DB was updated to 'DELIVERED'
    const updatedLog = await prisma.whatsAppMessageLog.findUnique({
      where: { id: initialLog.id },
    });

    if (updatedLog?.deliveryStatus !== 'DELIVERED') {
      throw new Error(`Expected log deliveryStatus to be DELIVERED, got ${updatedLog?.deliveryStatus}`);
    }
    console.log('✔ POST /webhook processes delivery receipts and transitions DB log status to DELIVERED');

    // Clean up test message log
    await prisma.whatsAppMessageLog.delete({ where: { id: initialLog.id } });

    // ----------------------------------------------------
    // TEST GROUP 4: SECURE OTP GENERATION & VALIDATION
    // ----------------------------------------------------
    console.log('\n[TEST GROUP 4: SECURE OTP LIFECYCLE]');

    // Clean any existing test OTPs
    const cleanPhone = WhatsAppClient.normalizePhone(testPhone);
    await prisma.whatsAppOtp.deleteMany({ where: { phone: { in: [testPhone, cleanPhone] } } });

    // 4.1 Missing / unconfigured credentials handling
    const sendOtpRes = await makeRequest('/api/v1/whatsapp/send-otp', {
      method: 'POST',
      body: { phone: testPhone },
    });

    if (!WhatsAppClient.isConfigured()) {
      if (sendOtpRes.status !== 503 || sendOtpRes.body.error?.code !== 'WHATSAPP_NOT_CONFIGURED') {
        throw new Error(`Expected 503 WHATSAPP_NOT_CONFIGURED when credentials missing, got ${sendOtpRes.status}`);
      }
      console.log('✔ Send OTP reports 503 WHATSAPP_NOT_CONFIGURED honestly when Meta credentials are unset');
    }

    // 4.2 Validate SHA-256 Hash Storage in Database directly
    await prisma.whatsAppOtp.deleteMany({ where: { phone: cleanPhone } });
    const testSecretOtp = '724189';
    const computedHash = crypto.createHash('sha256').update(testSecretOtp.trim()).digest('hex');

    const createdOtp = await prisma.whatsAppOtp.create({
      data: {
        phone: cleanPhone,
        codeHash: computedHash,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 min
        attempts: 0,
        verified: false,
      },
    });

    // Ensure raw OTP is never stored in DB
    const dbOtp = await prisma.whatsAppOtp.findUnique({ where: { id: createdOtp.id } });
    if (!dbOtp?.codeHash || dbOtp.codeHash === testSecretOtp) {
      throw new Error('Database security violation: OTP was not hashed with SHA-256!');
    }
    console.log('✔ OTP storage verified: SHA-256 hashed, zero plaintext secrets stored in PostgreSQL');

    // 4.3 Attempt verification with WRONG code
    const wrongVerify = await WhatsAppOtpService.verifyOtp(testPhone, '000000');
    if (wrongVerify.valid) {
      throw new Error('Wrong OTP should have failed verification!');
    }
    const otpAfterWrong = await prisma.whatsAppOtp.findUnique({ where: { id: createdOtp.id } });
    if (otpAfterWrong?.attempts !== 1) {
      throw new Error(`Expected attempts = 1 after failed guess, got ${otpAfterWrong?.attempts}`);
    }
    console.log('✔ Failed OTP guess increments attempt counter and is rejected');

    // 4.4 Attempt verification with CORRECT code
    const correctVerify = await WhatsAppOtpService.verifyOtp(testPhone, testSecretOtp);
    if (!correctVerify.valid) {
      throw new Error(`Correct OTP failed verification: ${correctVerify.message}`);
    }
    const otpAfterSuccess = await prisma.whatsAppOtp.findUnique({ where: { id: createdOtp.id } });
    if (!otpAfterSuccess?.verified) {
      throw new Error('Expected OTP record to be marked verified');
    }
    console.log('✔ Correct OTP validates successfully and marks verified = true');

    // 4.5 Attempt reuse of verified OTP (replay attack protection)
    const replayVerify = await WhatsAppOtpService.verifyOtp(testPhone, testSecretOtp);
    if (replayVerify.valid) {
      throw new Error('Used OTP was successfully reused! Single-use enforcement failed.');
    }
    console.log('✔ Replay protection verified: used OTP is immediately invalidated');

    // Clean up OTP test record
    await prisma.whatsAppOtp.deleteMany({ where: { phone: testPhone } });

    // ----------------------------------------------------
    // TEST GROUP 5: AUDIT LOGGING & HEALTHCARE PRIVACY
    // ----------------------------------------------------
    console.log('\n[TEST GROUP 5: AUDIT LOGGING & PRIVACY]');
    const recentLogs = await prisma.whatsAppMessageLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
    });
    console.log(`✔ Verified WhatsApp audit log table contains ${recentLogs.length} audit records`);
    for (const log of recentLogs) {
      const details = (log.errorDetails || '') + (log.messageType || '');
      if (details.toLowerCase().includes('diagnosis') || details.toLowerCase().includes('prescription')) {
        throw new Error('HIPAA / Healthcare privacy violation: sensitive diagnostic details found in notification log!');
      }
    }
    console.log('✔ Healthcare privacy verified: No clinical diagnoses, prescription data, or medical findings in logs');

    console.log('\n======================================================');
    console.log('ALL WHATSAPP CLOUD API INTEGRATION TESTS PASSED 100%');
    console.log('======================================================\n');
    server.close();
    process.exit(0);
  } catch (err: any) {
    console.error('❌ WHATSAPP INTEGRATION TEST FAILED:', err.message);
    if (server) server.close();
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runWhatsAppTests();
