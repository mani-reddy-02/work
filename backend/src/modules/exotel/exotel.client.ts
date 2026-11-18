import {
  ExotelCallParams,
  ExotelCallResponse,
  ExotelClientOptions,
  ExotelConfig,
  ExotelHostVerificationResult,
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
   * Verify API Region Host against Exotel account without placing any live calls.
   * Performs read-only authenticated metadata check:
   * 1. Attempts GET /v1/Accounts/{AccountSid}/Calls.json?PageSize=1 (Standard Voice API permission)
   * 2. Falls back to GET /v1/Accounts/{AccountSid}.json (Master Account permission)
   */
  public static async verifyApiHost(subdomainOverride?: string): Promise<ExotelHostVerificationResult> {
    const config = getExotelConfig();
    const targetHost = (subdomainOverride || config.subdomain || 'api.exotel.com').trim();
    
    if (!config.accountSid || !config.apiKey || !config.apiToken) {
      return {
        testedHost: targetHost,
        isVerified: false,
        statusCode: 400,
        error: 'Missing required credentials (EXOTEL_ACCOUNT_SID, EXOTEL_API_KEY, or EXOTEL_API_TOKEN)',
      };
    }

    const authHeader = `Basic ${Buffer.from(`${config.apiKey}:${config.apiToken}`).toString('base64')}`;

    // Read-only Voice call history check (works with standard Exotel Voice API credentials)
    try {
      const callsUrl = `https://${targetHost}/v1/Accounts/${config.accountSid}/Calls.json?PageSize=1`;
      const callsRes = await fetch(callsUrl, {
        method: 'GET',
        headers: {
          Authorization: authHeader,
          Accept: 'application/json',
        },
      });

      if (callsRes.ok) {
        const callsData: any = await callsRes.json().catch(() => ({}));
        return {
          testedHost: targetHost,
          isVerified: true,
          statusCode: callsRes.status,
          accountSid: config.accountSid,
          status: 'active',
          friendlyName: `Exotel Voice Account (Total calls: ${callsData?.Metadata?.Total ?? 0})`,
        };
      }

      // If call list endpoint failed with 401 or network error, test account root
      const accUrl = `https://${targetHost}/v1/Accounts/${config.accountSid}.json`;
      const accRes = await fetch(accUrl, {
        method: 'GET',
        headers: {
          Authorization: authHeader,
          Accept: 'application/json',
        },
      });

      const responseText = await accRes.text();
      let parsedData: any;
      try {
        parsedData = JSON.parse(responseText);
      } catch {
        parsedData = {};
      }

      if (accRes.ok) {
        return {
          testedHost: targetHost,
          isVerified: true,
          statusCode: accRes.status,
          accountSid: parsedData?.Account?.Sid || config.accountSid,
          friendlyName: parsedData?.Account?.FriendlyName,
          status: parsedData?.Account?.Status,
        };
      }

      const errMsg =
        parsedData?.RestException?.Message ||
        parsedData?.message ||
        `Exotel host ${targetHost} rejected credentials with HTTP ${callsRes.status}`;

      return {
        testedHost: targetHost,
        isVerified: false,
        statusCode: callsRes.status || accRes.status,
        error: errMsg,
      };
    } catch (err: any) {
      return {
        testedHost: targetHost,
        isVerified: false,
        statusCode: 0,
        error: err.message || 'Network connectivity error during host verification',
      };
    }
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
   * Normalize telephone number for Exotel in standard E.164 format.
   * Cleans white spaces and hyphens. Converts 10-digit Indian numbers to +91XXXXXXXXXX.
   */
  public normalizePhoneNumber(phone: string): string {
    if (!phone) return '';
    const cleaned = phone.replace(/[\s-]/g, '').trim();
    if (cleaned.startsWith('+')) {
      return cleaned;
    }
    const digits = cleaned.replace(/\D/g, '');
    if (digits.length === 10) {
      return `+91${digits}`;
    }
    if (digits.length === 11 && digits.startsWith('0')) {
      return `+91${digits.slice(1)}`;
    }
    if (digits.length === 12 && digits.startsWith('91')) {
      return `+${digits}`;
    }
    return cleaned;
  }

  /**
   * Normalizes the Exotel-approved virtual number (ExoPhone).
   * ExoPhone virtual numbers (e.g. 08047290980) retain their standard digit format.
   */
  public normalizeCallerId(callerId: string): string {
    if (!callerId) return '';
    return callerId.replace(/[\s-]/g, '').trim();
  }

  /**
   * Validates call parameters without placing a call.
   * Confirms legs or applet URL are present, validates Caller ID is an approved virtual number,
   * and verifies required fields.
   */
  public validateCallParams(params: ExotelCallParams): {
    isValid: boolean;
    resolvedCallerId: string;
    normalizedFrom: string;
    normalizedTo?: string;
  } {
    const { resolvedCallerId } = assertCallReady(params.callerId);

    if (!params.from || !params.from.trim()) {
      throw new Error('Parameter "from" (first leg) is required to initiate a call.');
    }
    if (!params.url && (!params.to || !params.to.trim())) {
      throw new Error('Parameter "to" (second leg) or "url" (applet flow) is required to initiate a call.');
    }

    const normalizedFrom = this.normalizePhoneNumber(params.from);
    const normalizedTo = params.to ? this.normalizePhoneNumber(params.to) : undefined;

    return {
      isValid: true,
      resolvedCallerId: this.normalizeCallerId(resolvedCallerId),
      normalizedFrom,
      normalizedTo,
    };
  }

  /**
   * Initiates a phone call via Exotel's Connect API.
   * Supports both:
   * 1. Direct Two Numbers (From + To + CallerId)
   * 2. CCM Programmable Connect (From + Url [Applet] + CallerId + CustomField)
   *
   * Telephony Call Flow:
   * 1. Exotel dials the 'From' number first.
   * 2. When 'From' answers:
   *    - In Direct mode: Exotel dials the 'To' number and bridges.
   *    - In CCM Applet mode: Exotel executes Applet, hits Primary URL, and dials returned destination.
   * 3. Both parties see 'CallerId' (08047290980) on their caller display.
   *
   * Call Recording Policy:
   * Call recording defaults to false. It is only enabled if both params.record
   * and EXOTEL_ENABLE_RECORDING server environment flag are set to true.
   */
  public async initiateCall(
    params: ExotelCallParams,
    options: { validateOnly?: boolean } = {}
  ): Promise<ExotelCallResponse> {
    const { config } = assertCallReady(params.callerId);
    const { normalizedFrom, normalizedTo, resolvedCallerId } = this.validateCallParams(params);

    if (options.validateOnly) {
      return {
        Call: {
          Sid: '',
          AccountSid: config.accountSid,
          From: normalizedFrom,
          To: normalizedTo || '',
          PhoneNumberSid: resolvedCallerId,
          Status: 'validated-not-dispatched',
        },
      };
    }

    const url = `${config.baseUrl}/Calls/connect.json`;
    const formBody = new URLSearchParams({
      From: normalizedFrom,
      CallerId: resolvedCallerId,
      CallType: params.callType || 'trans', // Standard transactional call
    });

    if (params.url) {
      formBody.append('Url', params.url);
    } else if (normalizedTo) {
      formBody.append('To', normalizedTo);
    }

    if (params.timeLimit) {
      formBody.append('TimeLimit', String(params.timeLimit));
    }
    if (params.timeOut) {
      formBody.append('TimeOut', String(params.timeOut));
    }
    if (params.statusCallback) {
      formBody.append('StatusCallback', params.statusCallback);
      formBody.append('StatusCallbackContentType', params.statusCallbackContentType || 'application/json');
      if (params.statusCallbackEvents && params.statusCallbackEvents.length > 0) {
        for (const ev of params.statusCallbackEvents) {
          formBody.append('StatusCallbackEvents[]', ev);
        }
      } else {
        formBody.append('StatusCallbackEvents[]', 'terminal');
      }
    }

    // Call Recording: strictly opt-in and controlled by policy
    const recordEnabled = Boolean(params.record && config.enableRecording);
    formBody.append('Record', recordEnabled ? 'true' : 'false');

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
