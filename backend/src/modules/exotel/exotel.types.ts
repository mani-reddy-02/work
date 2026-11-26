export interface ExotelConfig {
  accountSid: string;
  apiKey: string;
  apiToken: string;
  subdomain: string;
  baseUrl: string;
  callerId?: string;
  appId?: string;
  webhookSecret?: string;
  enableRecording: boolean;
  statusCallbackUrl?: string;
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
  recordingEnabled: boolean;
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
   * The destination number to call (patient or second leg).
   * Optional when url (applet flow) is provided.
   * Format: E.164 (e.g. +919876543210) or 10-digit Indian phone number
   */
  to?: string;
  /**
   * The first party phone number (called first by Exotel).
   */
  from: string;
  /**
   * The Exotel-approved virtual number (ExoPhone) to show as Caller ID.
   * If omitted, falls back to EXOTEL_CALLER_ID from server configuration.
   * Must NOT be a personal mobile number.
   */
  callerId?: string;
  /**
   * Applet Flow URL for CCM (e.g. http://my.exotel.com/{account_sid}/exoml/start_voice/{app_id})
   */
  url?: string;
  /**
   * Call Type: 'trans' (transactional)
   */
  callType?: string;
  /**
   * Maximum call duration in seconds (cap)
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
   * Webhook callback events to subscribe to (e.g. ['terminal', 'answered'])
   */
  statusCallbackEvents?: string[];
  /**
   * Webhook content type ('application/json' or 'application/x-www-form-urlencoded')
   */
  statusCallbackContentType?: string;
  /**
   * Record this call (defaults to false)
   */
  record?: boolean;
  /**
   * Custom tracking identifier (e.g. bookingId or callLogId or correlation token)
   */
  customField?: string;
}

/**
 * Exotel Programmable Connect (Dynamic URL) Response Payload
 * Spec: https://support.exotel.com/support/solutions/articles/3000096873-working-with-connect-applet-dynamic-url-
 * Must be returned with HTTP 200 OK and Content-Type: application/json
 */
export interface ExotelCcmConnectResponse {
  fetch_after_attempt?: boolean;
  destination: {
    numbers: string[];
  };
  outgoing_phone_number?: string;
  record?: boolean;
  recording_channels?: 'single' | 'dual';
  max_ringing_duration?: number;
  max_conversation_duration?: number;
  dial_passthru_event_url?: string;
  [key: string]: unknown;
}

/**
 * Exotel Connect Applet (Dynamic URL) Request Query Parameters (GET /connect, GET /fallback)
 */
export interface ExotelCcmQueryParams {
  CallSid?: string;
  Direction?: string;
  From?: string;
  CallFrom?: string;
  To?: string;
  CallTo?: string;
  DialWhomNumber?: string;
  CustomField?: string;
  flow_id?: string;
  token?: string;
  [key: string]: unknown;
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
    Duration?: string | number;
    [key: string]: unknown;
  };
  RestException?: {
    Status: number;
    Message: string;
    Code?: string;
  };
}

export interface ExotelWebhookPayload {
  CallSid?: string;
  Sid?: string;
  Status?: string;
  EventType?: string;
  DialCallStatus?: string;
  From?: string;
  To?: string;
  PhoneNumberSid?: string;
  StartTime?: string;
  EndTime?: string;
  ConversationDuration?: string | number;
  DialCallDuration?: string | number;
  Duration?: string | number;
  RecordingUrl?: string;
  Price?: string;
  CustomField?: string;
  Legs?: any;
  DisconnectedBy?: string;
  [key: string]: unknown;
}

export interface ExotelHostVerificationResult {
  testedHost: string;
  isVerified: boolean;
  statusCode: number;
  accountSid?: string;
  friendlyName?: string;
  status?: string;
  error?: string;
}

export interface ExotelSmsParams {
  to: string;
  body: string;
  from?: string;
  encodingType?: 'plain' | 'unicode';
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
