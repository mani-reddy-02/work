export interface ExotelConfig {
  accountSid: string;
  apiKey: string;
  apiToken: string;
  subdomain: string;
  baseUrl: string;
  callerId?: string;
  appId?: string;
  isConfigured: boolean;
  isCallReady: boolean;
}

export interface ExotelSafeConfigStatus {
  configured: boolean;
  callReady: boolean;
  hasAccountSid: boolean;
  hasApiKey: boolean;
  hasApiToken: boolean;
  hasCallerId: boolean;
  hasAppId: boolean;
  subdomain: string;
  baseUrl: string;
  pendingFromExotel: string[];
}

export interface ExotelConfigValidation {
  isValid: boolean;
  configured: boolean;
  callReady: boolean;
  missing: string[];
  pendingFromExotel: string[];
  status: ExotelSafeConfigStatus;
}

export interface ExotelCallParams {
  /**
   * The destination number to call (patient or second leg)
   * Format: E.164 or 10-digit Indian phone number
   */
  to: string;
  /**
   * The first party phone number (doctor, agent, or front office)
   */
  from: string;
  /**
   * The Exotel-approved virtual number (ExoPhone) to show as Caller ID.
   * If omitted, falls back to EXOTEL_CALLER_ID from server configuration.
   * Must NOT be a personal mobile number.
   */
  callerId?: string;
  /**
   * Maximum call duration in seconds
   */
  timeLimit?: number;
  /**
   * Ring timeout in seconds
   */
  timeOut?: number;
  /**
   * Webhook URL for call status events
   */
  statusCallback?: string;
  /**
   * Record this call
   */
  record?: boolean;
  /**
   * Custom tracking identifier
   */
  customField?: string;
}

export interface ExotelCallResponse {
  Call?: {
    Sid: string;
    AccountSid: string;
    To: string;
    From: string;
    PhoneNumberSid?: string;
    Status: string;
    StartTime?: string;
    DateCreated?: string;
    Price?: string;
    [key: string]: unknown;
  };
  RestException?: {
    Status: number;
    Message: string;
    Code?: string;
  };
}

export interface ExotelSmsParams {
  /**
   * Recipient phone number (E.164 or 10-digit Indian mobile number)
   */
  to: string;
  /**
   * Message text content
   */
  body: string;
  /**
   * Sender ID / ExoPhone number (defaults to EXOTEL_CALLER_ID)
   */
  from?: string;
  /**
   * Encoding type
   */
  encodingType?: 'plain' | 'unicode';
  /**
   * Status callback webhook URL
   */
  statusCallback?: string;
}

export interface ExotelSmsResponse {
  SMSMessage?: {
    Sid: string;
    AccountSid: string;
    From: string;
    To: string;
    Body: string;
    Status: string;
    DateSent?: string;
    [key: string]: unknown;
  };
  RestException?: {
    Status: number;
    Message: string;
    Code?: string;
  };
}

export interface ExotelClientOptions {
  timeoutMs?: number;
  maxRetries?: number;
}
