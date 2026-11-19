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
 * Constructs a fully qualified Exotel Accounts Base URL including Account SID.
 * Expected format: https://{host}/v1/Accounts/{accountSid}
 * - Removes trailing slashes.
 * - Appends the Account SID exactly once.
 * - Does not duplicate the Account SID if already present in baseUrl.
 * - Supports base URLs with or without an Account SID.
 * - Supports custom domains, regional clusters (e.g. api.in.exotel.com), and standard api.exotel.com.
 */
export function buildExotelBaseUrl(
  rawBaseUrl?: string,
  subdomain?: string,
  accountSid?: string
): string {
  const cleanSid = (accountSid || '').trim();
  const cleanSubdomain = (subdomain || '').trim() || 'api.exotel.com';
  let url = (rawBaseUrl || '').trim();

  // 1. If no custom base URL provided, construct standard URL from subdomain & accountSid
  if (!url) {
    return cleanSid
      ? `https://${cleanSubdomain}/v1/Accounts/${cleanSid}`
      : `https://${cleanSubdomain}/v1/Accounts`;
  }

  // 2. Strip all trailing slashes
  url = url.replace(/\/+$/, '');

  // 3. If accountSid is empty or undefined, return cleaned URL
  if (!cleanSid) {
    return url;
  }

  // 4. Check if the URL path already contains accountSid as a segment (prevent duplicate SID)
  const segments = url.split('/');
  const hasSidSegment = segments.some((seg) => seg.toLowerCase() === cleanSid.toLowerCase());
  if (hasSidSegment) {
    return url;
  }

  // 5. If URL ends with /v1/Accounts or /Accounts (case-insensitive), append Account SID
  if (url.toLowerCase().endsWith('/accounts')) {
    return `${url}/${cleanSid}`;
  }

  // 6. If URL ends with /v1, append Accounts/{accountSid}
  if (url.toLowerCase().endsWith('/v1')) {
    return `${url}/Accounts/${cleanSid}`;
  }

  // 7. If URL doesn't contain /accounts at all (e.g. "https://api.exotel.com"), append /v1/Accounts/{accountSid}
  if (!url.toLowerCase().includes('/accounts')) {
    return `${url}/v1/Accounts/${cleanSid}`;
  }

  // 8. Default fallback: append Account SID
  return `${url}/${cleanSid}`;
}

/**
 * Retrieve current Exotel configuration values from server environment.
 * Default host is Singapore API host: api.exotel.com
 * Never logs or exposes secret credentials.
 */
export function getExotelConfig(): ExotelConfig {
  const accountSid = cleanEnvValue(env.EXOTEL_ACCOUNT_SID || process.env.EXOTEL_ACCOUNT_SID);
  const apiKey = cleanEnvValue(env.EXOTEL_API_KEY || process.env.EXOTEL_API_KEY);
  const apiToken = cleanEnvValue(env.EXOTEL_API_TOKEN || process.env.EXOTEL_API_TOKEN);
  const subdomain = cleanEnvValue(env.EXOTEL_SUBDOMAIN || process.env.EXOTEL_SUBDOMAIN) || 'api.exotel.com';
  const callerId = cleanEnvValue(env.EXOTEL_CALLER_ID || process.env.EXOTEL_CALLER_ID) || undefined;
  const appId = cleanEnvValue(env.EXOTEL_APP_ID || process.env.EXOTEL_APP_ID) || undefined;
  const webhookSecret = cleanEnvValue(env.EXOTEL_WEBHOOK_SECRET || process.env.EXOTEL_WEBHOOK_SECRET) || 'mediquee_exotel_webhook_secret_key';
  const enableRecording = (cleanEnvValue(env.EXOTEL_ENABLE_RECORDING || process.env.EXOTEL_ENABLE_RECORDING) === 'true');
  const statusCallbackUrl = cleanEnvValue(env.EXOTEL_STATUS_CALLBACK_URL || process.env.EXOTEL_STATUS_CALLBACK_URL) || undefined;

  const baseUrl = buildExotelBaseUrl(
    cleanEnvValue(env.EXOTEL_BASE_URL || process.env.EXOTEL_BASE_URL),
    subdomain,
    accountSid
  );

  const isConfigured = Boolean(accountSid && apiKey && apiToken);
  const isCallReady = Boolean(isConfigured && callerId && !isLikelyPersonalMobileNumber(callerId));

  return {
    accountSid,
    apiKey,
    apiToken,
    subdomain,
    baseUrl,
    callerId,
    appId,
    webhookSecret,
    enableRecording,
    statusCallbackUrl,
    isConfigured,
    isCallReady,
  };
}

/**
 * Constructs the Exotel Applet Flow URL for app-initiated calls (CCM)
 * Format: http://my.exotel.com/{account_sid}/exoml/start_voice/{app_id}
 */
export function getExotelAppletUrl(appIdOverride?: string): string | undefined {
  const config = getExotelConfig();
  const effectiveAppId = appIdOverride || config.appId;
  if (!effectiveAppId || !config.accountSid) {
    return undefined;
  }
  return `http://my.exotel.com/${config.accountSid}/exoml/start_voice/${effectiveAppId.trim()}`;
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
    recordingEnabled: config.enableRecording,
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
export function assertCallReady(callerIdOverride?: string): {
  config: ExotelConfig;
  resolvedCallerId: string;
} {
  const config = assertExotelConfigured();
  const effectiveCallerId = (callerIdOverride !== undefined ? callerIdOverride : (config.callerId || '')).trim();

  if (!effectiveCallerId) {
    throw new Error(
      'Cannot initiate outbound call: EXOTEL_CALLER_ID is empty. An Exotel-approved virtual number (ExoPhone) is required.'
    );
  }

  if (isLikelyPersonalMobileNumber(effectiveCallerId)) {
    throw new Error(
      `Cannot initiate outbound call: "${effectiveCallerId}" appears to be a personal mobile number. Caller ID must be an Exotel-approved virtual number (ExoPhone).`
    );
  }

  return {
    config,
    resolvedCallerId: effectiveCallerId,
  };
}

/**
 * Safe summary object safe to expose via health checks or logs
 */
export function getExotelSafeStatus(): ExotelSafeConfigStatus {
  return validateExotelConfig().status;
}
