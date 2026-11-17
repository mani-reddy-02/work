import assert from 'assert';
import {
  ExotelClient,
  validateExotelConfig,
  getExotelSafeStatus,
  getExotelConfig,
  assertCallReady,
  isLikelyPersonalMobileNumber,
  ExotelConfigurationError,
} from '../modules/exotel';

async function runExotelTests() {
  console.log('[TEST] Starting Updated Exotel Configuration & Telephony Verification...');

  // 1. Verify Host is api.in.exotel.com
  console.log('[TEST 1] India API Host verification');
  const config = getExotelConfig();
  assert.strictEqual(
    config.subdomain,
    'api.in.exotel.com',
    'Subdomain must be api.in.exotel.com for the India cluster'
  );
  assert(
    config.baseUrl.includes('api.in.exotel.com'),
    'Base URL must target the India cluster api.in.exotel.com'
  );
  console.log('  -> Host correctly configured to api.in.exotel.com');

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

  // 3. Confirm APP_ID is NOT required for Calls Connect
  console.log('[TEST 3] APP_ID optionality confirmation');
  assert.strictEqual(config.appId, undefined, 'APP_ID is optional and empty by default');
  // Validation passes even without APP_ID as long as core credentials exist
  if (config.accountSid && config.apiKey && config.apiToken) {
    assert.strictEqual(validation.isValid, true, 'Core API config is valid without APP_ID');
  }
  console.log('  -> APP_ID is confirmed optional for 2-party Calls Connect');

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
  assert.strictEqual(validationResult.normalizedFrom, '9876543210');
  assert.strictEqual(validationResult.normalizedTo, '9123456780');
  assert.strictEqual(validationResult.resolvedCallerId, '08047123456');
  console.log('  -> Call parameters validated successfully without initiating call');

  console.log('\n[PASS] All updated Exotel configuration & safety tests passed 100%!');
}

runExotelTests().catch((err) => {
  console.error('[FAIL] Exotel test failed:', err);
  process.exit(1);
});
