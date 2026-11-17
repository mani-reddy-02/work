import {
  ExotelCallParams,
  ExotelCallResponse,
  ExotelClientOptions,
  ExotelConfig,
  ExotelSmsParams,
  ExotelSmsResponse,
} from './exotel.types';
import {
  assertCallReady,
  assertExotelConfigured,
  getExotelConfig,
  getExotelSafeStatus,
  isLikelyPersonalMobileNumber,
  validateExotelConfig,
} from './exotel.config';

export class ExotelClient {
  private config: ExotelConfig;
  private options: ExotelClientOptions;

  constructor(options: ExotelClientOptions = {}) {
    this.config = getExotelConfig();
    this.options = {
      timeoutMs: options.timeoutMs || 15000,
      maxRetries: options.maxRetries || 2,
    };
  }

  /**
   * Safe status check: returns true if core API credentials are present
   */
  public static isConfigured(): boolean {
    return validateExotelConfig().isValid;
  }

  /**
   * Safe call-ready check: returns true if API credentials AND an approved ExoPhone Caller ID are present
   */
  public static isCallReady(): boolean {
    return validateExotelConfig().callReady;
  }

  /**
   * Safe configuration validation result (without leaking secrets)
   */
  public static validateConfig() {
    return validateExotelConfig();
  }

  /**
   * Safe boolean indicators of configuration
   */
  public static getStatus() {
    return getExotelSafeStatus();
  }

  /**
   * Singleton instance
   */
  private static instance: ExotelClient | null = null;
  public static getInstance(options?: ExotelClientOptions): ExotelClient {
    if (!this.instance) {
      this.instance = new ExotelClient(options);
    }
    return this.instance;
  }

  /**
   * Generate Server-Side HTTP Basic Authentication header
   * Format: "Basic base64(EXOTEL_API_KEY:EXOTEL_API_TOKEN)"
   */
  private getAuthHeader(): string {
    const { apiKey, apiToken } = assertExotelConfigured();
    const tokenString = `${apiKey}:${apiToken}`;
    return `Basic ${Buffer.from(tokenString).toString('base64')}`;
  }

  /**
   * Normalize telephone number for Exotel
   * Indian 10-digit numbers normalized cleanly
   */
  public normalizePhoneNumber(phone: string): string {
    const cleaned = (phone || '').replace(/\s+|-/g, '');
    const digits = cleaned.replace(/\D/g, '');

    if (digits.length === 10) {
      return digits;
    }
    if (digits.length === 12 && digits.startsWith('91')) {
      return digits.slice(2);
    }
    if (digits.length === 11 && digits.startsWith('0')) {
      return digits.slice(1);
    }
    return cleaned;
  }

  /**
   * Validates call parameters without placing a call.
   * Confirms both legs are present, validates Caller ID is an approved virtual number,
   * and verifies that APP_ID is not assumed or required.
   */
  public validateCallParams(params: ExotelCallParams): {
    isValid: boolean;
    resolvedCallerId: string;
    normalizedFrom: string;
    normalizedTo: string;
  } {
    const { resolvedCallerId } = assertCallReady(params.callerId);

    if (!params.from || !params.from.trim()) {
      throw new Error('Parameter "from" (first leg) is required to initiate a call.');
    }
    if (!params.to || !params.to.trim()) {
      throw new Error('Parameter "to" (second leg) is required to initiate a call.');
    }

    const normalizedFrom = this.normalizePhoneNumber(params.from);
    const normalizedTo = this.normalizePhoneNumber(params.to);

    return {
      isValid: true,
      resolvedCallerId,
      normalizedFrom,
      normalizedTo,
    };
  }

  /**
   * Initiates a two-legged phone call via Exotel.
   *
   * Note on Exotel API architecture:
   * 1. APP_ID is NOT required for two-party Calls Connect (`Calls/connect.json`).
   *    Exotel automatically dials the `From` leg, then dials the `To` leg and bridges them.
   * 2. Caller ID MUST be an Exotel-approved virtual number (ExoPhone).
   *    Personal mobile numbers are strictly prohibited.
   * 3. If Caller ID is empty or not configured, this method immediately aborts and does NOT place any call.
   */
  public async initiateCall(
    params: ExotelCallParams,
    options: { validateOnly?: boolean } = {}
  ): Promise<ExotelCallResponse> {
    // Strict safety check: enforces Caller ID presence and verifies not a personal number
    const { config, resolvedCallerId } = assertCallReady(params.callerId);
    const { normalizedFrom, normalizedTo } = this.validateCallParams(params);

    // If in validation-only mode, stop before network dispatch
    if (options.validateOnly) {
      return {
        Call: {
          Sid: '',
          AccountSid: config.accountSid,
          From: normalizedFrom,
          To: normalizedTo,
          PhoneNumberSid: resolvedCallerId,
          Status: 'validated-not-dispatched',
        },
      };
    }

    const url = `${config.baseUrl}/Calls/connect.json`;
    const formBody = new URLSearchParams({
      From: normalizedFrom,
      To: normalizedTo,
      CallerId: resolvedCallerId,
      CallType: 'trans', // Standard transactional call
    });

    if (params.timeLimit) {
      formBody.append('TimeLimit', String(params.timeLimit));
    }
    if (params.timeOut) {
      formBody.append('TimeOut', String(params.timeOut));
    }
    if (params.statusCallback) {
      formBody.append('StatusCallback', params.statusCallback);
    }
    if (params.record !== undefined) {
      formBody.append('Record', params.record ? 'true' : 'false');
    }
    if (params.customField) {
      formBody.append('CustomField', params.customField);
    }

    const response = await this.executeHttpRequest(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formBody.toString(),
    });

    return response as ExotelCallResponse;
  }

  /**
   * Sends an SMS via Exotel using server-side Basic Auth.
   * Requires an approved Sender ID / ExoPhone number.
   */
  public async sendSms(
    params: ExotelSmsParams,
    options: { validateOnly?: boolean } = {}
  ): Promise<ExotelSmsResponse> {
    const config = assertExotelConfigured();

    if (!params.to || !params.to.trim()) {
      throw new Error('Parameter "to" is required to send an SMS.');
    }
    if (!params.body || !params.body.trim()) {
      throw new Error('Parameter "body" is required to send an SMS.');
    }

    const senderId = (params.from || config.callerId || '').trim();
    if (!senderId) {
      throw new Error(
        'Cannot send SMS: EXOTEL_CALLER_ID / Sender ID is empty. An Exotel-approved virtual number or Sender ID is required.'
      );
    }

    if (isLikelyPersonalMobileNumber(senderId)) {
      throw new Error(
        `Cannot send SMS: "${senderId}" appears to be a personal mobile number. Exotel requires an approved Sender ID or ExoPhone virtual number.`
      );
    }

    const normalizedTo = this.normalizePhoneNumber(params.to);

    if (options.validateOnly) {
      return {
        SMSMessage: {
          Sid: '',
          AccountSid: config.accountSid,
          From: senderId,
          To: normalizedTo,
          Body: params.body,
          Status: 'validated-not-dispatched',
        },
      };
    }

    const url = `${config.baseUrl}/Sms/send.json`;
    const formBody = new URLSearchParams({
      From: senderId,
      To: normalizedTo,
      Body: params.body,
    });

    if (params.encodingType) {
      formBody.append('EncodingType', params.encodingType);
    }
    if (params.statusCallback) {
      formBody.append('StatusCallback', params.statusCallback);
    }

    const response = await this.executeHttpRequest(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formBody.toString(),
    });

    return response as ExotelSmsResponse;
  }

  /**
   * Retrieves Call status details by Call SID
   */
  public async getCallDetails(callSid: string): Promise<ExotelCallResponse> {
    const config = assertExotelConfigured();
    const url = `${config.baseUrl}/Calls/${callSid}.json`;
    return (await this.executeHttpRequest(url, { method: 'GET' })) as ExotelCallResponse;
  }

  /**
   * Retrieves SMS status details by SMS SID
   */
  public async getSmsDetails(smsSid: string): Promise<ExotelSmsResponse> {
    const config = assertExotelConfigured();
    const url = `${config.baseUrl}/Sms/Messages/${smsSid}.json`;
    return (await this.executeHttpRequest(url, { method: 'GET' })) as ExotelSmsResponse;
  }

  /**
   * Executes HTTP request with server-side Basic Auth header and timeout protection
   */
  private async executeHttpRequest(
    url: string,
    init: {
      method: 'GET' | 'POST';
      headers?: Record<string, string>;
      body?: string;
    }
  ): Promise<unknown> {
    const authHeader = this.getAuthHeader();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.options.timeoutMs);

    try {
      const response = await fetch(url, {
        method: init.method,
        headers: {
          Authorization: authHeader,
          Accept: 'application/json',
          ...(init.headers || {}),
        },
        body: init.body,
        signal: controller.signal,
      });

      const responseText = await response.text();
      let parsedData: any;
      try {
        parsedData = JSON.parse(responseText);
      } catch {
        parsedData = { rawResponse: responseText };
      }

      if (!response.ok) {
        const errorMsg =
          parsedData?.RestException?.Message ||
          parsedData?.message ||
          `Exotel API returned HTTP error ${response.status} (${response.statusText})`;
        throw new Error(errorMsg);
      }

      return parsedData;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error(`Exotel API request timed out after ${this.options.timeoutMs}ms`);
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }
}
