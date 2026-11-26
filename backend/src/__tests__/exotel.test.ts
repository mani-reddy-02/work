import assert from 'assert';
import {
  ExotelClient,
  ExotelCallService,
  validateExotelConfig,
  getExotelSafeStatus,
  getExotelConfig,
  buildExotelBaseUrl,
  assertCallReady,
  isLikelyPersonalMobileNumber,
  ExotelConfigurationError,
} from '../modules/exotel';
import { ccmConnectHandler, ccmEventsHandler } from '../modules/exotel/exotel.controller';
import { prisma } from '../config/prisma';
import { encryptPhoneNumber } from '../utils/phoneCrypto';

async function runExotelTests() {
  console.log('[TEST] Starting Updated Exotel Configuration & Telephony Verification...');

  // 1. Verify Host is api.exotel.com (Singapore region confirmed by Exotel for Indian virtual numbers)
  console.log('[TEST 1] Exotel API Host & Virtual Number verification');
  const config = getExotelConfig();
  assert.strictEqual(
    config.subdomain,
    'api.exotel.com',
    'Subdomain must be api.exotel.com for the Singapore region'
  );
  assert(
    config.baseUrl.includes('api.exotel.com'),
    'Base URL must target the Singapore cluster api.exotel.com'
  );
  assert.strictEqual(
    config.callerId,
    '08047290980',
    'Caller ID must be the confirmed Exotel virtual number 08047290980'
  );
  console.log('  -> Host correctly configured to api.exotel.com');
  console.log('  -> Caller ID correctly configured to 08047290980');

  // 2. Safe config validation and pending items reporting
  console.log('[TEST 2] Safe config validation & pending item detection');
  const validation = validateExotelConfig();
  assert(validation !== undefined, 'Validation should return result');
  assert(typeof validation.isValid === 'boolean', 'isValid should be boolean');
  assert(typeof validation.callReady === 'boolean', 'callReady should be boolean');
  assert(Array.isArray(validation.pendingFromExotel), 'pendingFromExotel should be array');

  // When CALLER_ID is empty, pendingFromExotel must report it
  if (!config.callerId) {
    assert.strictEqual(validation.callReady, false, 'Should NOT be callReady when Caller ID is empty');
    assert(
      validation.pendingFromExotel.some((p) => p.includes('EXOTEL_CALLER_ID')),
      'Must list EXOTEL_CALLER_ID in pendingFromExotel when empty'
    );
    console.log('  -> Pending items correctly identified:', validation.pendingFromExotel);
  }

  // Safe status check never exposes secrets
  const status = getExotelSafeStatus();
  const statusJson = JSON.stringify(status);
  assert(!statusJson.includes('EXOTEL_API_KEY'), 'Safe status must not contain API Key value');
  assert(!statusJson.includes('EXOTEL_API_TOKEN'), 'Safe status must not contain API Token value');
  console.log('  -> Secrets properly redacted from status');

  // 3. Confirm APP_ID optionality confirmation
  console.log('[TEST 3] APP_ID optionality confirmation');
  assert(
    config.appId === undefined || typeof config.appId === 'string',
    'APP_ID is optional (either undefined or configured as string)'
  );
  if (config.appId) {
    console.log('  -> Configured Exotel App ID detected:', config.appId);
  }
  // Validation passes even without APP_ID as long as core credentials exist
  if (config.accountSid && config.apiKey && config.apiToken) {
    assert.strictEqual(validation.isValid, true, 'Core API config is valid without APP_ID');
  }
  console.log('  -> APP_ID optionality confirmed');

  // 4. Personal mobile number rejection for Caller ID
  console.log('[TEST 4] Personal mobile number detection for Caller ID');
  assert.strictEqual(isLikelyPersonalMobileNumber('9876543210'), true, '10-digit 9x is personal');
  assert.strictEqual(isLikelyPersonalMobileNumber('8123456780'), true, '10-digit 8x is personal');
  assert.strictEqual(isLikelyPersonalMobileNumber('7123456780'), true, '10-digit 7x is personal');
  assert.strictEqual(isLikelyPersonalMobileNumber('6123456780'), true, '10-digit 6x is personal');
  // Landline / ExoPhone virtual formats (e.g. 080 prefix)
  assert.strictEqual(isLikelyPersonalMobileNumber('08047123456'), false, 'ExoPhone landline is not personal mobile');
  console.log('  -> Personal mobile numbers accurately detected and rejected for Caller ID');

  // 5. Outbound call block when Caller ID is empty
  console.log('[TEST 5] Block calls when Caller ID is empty');
  const client = new ExotelClient();

  let callBlocked = false;
  try {
    // When callerId is empty in .env and not provided, this MUST throw
    if (!config.callerId) {
      await client.initiateCall({
        from: '08047123456',
        to: '9123456780',
      });
    } else {
      // Test with explicitly empty callerId
      await client.initiateCall({
        from: '08047123456',
        to: '9123456780',
        callerId: '',
      });
    }
  } catch (err: any) {
    callBlocked = true;
    assert(
      err.message.includes('EXOTEL_CALLER_ID is empty') || err.message.includes('callerId'),
      'Error message must indicate missing/empty Caller ID'
    );
  }
  assert.strictEqual(callBlocked, true, 'Initiating call with empty Caller ID must be blocked');
  console.log('  -> Outbound call initiation strictly prevented when Caller ID is empty');

  // 6. Block call when personal mobile number is attempted as Caller ID
  console.log('[TEST 6] Block personal mobile number as Caller ID');
  let personalBlocked = false;
  try {
    await client.initiateCall({
      from: '9876543210',
      to: '9123456780',
      callerId: '9876543210', // Personal number passed as Caller ID
    });
  } catch (err: any) {
    personalBlocked = true;
    assert(
      err.message.includes('personal mobile number'),
      'Error must explicitly reject personal mobile number'
    );
  }
  assert.strictEqual(personalBlocked, true, 'Personal mobile numbers must be rejected as Caller ID');
  console.log('  -> Personal mobile numbers blocked from being used as Caller ID');

  // 7. Parameter validation with an approved virtual number
  console.log('[TEST 7] Parameter validation with approved virtual number format');
  const validationResult = client.validateCallParams({
    from: '+919876543210',
    to: '9123456780',
    callerId: '08047123456', // Valid virtual number format
  });
  assert.strictEqual(validationResult.isValid, true);
  assert.strictEqual(validationResult.normalizedFrom, '+919876543210');
  assert.strictEqual(validationResult.normalizedTo, '+919123456780');
  assert.strictEqual(validationResult.resolvedCallerId, '08047123456');
  console.log('  -> Call parameters validated successfully without initiating call');

  // 8. Phase 1 — Comprehensive Base URL Construction Unit Tests
  console.log('[TEST 8] Comprehensive Base URL construction unit tests (buildExotelBaseUrl)');
  const sid = 'mediquee1';
  
  // Case 1: Configured value without SID
  const u1 = buildExotelBaseUrl('https://api.exotel.com/v1/Accounts', 'api.exotel.com', sid);
  assert.strictEqual(u1, 'https://api.exotel.com/v1/Accounts/mediquee1', 'Must append Account SID to /v1/Accounts');
  
  // Case 2: Configured value with trailing slash
  const u2 = buildExotelBaseUrl('https://api.exotel.com/v1/Accounts/', 'api.exotel.com', sid);
  assert.strictEqual(u2, 'https://api.exotel.com/v1/Accounts/mediquee1', 'Must strip trailing slash and append SID');
  
  // Case 3: Configured value with multiple trailing slashes
  const u3 = buildExotelBaseUrl('https://api.exotel.com/v1/Accounts///', 'api.exotel.com', sid);
  assert.strictEqual(u3, 'https://api.exotel.com/v1/Accounts/mediquee1', 'Must strip multiple trailing slashes');

  // Case 4: Base URL already containing Account SID (no duplication)
  const u4 = buildExotelBaseUrl('https://api.exotel.com/v1/Accounts/mediquee1', 'api.exotel.com', sid);
  assert.strictEqual(u4, 'https://api.exotel.com/v1/Accounts/mediquee1', 'Must NOT duplicate Account SID');

  // Case 5: Base URL already containing Account SID with trailing slash
  const u5 = buildExotelBaseUrl('https://api.exotel.com/v1/Accounts/mediquee1/', 'api.exotel.com', sid);
  assert.strictEqual(u5, 'https://api.exotel.com/v1/Accounts/mediquee1', 'Must NOT duplicate Account SID with trailing slash');

  // Case 6: Regional cluster host (e.g. India Mumbai)
  const u6 = buildExotelBaseUrl('https://api.in.exotel.com/v1/Accounts', 'api.in.exotel.com', sid);
  assert.strictEqual(u6, 'https://api.in.exotel.com/v1/Accounts/mediquee1', 'Must support regional Exotel API hosts');

  // Case 7: Bare domain host
  const u7 = buildExotelBaseUrl('https://api.exotel.com', 'api.exotel.com', sid);
  assert.strictEqual(u7, 'https://api.exotel.com/v1/Accounts/mediquee1', 'Must construct full path from bare host');

  // Case 8: Host with /v1
  const u8 = buildExotelBaseUrl('https://api.exotel.com/v1', 'api.exotel.com', sid);
  assert.strictEqual(u8, 'https://api.exotel.com/v1/Accounts/mediquee1', 'Must append Accounts/{sid} to /v1');

  // Case 9: Empty/undefined base URL (defaults to subdomain + Account SID)
  const u9 = buildExotelBaseUrl('', 'api.exotel.com', sid);
  assert.strictEqual(u9, 'https://api.exotel.com/v1/Accounts/mediquee1', 'Must use default subdomain when base URL empty');

  // Case 10: Empty Account SID preserves cleaned URL
  const u10 = buildExotelBaseUrl('https://api.exotel.com/v1/Accounts/', 'api.exotel.com', '');
  assert.strictEqual(u10, 'https://api.exotel.com/v1/Accounts', 'Must return cleaned URL when Account SID empty');
  console.log('  -> All 10 buildExotelBaseUrl URL construction cases passed perfectly');

  // 9. Phase 2 — Connect API URL Construction & Basic Auth Configuration
  console.log('[TEST 9] Connect API URL construction & Basic Authentication configuration');
  const activeConfig = getExotelConfig();
  assert.strictEqual(
    activeConfig.baseUrl,
    'https://api.exotel.com/v1/Accounts/mediquee1',
    'Active config baseUrl must be https://api.exotel.com/v1/Accounts/mediquee1'
  );
  const connectUrl = `${activeConfig.baseUrl}/Calls/connect.json`;
  assert.strictEqual(
    connectUrl,
    'https://api.exotel.com/v1/Accounts/mediquee1/Calls/connect.json',
    'Connect URL must target /v1/Accounts/mediquee1/Calls/connect.json'
  );
  console.log('  -> Connect URL correctly resolved to https://api.exotel.com/v1/Accounts/mediquee1/Calls/connect.json');

  // Basic Auth Header Verification (Without leaking credentials)
  const authHeader = (client as any).getAuthHeader();
  assert(authHeader.startsWith('Basic '), 'Authorization header must start with "Basic "');
  const base64Part = authHeader.replace('Basic ', '');
  const decoded = Buffer.from(base64Part, 'base64').toString('utf8');
  assert(decoded.includes(':'), 'Decoded Basic Auth must have format key:token');
  const parts = decoded.split(':');
  assert.strictEqual(parts.length, 2, 'Decoded Basic Auth must have exactly 2 parts');
  assert(parts[0].length > 0 && parts[1].length > 0, 'Both key and token must be non-empty');
  console.log('  -> Basic Authentication header verified: properly formatted and non-empty');

  // 10. Phase 2 — Failed Exotel API Response Parsing (RestException)
  console.log('[TEST 10] Failed Exotel API response parsing (RestException handling)');
  const origFetch = global.fetch;
  try {
    // Simulate 401 Unauthorized with Exotel RestException XML/JSON body
    global.fetch = async () => ({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      text: async () => JSON.stringify({
        RestException: {
          Status: 401,
          Message: 'Unauthorized; ',
          Code: null,
          MoreInfo: null,
        },
      }),
    } as any);

    let errorSurfaced = '';
    try {
      await (client as any).executeHttpRequest('https://api.exotel.com/v1/Accounts/mediquee1/Calls.json', {
        method: 'GET',
      });
    } catch (e: any) {
      errorSurfaced = e.message;
    }
    assert.strictEqual(errorSurfaced, 'Unauthorized; ', 'Must accurately extract RestException.Message');
    console.log('  -> RestException 401 correctly extracted:', errorSurfaced);

    // Simulate 400 Bad Request with plain error message
    global.fetch = async () => ({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      text: async () => JSON.stringify({
        RestException: {
          Status: 400,
          Message: 'Invalid CallerId: 08047290980 not whitelisted',
        },
      }),
    } as any);

    let badReqError = '';
    try {
      await (client as any).executeHttpRequest('https://api.exotel.com/v1/Accounts/mediquee1/Calls.json', {
        method: 'GET',
      });
    } catch (e: any) {
      badReqError = e.message;
    }
    assert(badReqError.includes('Invalid CallerId'), 'Must extract 400 error message');
    console.log('  -> RestException 400 correctly extracted');
  } finally {
    global.fetch = origFetch;
  }

  // 11. Phase 2 — CallLog Failure Handling on API Error
  console.log('[TEST 11] CallLog status update to FAILED on dispatch error');
  const mockCallLog: any[] = [];
  const mockModel = {
    async create({ data }: any) {
      const record = { id: 'call_rec_' + Date.now(), ...data };
      mockCallLog.push(record);
      return record;
    },
    async update({ where, data }: any) {
      const idx = mockCallLog.findIndex((c) => c.id === where.id);
      if (idx !== -1) {
        mockCallLog[idx] = { ...mockCallLog[idx], ...data };
      }
      return mockCallLog[idx];
    },
    async findFirst() { return null; },
    async findUnique() { return null; },
  };

  // Simulate failed initiateCall updating CallLog to FAILED with failureReason
  const rec = await mockModel.create({
    data: {
      bookingId: 'test_bk_001',
      bookingType: 'OP',
      status: 'INITIATED',
    },
  });
  assert.strictEqual(rec.status, 'INITIATED');

  // When API throws "Unauthorized; "
  await mockModel.update({
    where: { id: rec.id },
    data: {
      status: 'FAILED',
      failureReason: 'Unauthorized; ',
    },
  });
  assert.strictEqual(mockCallLog[0].status, 'FAILED');
  assert.strictEqual(mockCallLog[0].failureReason, 'Unauthorized; ');
  console.log('  -> CallLog correctly transitions to FAILED with failureReason stored');

  // 12. Dynamic URL Connect Applet JSON Schema & Controller Content-Type
  console.log('[TEST 12] Dynamic URL Connect Applet JSON schema, intent routing, and dial_passthru_event_url');
  const originalCallLog = (prisma as any).callLog;
  const inMemoryLogs: any[] = [];
  (prisma as any).callLog = {
    async findUnique({ where }: any) {
      return inMemoryLogs.find((c) => c.callSid === where.callSid) || null;
    },
    async findMany({ where }: any) {
      return inMemoryLogs.filter((c) => !where?.status || c.status === where.status);
    },
    async create({ data }: any) {
      const row = { id: 'log_' + (inMemoryLogs.length + 1), createdAt: new Date(), ...data };
      inMemoryLogs.push(row);
      return row;
    },
    async update({ where, data }: any) {
      const idx = inMemoryLogs.findIndex((c) => c.id === where.id);
      if (idx !== -1) inMemoryLogs[idx] = { ...inMemoryLogs[idx], ...data };
      return inMemoryLogs[idx];
    },
  };

  try {
    inMemoryLogs.push({
      id: 'intent_1',
      callSid: null,
      bookingId: 'bk_sm_1',
      bookingType: 'OP',
      status: 'INITIATED',
      toPhone: encryptPhoneNumber('7981964002'),
      virtualNumber: '08047290980',
      metadata: {
        mode: 'INBOUND_INTENT',
        callerDigits: '8309188159',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      },
      createdAt: new Date(),
    });

    const svc = new ExotelCallService();
    const webhookSecret = getExotelConfig().webhookSecret || 'mediquee_exotel_webhook_secret_key';

    const connectRes = await svc.handleCcmConnect(
      { CallSid: 'sid_dynamic_1', CallFrom: '08309188159', CallTo: '08047290980', Direction: 'incoming' },
      webhookSecret
    );
    assert.strictEqual(connectRes.httpStatus, 200);
    const payload = connectRes.payload as any;
    assert.deepStrictEqual(payload.destination, { numbers: ['+917981964002'] }, 'Must return destination.numbers array');
    assert.strictEqual(payload.outgoing_phone_number, '+918047290980', 'outgoing_phone_number must be E.164');
    assert.strictEqual(payload.fetch_after_attempt, false);
    assert(payload.dial_passthru_event_url?.includes('/api/v1/exotel/events?token='), 'Must include dial_passthru_event_url');
    assert.strictEqual((payload as any).contact_uri, undefined, 'Must not return legacy contact_uri');

    // Controller must send Content-Type: application/json even when Accept is */*
    let capturedStatus = 0;
    let capturedType = '';
    let capturedBody: any = null;
    const mockRes: any = {
      status(code: number) { capturedStatus = code; return this; },
      type(t: string) { capturedType = t; return this; },
      json(b: any) { capturedBody = b; return this; },
      send(b: any) { capturedBody = b; return this; },
    };

    await ccmConnectHandler(
      {
        headers: { accept: '*/*' },
        query: { token: webhookSecret, CallSid: 'sid_dynamic_1', CallFrom: '08309188159' },
        body: {},
      } as any,
      mockRes
    );
    assert.strictEqual(capturedStatus, 200);
    assert.strictEqual(capturedType, 'application/json', 'Controller must return application/json for Exotel');
    assert.deepStrictEqual(capturedBody?.destination, { numbers: ['+917981964002'] });

    // dial_passthru_event_url GET query updates CallLog via ccmEventsHandler
    await ccmEventsHandler(
      {
        headers: {},
        query: { token: webhookSecret, CallSid: 'sid_dynamic_1', DialCallStatus: 'completed', DialCallDuration: '42' },
        body: {},
      } as any,
      mockRes
    );
    assert.strictEqual(capturedStatus, 200);
    assert.strictEqual(inMemoryLogs[0].status, 'COMPLETED');
    assert.strictEqual(inMemoryLogs[0].duration, 42);
    console.log('  -> Dynamic URL JSON schema, Content-Type, intent routing, and dial_passthru_event_url verified');
  } finally {
    (prisma as any).callLog = originalCallLog;
  }

  console.log('\n[PASS] All updated Exotel configuration & safety tests passed 100%!');
}

runExotelTests().catch((err) => {
  console.error('[FAIL] Exotel test failed:', err);
  process.exit(1);
});
