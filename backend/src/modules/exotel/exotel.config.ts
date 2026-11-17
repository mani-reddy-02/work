import { env } from '../../config/env';
import {
  ExotelConfig,
  ExotelConfigValidation,
  ExotelSafeConfigStatus,
} from './exotel.types';

export class ExotelConfigurationError extends Error {
  public readonly missingVariables: string[];

  constructor(missingVariables: string[], customMessage?: string) {
    const message =
      customMessage ||
      `Exotel configuration is incomplete. Missing required environment variable(s): ${missingVariables.join(
        ', '
      )}. Please configure them in your backend .env file.`;
    super(message);
    this.name = 'ExotelConfigurationError';
    this.missingVariables = missingVariables;
  }
}

/**
 * Validates whether a phone number matches the format of an Exotel virtual number (ExoPhone).
 * Personal 10-digit mobile numbers (starting with 6, 7, 8, 9 without country/virtual prefix)
 * are rejected as Caller ID because Exotel strictly requires a purchased/assigned ExoPhone virtual number.
 */
export function isLikelyPersonalMobileNumber(phone?: string): boolean {
  if (!phone) return false;
  const digits = phone.replace(/\D/g, '');
  // A bare 10-digit number starting with 6-9 in India is a personal subscriber mobile number
  if (digits.length === 10 && /^[6-9]/.test(digits)) {
    return true;
  }
  return false;
}

function cleanEnvValue(val?: string): string {
  if (!val) return '';
  const trimmed = val.trim();
  // Strip enclosing quotes if present
  return trimmed.replace(/^["'](.*)["']$/, '$1').trim();
}

/**
 * Retrieve current Exotel configuration values from server environment.
 * Default host is India API host: api.in.exotel.com
 * Never logs or exposes secret credentials.
 */
export function getExotelConfig(): ExotelConfig {
  const accountSid = cleanEnvValue(env.EXOTEL_ACCOUNT_SID || process.env.EXOTEL_ACCOUNT_SID);
  const apiKey = cleanEnvValue(env.EXOTEL_API_KEY || process.env.EXOTEL_API_KEY);
  const apiToken = cleanEnvValue(env.EXOTEL_API_TOKEN || process.env.EXOTEL_API_TOKEN);
  const subdomain = cleanEnvValue(env.EXOTEL_SUBDOMAIN || process.env.EXOTEL_SUBDOMAIN) || 'api.in.exotel.com';
  const callerId = cleanEnvValue(env.EXOTEL_CALLER_ID || process.env.EXOTEL_CALLER_ID) || undefined;
  const appId = cleanEnvValue(env.EXOTEL_APP_ID || process.env.EXOTEL_APP_ID) || undefined;

  let baseUrl = cleanEnvValue(env.EXOTEL_BASE_URL || process.env.EXOTEL_BASE_URL);
  if (!baseUrl) {
    baseUrl = `https://${subdomain}/v1/Accounts/${accountSid}`;
  } else {
    baseUrl = baseUrl.replace(/\/+$/, '');
    if (accountSid && !baseUrl.includes(accountSid) && !baseUrl.endsWith('/Accounts')) {
      baseUrl = `${baseUrl}/${accountSid}`;
    }
  }

  const isConfigured = Boolean(accountSid && apiKey && apiToken);
  const isCallReady = Boolean(isConfigured && callerId);

  return {
    accountSid,
    apiKey,
    apiToken,
    subdomain,
    baseUrl,
    callerId,
    appId,
    isConfigured,
    isCallReady,
  };
}

/**
 * Validate presence of required Exotel credentials without revealing secret values.
 * Identifies which items are active and which are pending from Exotel.
 */
export function validateExotelConfig(): ExotelConfigValidation {
  const config = getExotelConfig();
  const missing: string[] = [];
  const pendingFromExotel: string[] = [];

  // Core API Authentication Requirements
  if (!config.accountSid) {
    missing.push('EXOTEL_ACCOUNT_SID');
  }
  if (!config.apiKey) {
    missing.push('EXOTEL_API_KEY');
  }
  if (!config.apiToken) {
    missing.push('EXOTEL_API_TOKEN');
  }

  // Telephony Outbound Caller ID Requirement
  if (!config.callerId) {
    pendingFromExotel.push(
      'EXOTEL_CALLER_ID: Exotel-approved virtual number (ExoPhone) pending allocation from Exotel dashboard'
    );
  } else if (isLikelyPersonalMobileNumber(config.callerId)) {
    pendingFromExotel.push(
      'EXOTEL_CALLER_ID: Personal mobile number detected. Caller ID must be an Exotel-approved virtual number (ExoPhone)'
    );
  }

  // Note: EXOTEL_APP_ID is optional and NOT required for direct two-party Calls Connect
  const isValid = missing.length === 0;
  const callReady = isValid && Boolean(config.callerId) && !isLikelyPersonalMobileNumber(config.callerId);

  const status: ExotelSafeConfigStatus = {
    configured: isValid,
    callReady,
    hasAccountSid: Boolean(config.accountSid),
    hasApiKey: Boolean(config.apiKey),
    hasApiToken: Boolean(config.apiToken),
    hasCallerId: Boolean(config.callerId),
    hasAppId: Boolean(config.appId),
    subdomain: config.subdomain,
    baseUrl: config.baseUrl
      ? config.accountSid
        ? config.baseUrl.replace(config.accountSid, '[ACCOUNT_SID]')
        : config.baseUrl
      : '',
    pendingFromExotel,
  };

  return {
    isValid,
    configured: isValid,
    callReady,
    missing,
    pendingFromExotel,
    status,
  };
}

/**
 * Ensures core Exotel credentials are configured; throws ExotelConfigurationError
 * naming only missing variables without exposing any secret keys.
 */
export function assertExotelConfigured(): ExotelConfig {
  const validation = validateExotelConfig();
  if (!validation.isValid) {
    throw new ExotelConfigurationError(validation.missing);
  }
  return getExotelConfig();
}

/**
 * Ensures Exotel is ready to place real telephone calls.
 * Throws an explicit error if Caller ID is empty or not an approved ExoPhone.
 */
export function assertCallReady(customCallerId?: string): { config: ExotelConfig; resolvedCallerId: string } {
  const config = assertExotelConfigured();
  const callerId = (customCallerId || config.callerId || '').trim();

  if (!callerId) {
    throw new ExotelConfigurationError(
      ['EXOTEL_CALLER_ID'],
      'Cannot initiate telephone call: EXOTEL_CALLER_ID is empty. Real calls require an Exotel-approved virtual number (ExoPhone). Do not use a personal mobile number.'
    );
  }

  if (isLikelyPersonalMobileNumber(callerId)) {
    throw new ExotelConfigurationError(
      ['EXOTEL_CALLER_ID'],
      `Cannot initiate telephone call: "${callerId}" appears to be a personal mobile number. Exotel requires an approved virtual number (ExoPhone) as Caller ID.`
    );
  }

  return { config, resolvedCallerId: callerId };
}

/**
 * Safe public inspection of Exotel status (boolean flags only).
 */
export function getExotelSafeStatus(): ExotelSafeConfigStatus {
  return validateExotelConfig().status;
}
