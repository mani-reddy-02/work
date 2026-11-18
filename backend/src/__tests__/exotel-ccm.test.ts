import assert from 'assert';
import crypto from 'crypto';
import {
  ExotelClient,
  ExotelCallService,
  getExotelAppletUrl,
  getExotelConfig,
} from '../modules/exotel';
import {
  encryptPhoneNumber,
  decryptPhoneNumber,
  maskPhoneNumber,
} from '../utils/phoneCrypto';
import { prisma } from '../config/prisma';

async function runExotelCcmTests() {
  console.log('================================================================');
  console.log('[TEST SUITE] MediQuee Exotel CCM Programmable Connect Verification');
  console.log('================================================================');

  const client = ExotelClient.getInstance();
  const service = new ExotelCallService();
  const validToken = 'mediquee_exotel_webhook_secret_key';

  // In-memory CallLog model for sandboxed unit testing
  const inMemoryLogs = new Map<string, any>();
  let mockIdCounter = 1;

  (prisma as any).callLog = {
    async create({ data }: any) {
      const id = 'mock-id-' + mockIdCounter++;
      const record = { id, createdAt: new Date(), ...data };
      inMemoryLogs.set(id, record);
      return record;
    },
    async findUnique({ where }: any) {
      for (const log of inMemoryLogs.values()) {
        if (where.id && log.id === where.id) return log;
        if (where.callSid && log.callSid === where.callSid) return log;
      }
      return null;
    },
    async findMany({ where }: any) {
      return Array.from(inMemoryLogs.values());
    },
    async update({ where, data }: any) {
      for (const [id, log] of inMemoryLogs.entries()) {
        if ((where.id && log.id === where.id) || (where.callSid && log.callSid === where.callSid)) {
          const updated = { ...log, ...data, metadata: { ...(log.metadata || {}), ...(data.metadata || {}) } };
          inMemoryLogs.set(id, updated);
          return updated;
        }
      }
      throw new Error('Record not found');
    },
    async delete({ where }: any) {
      for (const [id, log] of inMemoryLogs.entries()) {
        if (where.id && log.id === where.id) {
          inMemoryLogs.delete(id);
          return log;
        }
      }
      return null;
    },
  };

  // TEST 1: Applet Flow URL Construction
  console.log('\n[TEST 1] Exotel Applet URL Construction (start_voice format)');
  const appletUrl = getExotelAppletUrl('987654');
  assert.strictEqual(
    appletUrl,
    'http://my.exotel.com/mediquee1/exoml/start_voice/987654',
    'Applet URL must follow standard Exotel start_voice format'
  );
  console.log('  -> Generated Applet URL:', appletUrl);

  // TEST 2: Parameter Validation for Applet-Initiated Call (To is optional when url is present)
  console.log('\n[TEST 2] Parameter Validation for Applet-Initiated Call');
  const validAppletParams = client.validateCallParams({
    from: '+919876543210',
    url: appletUrl,
    callerId: '08047290980',
    customField: 'ccm_test_token_123',
  });
  assert.strictEqual(validAppletParams.isValid, true);
  assert.strictEqual(validAppletParams.normalizedFrom, '+919876543210');
  assert.strictEqual(validAppletParams.resolvedCallerId, '08047290980');
  console.log('  -> Applet call parameters verified: "to" is optional when applet "url" is provided.');

  // TEST 3: Validation Rejects Missing Both "To" and "Url"
  console.log('\n[TEST 3] Validation Rejection when both "To" and "Url" are missing');
  let missingLegsBlocked = false;
  try {
    client.validateCallParams({
      from: '+919876543210',
      callerId: '08047290980',
    } as any);
  } catch (err: any) {
    missingLegsBlocked = true;
    assert(err.message.includes('second leg') || err.message.includes('applet flow'));
  }
  assert.strictEqual(missingLegsBlocked, true, 'Must reject calls missing both To and Url');
  console.log('  -> Correctly blocked call when neither "to" nor "url" was supplied.');

  // TEST 4: Timing-Safe Webhook Authentication for Primary URL (/connect)
  console.log('\n[TEST 4] Timing-Safe Webhook Authentication for Primary URL');
  const unauthorizedPrimary = await service.handleCcmConnect(
    { CallSid: 'test_sid_123', CustomField: 'ccm_test_123' },
    'tampered_or_invalid_secret_token'
  );
  assert.strictEqual(unauthorizedPrimary.httpStatus, 403, 'Primary URL must return 403 on invalid token');
  assert.strictEqual((unauthorizedPrimary.payload as any).error, 'Unauthorized webhook access');
  console.log('  -> Unauthorized /connect query rejected with HTTP 403.');

  // TEST 5: Timing-Safe Webhook Authentication for Fallback URL (/fallback)
  console.log('\n[TEST 5] Timing-Safe Webhook Authentication for Fallback URL');
  const unauthorizedFallback = await service.handleCcmFallback(
    { CallSid: 'test_sid_123' },
    'invalid_token_sample'
  );
  assert.strictEqual(unauthorizedFallback.httpStatus, 403, 'Fallback URL must return 403 on invalid token');
  console.log('  -> Unauthorized /fallback query rejected with HTTP 403.');

  // TEST 6: Primary URL Rejection when CallSid and CustomField are both missing
  console.log('\n[TEST 6] Primary URL Parameter Rejection when Call Identifier is Missing');
  const missingIdPrimary = await service.handleCcmConnect({}, validToken);
  assert.strictEqual(missingIdPrimary.httpStatus, 400);
  console.log('  -> Empty call query rejected with HTTP 400.');

  // TEST 7: Primary URL Unknown Call / Missing Session (HTTP 404)
  console.log('\n[TEST 7] Primary URL Unknown Call Session Handling (HTTP 404)');
  const unknownCallPrimary = await service.handleCcmConnect(
    { CallSid: 'non_existent_call_sid_9999999999' },
    validToken
  );
  assert.strictEqual(unknownCallPrimary.httpStatus, 404);
  console.log('  -> Non-existent CallSid correctly returned HTTP 404.');

  // TEST 8: Full CCM Connect Resolution with Mock CallLog in DB
  console.log('\n[TEST 8] Full CCM Connect Resolution & Response Payload Conformance');
  const testCallSid = `test_ccm_sid_${Date.now()}`;
  const testCorrelationToken = `ccm_token_${Date.now()}`;
  const testDestinationRaw = '+919876543210';
  const encryptedDestination = encryptPhoneNumber(testDestinationRaw);

  const mockCallLog = await (prisma as any).callLog.create({
    data: {
      callSid: testCallSid,
      bookingId: 'test-booking-uuid-1',
      bookingType: 'OP',
      initiatedById: 'test-patient-uuid-1',
      callerRole: 'PATIENT',
      fromPhone: encryptPhoneNumber('+919123456789'),
      toPhone: encryptedDestination,
      virtualNumber: '08047290980',
      direction: 'PATIENT_TO_HOSPITAL',
      status: 'INITIATED',
      metadata: {
        correlationToken: testCorrelationToken,
        correlationExpiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      },
    },
  });

  try {
    // 8a: Execute CCM Connect query by CallSid
    const connectResult = await service.handleCcmConnect(
      { CallSid: testCallSid, CustomField: testCorrelationToken },
      validToken
    );

    assert.strictEqual(connectResult.httpStatus, 200, 'CCM Connect must respond with HTTP 200 OK');
    const payload = connectResult.payload as any;

    // Verify mandatory CCM fields
    assert(Array.isArray(payload.destination), 'CCM payload must contain destination array');
    assert.strictEqual(payload.destination.length, 1);
    assert.strictEqual(
      payload.destination[0].contact_uri,
      testDestinationRaw,
      'Destination must match the decrypted hospital phone in E.164'
    );
    assert.strictEqual(payload.state_management, true);
    assert.strictEqual(payload.outgoing_phone_number, '08047290980');
    assert.strictEqual(payload.recording?.record, false);
    assert.strictEqual(payload.max_ringing_duration, 30);
    assert.strictEqual(payload.max_conversation_duration, 900);
    assert(
      typeof payload.call_event_passthru_url === 'string' &&
        payload.call_event_passthru_url.includes('/api/v1/exotel/events?token='),
      'CCM Connect payload must include valid call_event_passthru_url'
    );
    console.log('  -> CCM Primary URL response successfully validated:');
    console.log('     ', JSON.stringify(payload));

    // 8b: Verify CallLog status transitioned to IN_PROGRESS
    const updatedCall = await (prisma as any).callLog.findUnique({
      where: { id: mockCallLog.id },
    });
    assert.strictEqual(updatedCall.status, 'IN_PROGRESS', 'CallLog status must update to IN_PROGRESS');
    console.log('  -> Database CallLog transitioned to IN_PROGRESS upon CCM connect.');

    // TEST 9: Terminal State Reuse Prevention (HTTP 410 Gone)
    console.log('\n[TEST 9] Terminal State Reuse Prevention');
    // Set call to COMPLETED
    await (prisma as any).callLog.update({
      where: { id: mockCallLog.id },
      data: { status: 'COMPLETED' },
    });

    const terminalAttempt = await service.handleCcmConnect(
      { CallSid: testCallSid },
      validToken
    );
    assert.strictEqual(terminalAttempt.httpStatus, 410, 'Terminal call session must return HTTP 410');
    console.log('  -> Terminal call reuse strictly rejected with HTTP 410.');

    // TEST 10: Fallback URL Execution with Valid Call
    console.log('\n[TEST 10] Fallback URL Execution with Verified Destination');
    // Create new active call for fallback testing
    const fallbackCallSid = `test_fallback_sid_${Date.now()}`;
    const fallbackCall = await (prisma as any).callLog.create({
      data: {
        callSid: fallbackCallSid,
        bookingId: 'test-booking-uuid-fallback',
        bookingType: 'OP',
        initiatedById: 'test-patient-uuid-2',
        callerRole: 'PATIENT',
        fromPhone: encryptPhoneNumber('+919123456789'),
        toPhone: encryptedDestination,
        virtualNumber: '08047290980',
        direction: 'PATIENT_TO_HOSPITAL',
        status: 'RINGING',
        metadata: {
          correlationToken: 'ccm_fallback_token_123',
          correlationExpiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        },
      },
    });

    try {
      const fallbackResult = await service.handleCcmFallback(
        { CallSid: fallbackCallSid, Reason: 'Primary URL timeout simulation' },
        validToken
      );

      assert.strictEqual(fallbackResult.httpStatus, 200, 'Fallback must respond with HTTP 200 OK');
      const fallbackPayload = fallbackResult.payload as any;
      assert.strictEqual(fallbackPayload.destination[0].contact_uri, testDestinationRaw);
      assert(
        typeof fallbackPayload.call_event_passthru_url === 'string' &&
          fallbackPayload.call_event_passthru_url.includes('/api/v1/exotel/events?token='),
        'Fallback payload must include valid call_event_passthru_url'
      );

      // Verify metadata logged the fallback
      const updatedFallbackCall = await (prisma as any).callLog.findUnique({
        where: { id: fallbackCall.id },
      });
      assert.strictEqual(updatedFallbackCall.metadata.fallbackTriggered, true);
      console.log('  -> Fallback URL safely returned verified destination and logged failover event.');
    } finally {
      await (prisma as any).callLog.delete({ where: { id: fallbackCall.id } });
    }

    // TEST 11: Call Events Lifecycle & Duplicate Event Idempotency
    console.log('\n[TEST 11] Call Events Lifecycle & Duplicate Event Idempotency');
    const lifecycleSid = `test_life_${Date.now()}`;
    const lifecycleCall = await (prisma as any).callLog.create({
      data: {
        callSid: lifecycleSid,
        bookingId: 'test-lifecycle-booking',
        initiatedById: 'test-user-3',
        callerRole: 'PATIENT',
        fromPhone: encryptedDestination,
        toPhone: encryptedDestination,
        virtualNumber: '08047290980',
        status: 'INITIATED',
      },
    });

    try {
      // Event 1: Ringing
      await service.handleCcmEvents({ CallSid: lifecycleSid, Status: 'ringing' }, validToken);
      let callState = await (prisma as any).callLog.findUnique({ where: { id: lifecycleCall.id } });
      assert.strictEqual(callState.status, 'RINGING');
      console.log('  -> Event 1: RINGING synchronized.');

      // Event 2: In-Progress / Answered
      await service.handleCcmEvents({ CallSid: lifecycleSid, Status: 'in-progress' }, validToken);
      callState = await (prisma as any).callLog.findUnique({ where: { id: lifecycleCall.id } });
      assert.strictEqual(callState.status, 'IN_PROGRESS');
      console.log('  -> Event 2: IN_PROGRESS synchronized.');

      // Event 3: Completed with duration
      await service.handleCcmEvents(
        { CallSid: lifecycleSid, Status: 'completed', ConversationDuration: '78', Price: '0.45' },
        validToken
      );
      callState = await (prisma as any).callLog.findUnique({ where: { id: lifecycleCall.id } });
      assert.strictEqual(callState.status, 'COMPLETED');
      assert.strictEqual(callState.duration, 78);
      assert.strictEqual(callState.price, '0.45');
      console.log('  -> Event 3: COMPLETED synchronized with duration 78s.');

      // Event 4: Duplicate / Out-of-order event after terminal state
      const duplicateRes = await service.handleCcmEvents(
        { CallSid: lifecycleSid, Status: 'ringing' },
        validToken
      );
      assert.strictEqual(duplicateRes.status, 200);
      assert.strictEqual(duplicateRes.message, 'Event already processed');

      // Verify status remained COMPLETED
      callState = await (prisma as any).callLog.findUnique({ where: { id: lifecycleCall.id } });
      assert.strictEqual(callState.status, 'COMPLETED', 'Status must stay COMPLETED despite out-of-order event');
      console.log('  -> Duplicate event ignored: Terminal COMPLETED state safely preserved.');
    } finally {
      await (prisma as any).callLog.delete({ where: { id: lifecycleCall.id } });
    }
  } finally {
    // Cleanup mock call
    await (prisma as any).callLog.delete({ where: { id: mockCallLog.id } });
  }

  // TEST 12: Exotel Timeout / AbortController Protection
  console.log('\n[TEST 12] Exotel Client Timeout & AbortController Protection');
  const originalFetch = global.fetch;
  try {
    global.fetch = (async (_url: any, init: any) => {
      // Simulate delayed connection that triggers signal abort
      return new Promise((_, reject) => {
        if (init?.signal) {
          init.signal.addEventListener('abort', () => {
            const abortErr = new Error('The operation was aborted');
            abortErr.name = 'AbortError';
            reject(abortErr);
          });
        }
      });
    }) as any;

    const timeoutClient = new ExotelClient({ timeoutMs: 50 });
    let timedOut = false;
    try {
      await timeoutClient.initiateCall({
        from: '+919876543210',
        to: '+919123456789',
        callerId: '08047290980',
      });
    } catch (err: any) {
      timedOut = true;
      assert(err.message.includes('timed out'), 'Error must report timeout');
    }
    assert.strictEqual(timedOut, true, 'Client must abort and report timeout when SLA exceeded');
    console.log('  -> AbortController successfully triggered timeout protection after 50ms.');
  } finally {
    global.fetch = originalFetch;
  }

  console.log('\n================================================================');
  console.log('[SUCCESS] All Exotel CCM Programmable Connect Tests Passed 100%!');
  console.log('================================================================\n');

  await prisma.$disconnect();
  process.exit(0);
}

runExotelCcmTests().catch(async (err) => {
  console.error('[TEST FAILURE]:', err);
  await prisma.$disconnect().catch(() => {});
  process.exit(1);
});

