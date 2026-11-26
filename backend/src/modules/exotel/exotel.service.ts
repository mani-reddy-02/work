import crypto from 'crypto';
import { prisma } from '../../config/prisma';
import { env } from '../../config/env';
import { ExotelClient } from './exotel.client';
import {
  ExotelCallParams,
  ExotelCcmConnectResponse,
  ExotelCcmQueryParams,
  ExotelWebhookPayload,
} from './exotel.types';
import { getExotelAppletUrl } from './exotel.config';
import { decryptPhoneNumber, encryptPhoneNumber, maskPhoneNumber } from '../../utils/phoneCrypto';
import { Role } from '@prisma/client';

export type ServiceBookingType = 'OP' | 'VIDEO' | 'NURSING' | 'LAB_WALK_IN' | 'HOME_SAMPLE' | 'LAB';


export class ExotelCallService {
  private client: ExotelClient;

  constructor() {
    this.client = ExotelClient.getInstance();
  }

  /**
   * Helper to access prisma.callLog safely with dynamic fallback
   */
  private static get callLogModel() {
    return (prisma as any).callLog;
  }

  /**
   * Resolve trusted phone numbers and authorize requester across all 5 service types.
   * Strictly prevents user-supplied telephone numbers.
   */
  public async resolveBookingParties(
    bookingId: string,
    bookingType: ServiceBookingType,
    userId: string,
    userRole: string,
    userHospitalId?: string | null
  ): Promise<{
    patientPhone: string;
    hospitalPhone: string;
    patientId?: string;
    hospitalId: string;
    bookingRecord: any;
  }> {
    let patientPhone = '';
    let hospitalPhone = '';
    let patientId: string | undefined;
    let hospitalId = '';
    let bookingRecord: any;

    // 1. HOSPITAL OP & 2. VIDEO CONSULTATION
    if (bookingType === 'OP' || bookingType === 'VIDEO') {
      const op = await prisma.oPBooking.findUnique({
        where: { id: bookingId },
        include: {
          hospital: { select: { id: true, name: true, contactPhone: true, emergencyContact: true } },
          patient: { select: { id: true, phone: true } },
          doctor: { select: { id: true, phone: true } },
        },
      });

      if (!op) {
        throw new Error('OP/Video booking not found');
      }

      bookingRecord = op;
      hospitalId = op.hospitalId;
      patientId = op.patientId || (op as any).patient?.id;
      patientPhone = op.patientPhone || (op as any).patient?.phone || '';
      hospitalPhone = (op as any).hospital?.contactPhone || (op as any).hospital?.emergencyContact || '';

      const isSuperAdmin = userRole === 'SUPER_ADMIN';
      const isPatientOwner = userRole === 'PATIENT' && patientId === userId;
      const isHospitalStaff =
        ['HOSPITAL_ADMIN', 'DOCTOR', 'RECEPTIONIST', 'NURSE'].includes(userRole) &&
        userHospitalId === op.hospitalId;

      if (!isSuperAdmin && !isPatientOwner && !isHospitalStaff) {
        throw new Error('Unauthorized to initiate calls for this booking');
      }
    }
    // 3. HOME NURSING
    else if (bookingType === 'NURSING') {
      const nursing = await prisma.homeNursingBooking.findUnique({
        where: { id: bookingId },
      });

      if (!nursing) {
        throw new Error('Home nursing booking not found');
      }

      const hospital = await prisma.hospital.findUnique({
        where: { id: nursing.hospitalId },
        select: { id: true, contactPhone: true, emergencyContact: true },
      });

      // If a dedicated nurse is assigned, retrieve the nurse's contact phone
      let nursePhone = '';
      if (nursing.nurseId) {
        const nurse = await prisma.user.findUnique({
          where: { id: nursing.nurseId },
          select: { phone: true },
        });
        nursePhone = nurse?.phone || '';
      }

      bookingRecord = nursing;
      hospitalId = nursing.hospitalId;
      patientId = nursing.userId;
      patientPhone = nursing.patientPhone || '';
      // Prefer direct nurse phone if assigned, otherwise hospital desk
      hospitalPhone = nursePhone || hospital?.contactPhone || hospital?.emergencyContact || '';

      const isSuperAdmin = userRole === 'SUPER_ADMIN';
      const isPatientOwner = userRole === 'PATIENT' && nursing.userId === userId;
      const isHospitalStaff =
        ['HOSPITAL_ADMIN', 'NURSE', 'RECEPTIONIST'].includes(userRole) &&
        userHospitalId === nursing.hospitalId;

      if (!isSuperAdmin && !isPatientOwner && !isHospitalStaff) {
        throw new Error('Unauthorized to initiate calls for this nursing booking');
      }
    }
    // 4. LAB WALK-IN & 5. HOME SAMPLE COLLECTION
    else if (bookingType === 'LAB_WALK_IN' || bookingType === 'HOME_SAMPLE' || bookingType === 'LAB') {
      const lab = await prisma.labBooking.findUnique({
        where: { id: bookingId },
        include: {
          hospital: { select: { id: true, contactPhone: true, emergencyContact: true } },
          patient: { select: { id: true, phone: true } },
        },
      });

      if (!lab) {
        throw new Error('Laboratory booking not found');
      }

      bookingRecord = lab;
      hospitalId = lab.hospitalId;
      patientId = lab.patientId;
      patientPhone = (lab as any).patient?.phone || '';

      // For Home Sample Collection, connect with assigned phlebotomist if available
      if (lab.bookingType === 'HOME_COLLECTION' && lab.phlebotomistPhone) {
        hospitalPhone = lab.phlebotomistPhone;
      } else {
        hospitalPhone = (lab as any).hospital?.contactPhone || (lab as any).hospital?.emergencyContact || '';
      }

      const isSuperAdmin = userRole === 'SUPER_ADMIN';
      const isPatientOwner = userRole === 'PATIENT' && lab.patientId === userId;
      const isHospitalStaff =
        ['HOSPITAL_ADMIN', 'LAB_ADMIN', 'RECEPTIONIST'].includes(userRole) &&
        userHospitalId === lab.hospitalId;

      if (!isSuperAdmin && !isPatientOwner && !isHospitalStaff) {
        throw new Error('Unauthorized to initiate calls for this lab booking');
      }
    } else {
      throw new Error(`Unsupported booking type: ${bookingType}`);
    }

    // Reject cancelled or rejected booking states
    const bookingStatus = String(bookingRecord?.status || '').toUpperCase();
    if (bookingStatus === 'CANCELLED' || bookingStatus === 'CANCELED' || bookingStatus === 'REJECTED') {
      throw new Error(`Cannot initiate call for a ${bookingStatus.toLowerCase()} booking`);
    }

    if (!patientPhone.trim()) {
      throw new Error('Patient phone number is not available in verified booking records');
    }
    if (!hospitalPhone.trim()) {
      throw new Error('Hospital or care provider phone number is not available in verified records');
    }

    return {
      patientPhone,
      hospitalPhone,
      patientId,
      hospitalId,
      bookingRecord,
    };
  }

  /**
   * Initiates a Click-to-Call connection via Exotel.
   * Resolves verified phone numbers from database records.
   * Enforces role-based direction and encrypts phone numbers at rest.
   */
  public async initiateCall(params: {
    bookingId: string;
    bookingType?: ServiceBookingType;
    direction?: 'PATIENT_TO_HOSPITAL' | 'HOSPITAL_TO_PATIENT';
    userId: string;
    userRole: string;
    userHospitalId?: string | null;
  }) {
    // 1. Verify Exotel telephony readiness
    if (!ExotelClient.isCallReady()) {
      throw new Error(
        'Exotel telephony service is not configured. An Exotel-approved virtual number (ExoPhone) and credentials are required.'
      );
    }

    const bookingType = params.bookingType || 'OP';

    // 2. Strict role-enforced call direction (Prevents caller spoofing)
    const direction: 'PATIENT_TO_HOSPITAL' | 'HOSPITAL_TO_PATIENT' =
      params.userRole === 'PATIENT' ? 'PATIENT_TO_HOSPITAL' : 'HOSPITAL_TO_PATIENT';

    // 3. Resolve verified numbers from trusted database records
    const parties = await this.resolveBookingParties(
      params.bookingId,
      bookingType,
      params.userId,
      params.userRole,
      params.userHospitalId
    );

    // 4. Determine Leg 1 (From) and Leg 2 (To)
    // Official Exotel API flow: Leg 1 ('From') is called first. When answered, Leg 2 ('To') is called.
    let fromNumber = '';
    let toNumber = '';

    if (direction === 'PATIENT_TO_HOSPITAL') {
      fromNumber = parties.patientPhone;
      toNumber = parties.hospitalPhone;
    } else {
      // Hospital staff calling patient
      const staffUser = await prisma.user.findUnique({
        where: { id: params.userId },
        select: { phone: true },
      });
      fromNumber = staffUser?.phone || parties.hospitalPhone;
      toNumber = parties.patientPhone;
    }

    // 5. Booking-level rate limiting (max 1 active/ringing call within 3 minutes)
    if (ExotelCallService.callLogModel) {
      const recentCall = await ExotelCallService.callLogModel.findFirst({
        where: {
          bookingId: params.bookingId,
          status: { in: ['INITIATED', 'QUEUED', 'RINGING', 'IN_PROGRESS'] },
          createdAt: { gte: new Date(Date.now() - 3 * 60 * 1000) },
        },
      });

      if (recentCall) {
        throw new Error('A call for this booking is already in progress. Please wait before retrying.');
      }
    }

    const virtualNumber = this.client.normalizeCallerId(env.EXOTEL_CALLER_ID || '08047290980');

    // 6. Generate cryptographically random correlation token for CCM mapping
    const correlationToken = `ccm_${crypto.randomBytes(16).toString('hex')}`;
    const correlationExpiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const ccmAppId = env.EXOTEL_APP_ID ? env.EXOTEL_APP_ID.trim() : undefined;
    const appletUrl = ccmAppId ? getExotelAppletUrl(ccmAppId) : undefined;

    // 7. Create persistent CallLog record in database (storing encrypted phone numbers at rest)
    let callLogRecord: any = null;
    if (ExotelCallService.callLogModel) {
      callLogRecord = await ExotelCallService.callLogModel.create({
        data: {
          bookingId: params.bookingId,
          bookingType,
          initiatedById: params.userId,
          callerRole: params.userRole as Role,
          fromPhone: encryptPhoneNumber(fromNumber),
          toPhone: encryptPhoneNumber(toNumber),
          virtualNumber,
          direction,
          status: 'INITIATED',
          metadata: {
            correlationToken,
            correlationExpiresAt,
            mode: appletUrl ? 'CCM_APPLET' : 'DIRECT_CONNECT',
            appId: ccmAppId || null,
            patientId: parties.patientId,
            hospitalId: parties.hospitalId,
          },
        },
      });
    }

    // 8. Build Webhook Event URL with authentication token
    let callbackBaseUrl = 'https://mediquee.in/api/v1/exotel/events';
    if (env.EXOTEL_STATUS_CALLBACK_URL) {
      callbackBaseUrl = env.EXOTEL_STATUS_CALLBACK_URL.replace(/\/+$/, '');
    } else if (process.env.API_BASE_URL) {
      callbackBaseUrl = `${process.env.API_BASE_URL.replace(/\/+$/, '')}/api/v1/exotel/events`;
    } else if (env.CORS_ORIGIN) {
      // Guard against comma-separated origins or localhost in webhook URLs
      const firstOrigin = env.CORS_ORIGIN.split(',')[0].trim().replace(/\/+$/, '');
      if (firstOrigin.startsWith('https://') && !firstOrigin.includes('localhost')) {
        callbackBaseUrl = `${firstOrigin}/api/v1/exotel/events`;
      }
    }
    const callbackUrl = `${callbackBaseUrl}?token=${encodeURIComponent(env.EXOTEL_WEBHOOK_SECRET || 'mediquee_exotel_webhook_secret_key')}`;

    // 9. Dispatch call to Exotel API
    const callPayload: ExotelCallParams = {
      from: fromNumber,
      callerId: virtualNumber,
      callType: 'trans',
      timeLimit: 1800, // 30 min duration cap
      timeOut: 35, // 35 second ring timeout
      statusCallback: callbackUrl,
      record: false, // Call recording strictly disabled by default
      customField: correlationToken, // Secure correlation token passed to Exotel
    };

    if (appletUrl) {
      callPayload.url = appletUrl;
    } else {
      // Graceful fallback to direct two-numbers connect when EXOTEL_APP_ID is pending
      callPayload.to = toNumber;
    }

    let exotelResponse;
    try {
      exotelResponse = await this.client.initiateCall(callPayload);
    } catch (apiError: any) {
      if (callLogRecord && ExotelCallService.callLogModel) {
        await ExotelCallService.callLogModel.update({
          where: { id: callLogRecord.id },
          data: {
            status: 'FAILED',
            failureReason: apiError.message || 'Exotel API dispatch failed',
          },
        });
      }
      throw apiError;
    }

    const callSid = exotelResponse.Call?.Sid;
    const initialStatus = exotelResponse.Call?.Status || 'queued';

    // 10. Update CallLog with Exotel CallSid
    if (callLogRecord && callSid && ExotelCallService.callLogModel) {
      await ExotelCallService.callLogModel.update({
        where: { id: callLogRecord.id },
        data: {
          callSid,
          status: 'QUEUED',
        },
      });
    }

    // 11. Return safe response without leaking raw personal phone numbers or internal correlation tokens
    return {
      success: true,
      callSid: callSid || '',
      callLogId: callLogRecord?.id || '',
      status: initialStatus,
      virtualNumber: '080-472-90980',
      direction,
      maskedFrom: maskPhoneNumber(fromNumber),
      maskedTo: maskPhoneNumber(toNumber),
      message: 'Call initiated. You will receive an incoming call from our secure line (080-472-90980). Please answer to connect.',
    };
  }

  /**
   * Pre-registers a Call Intent for Direct Inbound Masked Dialing.
   * When a patient or hospital staff taps "Call" on a specific booking,
   * an AWAITING_INBOUND record is logged so that when their phone dials
   * virtual number 08047290980, Exotel seamlessly routes to the target party.
   */
  public async registerCallIntent(params: {
    bookingId: string;
    bookingType?: ServiceBookingType;
    direction?: 'PATIENT_TO_HOSPITAL' | 'HOSPITAL_TO_PATIENT';
    userId: string;
    userRole: string;
    userHospitalId?: string | null;
  }) {
    const bookingType = params.bookingType || 'OP';
    const direction: 'PATIENT_TO_HOSPITAL' | 'HOSPITAL_TO_PATIENT' =
      params.userRole === 'PATIENT' ? 'PATIENT_TO_HOSPITAL' : 'HOSPITAL_TO_PATIENT';

    const parties = await this.resolveBookingParties(
      params.bookingId,
      bookingType,
      params.userId,
      params.userRole,
      params.userHospitalId
    );

    let fromNumber = '';
    let toNumber = '';

    if (direction === 'PATIENT_TO_HOSPITAL') {
      fromNumber = parties.patientPhone;
      toNumber = parties.hospitalPhone;
    } else {
      const staffUser = await prisma.user.findUnique({
        where: { id: params.userId },
        select: { phone: true },
      });
      fromNumber = staffUser?.phone || parties.hospitalPhone;
      toNumber = parties.patientPhone;
    }

    const callerDigits = fromNumber.replace(/\D/g, '').slice(-10);
    const virtualNumber = this.client.normalizeCallerId(env.EXOTEL_CALLER_ID || '08047290980');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    let intentRecord: any = null;
    if (ExotelCallService.callLogModel) {
      intentRecord = await ExotelCallService.callLogModel.create({
        data: {
          bookingId: params.bookingId,
          bookingType,
          initiatedById: params.userId,
          callerRole: params.userRole as Role,
          fromPhone: encryptPhoneNumber(fromNumber),
          toPhone: encryptPhoneNumber(toNumber),
          virtualNumber,
          direction,
          status: 'INITIATED',
          metadata: {
            mode: 'INBOUND_INTENT',
            callerDigits,
            expiresAt,
            patientId: parties.patientId,
            hospitalId: parties.hospitalId,
          },
        },
      });
    }

    return {
      success: true,
      intentId: intentRecord?.id || '',
      virtualNumber: '080-472-90980',
      dialNumber: virtualNumber,
      direction,
      maskedTarget: maskPhoneNumber(toNumber),
      expiresInSeconds: 900,
    };
  }

  private isValidWebhookToken(tokenParam?: string): boolean {
    const expectedToken = env.EXOTEL_WEBHOOK_SECRET || 'mediquee_exotel_webhook_secret_key';
    return (
      typeof tokenParam === 'string' &&
      tokenParam.length === expectedToken.length &&
      crypto.timingSafeEqual(Buffer.from(tokenParam), Buffer.from(expectedToken))
    );
  }

  private extractCallerInfo(queryParams: ExotelCcmQueryParams): { callerRaw: string; callerDigits: string } {
    const callerRaw = String(
      (queryParams as any).CallFrom ||
        queryParams.From ||
        (queryParams as any).from ||
        (queryParams as any).caller ||
        (queryParams as any).Caller ||
        ''
    );
    const callerDigits = callerRaw.replace(/\D/g, '').slice(-10);
    return { callerRaw, callerDigits };
  }

  private buildConnectResponse(
    destinationPhone: string,
    rawVirtualNumber?: string
  ): {
    normalizedDestination: string;
    payload: ExotelCcmConnectResponse;
  } {
    const normalizedDestination = this.client.normalizePhoneNumber(destinationPhone);
    const outgoingPhoneNumber = this.client.normalizePhoneNumber(
      rawVirtualNumber || env.EXOTEL_CALLER_ID || '08047290980'
    );
    const appBaseUrl = (
      process.env.APP_BASE_URL ||
      process.env.API_BASE_URL ||
      'https://mediquee.in'
    ).replace(/\/+$/, '');
    const eventSecret = env.EXOTEL_WEBHOOK_SECRET || 'mediquee_exotel_webhook_secret_key';
    const dialPassthruEventUrl = `${appBaseUrl}/api/v1/exotel/events?token=${encodeURIComponent(eventSecret)}`;

    const payload: ExotelCcmConnectResponse = {
      fetch_after_attempt: false,
      destination: {
        numbers: [normalizedDestination],
      },
      outgoing_phone_number: outgoingPhoneNumber,
      record: false,
      recording_channels: 'single',
      max_ringing_duration: 30,
      max_conversation_duration: 900,
      dial_passthru_event_url: dialPassthruEventUrl,
    };

    return { normalizedDestination, payload };
  }

  /**
   * CCM Primary URL Handler (GET /api/v1/exotel/connect)
   *
   * SLA Requirement: Exotel expects an HTTP 200 response with Content-Type: application/json
   * within 5 seconds. This handler processes within <100ms.
   *
   * Dynamic Routing Flow:
   * 1. Validates webhook secret token (?token=...).
   * 2. Correlates by CallSid, CustomField, or Caller phone number (CallFrom / From).
   * 3. For Inbound Calls to 08047290980:
   *    - Checks pre-registered Intent in CallLog.
   *    - Falls back to database lookup of caller's active OP booking.
   * 4. Resolves destination phone number from verified database records.
   * 5. Returns documented Exotel Connect Applet (Dynamic URL) JSON payload.
   */
  public async handleCcmConnect(
    queryParams: ExotelCcmQueryParams,
    tokenParam?: string
  ): Promise<{
    httpStatus: number;
    destinationPhone?: string;
    payload: ExotelCcmConnectResponse | { error: string };
  }> {
    // 1. Timing-safe webhook authentication
    if (!this.isValidWebhookToken(tokenParam)) {
      console.warn('[Exotel CCM] Unauthorized Connect attempt: Token mismatch');
      return { httpStatus: 403, payload: { error: 'Unauthorized webhook access' } };
    }

    const callSid = queryParams.CallSid || queryParams.Sid;
    const customToken = queryParams.CustomField;
    const { callerRaw, callerDigits } = this.extractCallerInfo(queryParams);

    if (!callSid && !customToken && !callerDigits) {
      return { httpStatus: 400, payload: { error: 'Missing CallSid, CustomField, and From parameters' } };
    }

    let callLog: any = null;

    // 2a. Correlate by existing CallSid
    if (callSid && ExotelCallService.callLogModel) {
      callLog = await ExotelCallService.callLogModel.findUnique({
        where: { callSid },
      });
    }

    // 2b. Correlate by CustomField token
    if (!callLog && customToken && ExotelCallService.callLogModel) {
      const candidateCalls = await ExotelCallService.callLogModel.findMany({
        where: {
          status: { in: ['INITIATED', 'QUEUED', 'RINGING'] },
          createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      callLog = candidateCalls.find(
        (c: any) => c.metadata && typeof c.metadata === 'object' && c.metadata.correlationToken === customToken
      );
    }

    // 2c. Correlate by pre-registered Inbound Intent matching caller's phone digits
    if (!callLog && callerDigits && ExotelCallService.callLogModel) {
      const candidateIntents = await ExotelCallService.callLogModel.findMany({
        where: {
          status: 'INITIATED',
          createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      callLog = candidateIntents.find((c: any) => {
        if (!c.metadata || typeof c.metadata !== 'object') return false;
        return c.metadata.callerDigits === callerDigits;
      });
    }

    let destinationPhone = '';

    // 3. If CallLog record was matched, decrypt destination phone
    if (callLog) {
      const terminalStatuses = ['COMPLETED', 'FAILED', 'BUSY', 'NO_ANSWER', 'CANCELED'];
      if (terminalStatuses.includes(callLog.status)) {
        console.warn(`[Exotel CCM] Call ${callLog.callSid || callSid} is already in terminal state: ${callLog.status}`);
        return { httpStatus: 410, payload: { error: 'Call session has already ended' } };
      }

      const metadata = (callLog.metadata || {}) as Record<string, any>;
      const expiry = metadata.expiresAt || metadata.correlationExpiresAt;
      if (expiry && new Date(expiry).getTime() < Date.now()) {
        console.warn(`[Exotel CCM] Correlation token expired for Call ${callLog.callSid || callSid}`);
        return { httpStatus: 410, payload: { error: 'Call intent has expired' } };
      }

      try {
        destinationPhone = decryptPhoneNumber(callLog.toPhone);
      } catch (err: any) {
        console.error('[Exotel CCM] Failed to decrypt toPhone:', err.message);
        return { httpStatus: 500, payload: { error: 'Failed to resolve destination phone number' } };
      }

      // Update CallLog with active CallSid and status
      if (ExotelCallService.callLogModel && callSid) {
        await ExotelCallService.callLogModel.update({
          where: { id: callLog.id },
          data: {
            callSid,
            status: 'IN_PROGRESS',
            metadata: {
              ...metadata,
              ccmConnectedAt: new Date().toISOString(),
              ccmCallSid: callSid,
            },
          },
        });
      }
    } else if (callerDigits) {
      // 4. Fallback Direct Inbound Resolution: Resolve caller's active booking
      console.log(`[Exotel CCM] Inbound dial from caller: ...${callerDigits}. Resolving active booking...`);

      // Check if Patient has an active booking
      const activeOp = await prisma.oPBooking.findFirst({
        where: {
          OR: [
            { patientPhone: { endsWith: callerDigits } },
            { patient: { phone: { endsWith: callerDigits } } },
          ],
          status: { not: 'CANCELLED' },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (activeOp && activeOp.hospitalId) {
        const hospital = await prisma.hospital.findUnique({
          where: { id: activeOp.hospitalId },
          select: { id: true, name: true, contactPhone: true, emergencyContact: true },
        });

        if (hospital) {
          destinationPhone = hospital.contactPhone || hospital.emergencyContact || '';
          console.log(`[Exotel CCM] Inbound patient matched to hospital: ${hospital.name}`);

          if (ExotelCallService.callLogModel) {
            await ExotelCallService.callLogModel.create({
              data: {
                callSid: callSid || undefined,
                bookingId: activeOp.id,
                bookingType: 'OP',
                initiatedById: activeOp.patientId || 'inbound-dialer',
                callerRole: 'PATIENT',
                fromPhone: encryptPhoneNumber(callerRaw || callerDigits),
                toPhone: encryptPhoneNumber(destinationPhone),
                virtualNumber: env.EXOTEL_CALLER_ID || '08047290980',
                direction: 'PATIENT_TO_HOSPITAL',
                status: 'IN_PROGRESS',
                metadata: {
                  mode: 'DIRECT_INBOUND',
                  patientName: activeOp.patientName,
                  hospitalName: hospital.name,
                },
              },
            });
          }
        }
      } else {
        // Check if Caller is Hospital Staff calling a patient
        const staffUser = await prisma.user.findFirst({
          where: {
            phone: { endsWith: callerDigits },
            hospitalId: { not: null },
            role: { in: ['HOSPITAL_ADMIN', 'DOCTOR', 'RECEPTIONIST', 'NURSE'] },
          },
        });

        if (staffUser && staffUser.hospitalId) {
          const recentOp = await prisma.oPBooking.findFirst({
            where: {
              hospitalId: staffUser.hospitalId,
              status: { not: 'CANCELLED' },
            },
            orderBy: { createdAt: 'desc' },
          });

          if (recentOp && recentOp.patientPhone) {
            destinationPhone = recentOp.patientPhone;
            console.log(`[Exotel CCM] Inbound staff matched to patient: ${recentOp.patientName}`);

            if (ExotelCallService.callLogModel) {
              await ExotelCallService.callLogModel.create({
                data: {
                  callSid: callSid || undefined,
                  bookingId: recentOp.id,
                  bookingType: 'OP',
                  initiatedById: staffUser.id,
                  callerRole: staffUser.role as Role,
                  fromPhone: encryptPhoneNumber(callerRaw || callerDigits),
                  toPhone: encryptPhoneNumber(destinationPhone),
                  virtualNumber: env.EXOTEL_CALLER_ID || '08047290980',
                  direction: 'HOSPITAL_TO_PATIENT',
                  status: 'IN_PROGRESS',
                  metadata: {
                    mode: 'DIRECT_INBOUND_STAFF',
                    staffName: staffUser.name,
                    patientName: recentOp.patientName,
                  },
                },
              });
            }
          }
        }
      }
    }

    // 5. Default Fallback: If destination could not be identified for an inbound caller, route to primary active hospital reception
    if (!destinationPhone.trim() && callerDigits) {
      const defaultHospital = await prisma.hospital.findFirst({
        where: {
          OR: [
            { contactPhone: { not: '' } },
            { emergencyContact: { not: '' } },
          ],
        },
        orderBy: { createdAt: 'asc' },
        select: { id: true, name: true, contactPhone: true, emergencyContact: true },
      });

      if (defaultHospital && (defaultHospital.contactPhone || defaultHospital.emergencyContact)) {
        destinationPhone = defaultHospital.contactPhone || defaultHospital.emergencyContact || '';
        console.log(`[Exotel CCM] Unmapped inbound dialer routed to hospital desk: ${defaultHospital.name}`);

        if (ExotelCallService.callLogModel && callSid) {
          await ExotelCallService.callLogModel
            .create({
              data: {
                callSid,
                bookingType: 'OP',
                initiatedById: 'inbound-dialer',
                callerRole: 'PATIENT',
                fromPhone: encryptPhoneNumber(callerRaw || callerDigits || 'unknown'),
                toPhone: encryptPhoneNumber(destinationPhone),
                virtualNumber: env.EXOTEL_CALLER_ID || '08047290980',
                direction: 'PATIENT_TO_HOSPITAL',
                status: 'IN_PROGRESS',
                metadata: {
                  mode: 'DEFAULT_HOSPITAL_FALLBACK',
                  hospitalId: defaultHospital.id,
                  hospitalName: defaultHospital.name,
                },
              },
            })
            .catch(() => {});
        }
      }
    }

    if (!destinationPhone.trim()) {
      console.warn(`[Exotel CCM] Destination phone could not be resolved for CallSid: ${callSid}, From: ${callerDigits}`);
      return { httpStatus: 404, payload: { error: 'Destination phone number not found for this call' } };
    }

    const { normalizedDestination, payload } = this.buildConnectResponse(destinationPhone);

    return {
      httpStatus: 200,
      destinationPhone: normalizedDestination,
      payload,
    };
  }

  /**
   * CCM Fallback URL Handler (GET /api/v1/exotel/fallback)
   */
  public async handleCcmFallback(
    queryParams: ExotelCcmQueryParams,
    tokenParam?: string
  ): Promise<{
    httpStatus: number;
    destinationPhone?: string;
    payload: ExotelCcmConnectResponse | { error: string };
  }> {
    // 1. Timing-safe webhook authentication
    if (!this.isValidWebhookToken(tokenParam)) {
      console.warn('[Exotel CCM Fallback] Unauthorized Fallback attempt');
      return { httpStatus: 403, payload: { error: 'Unauthorized webhook access' } };
    }

    const callSid = queryParams.CallSid || queryParams.Sid;
    const customToken = queryParams.CustomField;
    const { callerDigits } = this.extractCallerInfo(queryParams);

    if (!ExotelCallService.callLogModel) {
      return { httpStatus: 500, payload: { error: 'CallLog model not available' } };
    }

    // Locate call log
    let callLog: any = null;
    if (callSid) {
      callLog = await ExotelCallService.callLogModel.findUnique({
        where: { callSid },
      });
    }

    if (!callLog && customToken) {
      const candidates = await ExotelCallService.callLogModel.findMany({
        where: {
          createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });
      callLog = candidates.find(
        (c: any) => c.metadata && typeof c.metadata === 'object' && c.metadata.correlationToken === customToken
      );
    }

    if (!callLog && callerDigits) {
      const candidates = await ExotelCallService.callLogModel.findMany({
        where: {
          createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });
      callLog = candidates.find(
        (c: any) => c.metadata && typeof c.metadata === 'object' && c.metadata.callerDigits === callerDigits
      );
    }

    // Resolve verified hospital destination and record failover telemetry
    let destinationPhone = '';
    if (callLog) {
      const metadata = (callLog.metadata || {}) as Record<string, any>;
      await ExotelCallService.callLogModel
        .update({
          where: { id: callLog.id },
          data: {
            metadata: {
              ...metadata,
              fallbackTriggered: true,
              fallbackAt: new Date().toISOString(),
              fallbackReason: String(queryParams.Reason || 'Primary URL timeout or failover'),
            },
          },
        })
        .catch(() => {});

      try {
        destinationPhone = decryptPhoneNumber(callLog.toPhone);
      } catch {
        destinationPhone = '';
      }
    }

    if (!destinationPhone.trim()) {
      const defaultHospital = await prisma.hospital.findFirst({
        where: {
          OR: [
            { contactPhone: { not: '' } },
            { emergencyContact: { not: '' } },
          ],
        },
        orderBy: { createdAt: 'asc' },
        select: { name: true, contactPhone: true, emergencyContact: true },
      });

      if (defaultHospital && (defaultHospital.contactPhone || defaultHospital.emergencyContact)) {
        destinationPhone = defaultHospital.contactPhone || defaultHospital.emergencyContact || '';
      }
    }

    if (!destinationPhone.trim()) {
      return { httpStatus: 500, payload: { error: 'Unable to resolve destination in fallback' } };
    }

    const { normalizedDestination, payload } = this.buildConnectResponse(
      destinationPhone,
      callLog?.virtualNumber
    );

    return {
      httpStatus: 200,
      destinationPhone: normalizedDestination,
      payload,
    };
  }

  /**
   * Handle incoming Exotel StatusCallback / dial_passthru_event_url webhook with idempotency & timing-safe token verification.
   */
  public async handleWebhook(payload: ExotelWebhookPayload, tokenQuery?: string) {
    // 1. Timing-safe Webhook Authentication
    if (!this.isValidWebhookToken(tokenQuery)) {
      console.warn('[Exotel Webhook] Unauthorized webhook attempt: Token mismatch');
      return { status: 403, message: 'Invalid webhook authentication token' };
    }

    const callSid = payload.CallSid || payload.Sid;
    if (!callSid) {
      return { status: 400, message: 'Missing CallSid in webhook payload' };
    }

    if (!ExotelCallService.callLogModel) {
      return { status: 200, message: 'CallLog model not active yet' };
    }

    // 2. Lookup call record
    let callLog = await ExotelCallService.callLogModel.findUnique({
      where: { callSid },
    });

    if (!callLog && payload.CustomField) {
      const candidates = await ExotelCallService.callLogModel.findMany({
        where: {
          createdAt: { gte: new Date(Date.now() - 30 * 60 * 1000) },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });
      callLog = candidates.find(
        (c: any) =>
          c.id === payload.CustomField ||
          (c.metadata && typeof c.metadata === 'object' && c.metadata.correlationToken === payload.CustomField)
      );
    }

    if (!callLog) {
      console.warn(`[Exotel Webhook] No matching CallLog found for CallSid: ${callSid}`);
      return { status: 200, message: 'CallLog record not found, ignored' };
    }

    // 3. Monotonic State Transition / Idempotency Check
    const terminalStatuses = ['COMPLETED', 'FAILED', 'BUSY', 'NO_ANSWER', 'CANCELED'];
    if (terminalStatuses.includes(callLog.status)) {
      console.log(`[Exotel Webhook] Duplicate webhook for terminal call ${callSid}. Preserving terminal state.`);
      return { status: 200, message: 'Event already processed' };
    }

    // 4. Map Exotel DialCallStatus / Status / EventType to CallStatus enum
    const rawStatus = String(payload.DialCallStatus || payload.Status || payload.EventType || '').toLowerCase();
    let mappedStatus = 'IN_PROGRESS';
    if (rawStatus === 'completed' || rawStatus === 'terminal') {
      mappedStatus = 'COMPLETED';
    } else if (rawStatus === 'busy') {
      mappedStatus = 'BUSY';
    } else if (rawStatus === 'no-answer' || rawStatus === 'no_answer') {
      mappedStatus = 'NO_ANSWER';
    } else if (rawStatus === 'failed') {
      mappedStatus = 'FAILED';
    } else if (rawStatus === 'canceled' || rawStatus === 'cancelled') {
      mappedStatus = 'CANCELED';
    } else if (rawStatus === 'in-progress' || rawStatus === 'in_progress' || rawStatus === 'answered') {
      mappedStatus = 'IN_PROGRESS';
    } else if (rawStatus === 'ringing') {
      mappedStatus = 'RINGING';
    } else if (rawStatus === 'dial') {
      mappedStatus = 'INITIATED';
    }

    // Extract duration (in seconds)
    const durationRaw = payload.DialCallDuration || payload.ConversationDuration || payload.Duration;
    const duration = durationRaw !== undefined ? parseInt(String(durationRaw), 10) : undefined;

    // Extract failure or disconnect reason
    let failureReason = payload.DisconnectedBy ? `Disconnected by ${payload.DisconnectedBy}` : undefined;
    if (mappedStatus === 'NO_ANSWER') {
      failureReason = failureReason || 'Callee did not answer (Timed out)';
    } else if (mappedStatus === 'BUSY') {
      failureReason = failureReason || 'Line was busy';
    }

    // 5. Update CallLog
    await ExotelCallService.callLogModel.update({
      where: { id: callLog.id },
      data: {
        callSid: callLog.callSid || callSid,
        status: mappedStatus,
        duration: isNaN(Number(duration)) ? null : duration,
        recordingUrl: payload.RecordingUrl || null,
        price: payload.Price ? String(payload.Price) : null,
        failureReason: failureReason || null,
      },
    });

    console.log(`[Exotel Webhook] Synchronized CallSid ${callSid} to status ${mappedStatus}`);
    return { status: 200, message: 'Status updated successfully' };
  }

  /**
   * Alias for CCM Call Event processing
   */
  public async handleCcmEvents(payload: ExotelWebhookPayload, tokenQuery?: string) {
    return this.handleWebhook(payload, tokenQuery);
  }


  /**
   * Retrieve safe status of a specific call by CallSid with strict facility authorization
   */
  public async getCallStatus(
    callSid: string,
    userId: string,
    userRole: string,
    userHospitalId?: string | null
  ) {
    if (!ExotelCallService.callLogModel) {
      throw new Error('Call records are not initialized');
    }

    const callLog = await ExotelCallService.callLogModel.findUnique({
      where: { callSid },
    });

    if (!callLog) {
      throw new Error('Call record not found');
    }

    // Strict Authorization check:
    // 1. Super Admin has universal access
    // 2. The initiator (e.g. the patient or doctor who clicked call) has access
    // 3. Hospital staff can ONLY access if the call belongs to their specific hospital facility
    const isSuperAdmin = userRole === 'SUPER_ADMIN';
    const isInitiator = callLog.initiatedById === userId;

    if (!isSuperAdmin && !isInitiator) {
      if (!userHospitalId || !callLog.bookingId) {
        throw new Error('Unauthorized to view this call session');
      }

      // Verify that this call's booking belongs to the requester's hospital
      const booking = await this.resolveBookingParties(
        callLog.bookingId,
        callLog.bookingType as ServiceBookingType,
        userId,
        userRole,
        userHospitalId
      ).catch(() => null);

      if (!booking || booking.hospitalId !== userHospitalId) {
        throw new Error('Unauthorized: This call session belongs to another hospital facility');
      }
    }

    return {
      callSid: callLog.callSid,
      bookingId: callLog.bookingId,
      bookingType: callLog.bookingType,
      status: callLog.status,
      duration: callLog.duration,
      virtualNumber: callLog.virtualNumber,
      direction: callLog.direction,
      failureReason: callLog.failureReason,
      createdAt: callLog.createdAt,
      updatedAt: callLog.updatedAt,
    };
  }

  /**
   * Retrieve call history for a booking with phone number masking
   */
  public async getBookingCalls(
    bookingId: string,
    userId: string,
    userRole: string,
    userHospitalId?: string | null
  ) {
    if (!ExotelCallService.callLogModel) {
      return [];
    }

    // Authorize booking access across any of the 5 service types
    let authorized = false;
    const serviceTypes: ServiceBookingType[] = ['OP', 'VIDEO', 'NURSING', 'LAB_WALK_IN', 'HOME_SAMPLE'];
    for (const sType of serviceTypes) {
      try {
        await this.resolveBookingParties(bookingId, sType, userId, userRole, userHospitalId);
        authorized = true;
        break;
      } catch {
        continue;
      }
    }

    if (!authorized && userRole !== 'SUPER_ADMIN') {
      throw new Error('Unauthorized to view call history for this booking');
    }

    const calls = await ExotelCallService.callLogModel.findMany({
      where: { bookingId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return calls.map((c: any) => ({
      id: c.id,
      callSid: c.callSid,
      direction: c.direction,
      status: c.status,
      duration: c.duration,
      virtualNumber: c.virtualNumber,
      failureReason: c.failureReason,
      createdAt: c.createdAt,
    }));
  }
}
