import { Request, Response } from 'express';
import { ExotelCallService } from './exotel.service';
import { ExotelClient } from './exotel.client';

const callService = new ExotelCallService();

/**
 * Initiates an authenticated Click-to-Call connection.
 * Resolves verified phone numbers from database records.
 */
export async function initiateCallHandler(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const userHospitalId = req.user?.hospitalId;

    if (!userId || !userRole) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    const { bookingId, bookingType, direction } = req.body;

    const result = await callService.initiateCall({
      bookingId,
      bookingType,
      direction,
      userId,
      userRole,
      userHospitalId,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    const isClientError =
      error.message.includes('not found') ||
      error.message.includes('Unauthorized') ||
      error.message.includes('not available') ||
      error.message.includes('already in progress') ||
      error.message.includes('not configured');

    return res.status(isClientError ? 400 : 500).json({
      success: false,
      error: {
        code: isClientError ? 'CALL_REQUEST_REJECTED' : 'CALL_INITIATION_ERROR',
        message: error.message || 'Failed to initiate call',
      },
    });
  }
}

/**
 * Pre-registers a Call Intent for Direct Inbound Masked Dialing (e.g. tel:08047290980).
 */
export async function registerIntentHandler(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const userHospitalId = req.user?.hospitalId;

    if (!userId || !userRole) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    const { bookingId, bookingType, direction } = req.body;

    const result = await callService.registerCallIntent({
      bookingId,
      bookingType,
      direction,
      userId,
      userRole,
      userHospitalId,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INTENT_REGISTRATION_FAILED',
        message: error.message || 'Failed to register call intent',
      },
    });
  }
}

/**
 * Retrieve status of a call session by CallSid
 */
export async function getCallStatusHandler(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const userHospitalId = req.user?.hospitalId;

    if (!userId || !userRole) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    const callSid = String(req.params.callSid);
    const result = await callService.getCallStatus(callSid, userId, userRole, userHospitalId);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    const status = error.message.includes('not found') ? 404 : 403;
    return res.status(status).json({
      success: false,
      error: { code: 'CALL_STATUS_ERROR', message: error.message || 'Failed to get call status' },
    });
  }
}

/**
 * Retrieve call session history for a booking
 */
export async function getBookingCallsHandler(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const userHospitalId = req.user?.hospitalId;

    if (!userId || !userRole) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    const bookingId = String(req.params.bookingId);
    const calls = await callService.getBookingCalls(bookingId, userId, userRole, userHospitalId);

    return res.status(200).json({
      success: true,
      data: calls,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      error: { code: 'CALL_HISTORY_ERROR', message: error.message || 'Failed to retrieve call history' },
    });
  }
}

/**
 * Exotel Webhook Handler for call status updates (StatusCallback & Passthru).
 * Performs token authentication and idempotent status updates.
 */
export async function webhookHandler(req: Request, res: Response) {
  try {
    const authHeader = req.headers['authorization'] as string;
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : undefined;
    const token =
      (req.headers['x-exotel-token'] as string) ||
      bearerToken ||
      (req.query.token as string);
    const payload = req.body || {};

    const outcome = await callService.handleWebhook(payload, token);
    return res.status(outcome.status).json({ message: outcome.message });
  } catch (err: any) {
    console.error('[Exotel Webhook Error]:', err.message);
    // Return 200 with error log to avoid Exotel retry storms
    return res.status(200).json({ message: 'Error processed internally' });
  }
}

/**
 * Pre-flight verification of API Region Host (no live calls placed)
 */
export async function verifyHostHandler(req: Request, res: Response) {
  try {
    const subdomain = (req.query.subdomain as string) || undefined;
    const verification = await ExotelClient.verifyApiHost(subdomain);

    return res.status(200).json({
      success: true,
      data: verification,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'HOST_VERIFICATION_FAILED', message: err.message },
    });
  }
}

/**
 * Safe configuration status check (zero credentials leaked)
 */
export async function getConfigStatusHandler(_req: Request, res: Response) {
  return res.status(200).json({
    success: true,
    data: ExotelClient.getStatus(),
  });
}

/**
 * CCM Primary URL Handler (GET/POST /api/v1/exotel/connect)
 * Accepts Exotel requests, correlates call session, resolves destination,
 * and responds within 5 seconds (<100ms actual).
 *
 * NOTE FOR EXOTEL FLOW BUILDER CONNECT APPLET:
 * By default, Exotel's Connect Applet strictly expects Content-Type: text/plain
 * with ONLY the destination phone number in E.164 format (e.g. +919876543210).
 * If the client specifies Accept: application/json or ?format=json, it returns full JSON.
 */
export async function ccmConnectHandler(req: Request, res: Response) {
  try {
    const authHeader = req.headers['authorization'] as string;
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : undefined;
    const token =
      (req.headers['x-exotel-token'] as string) ||
      bearerToken ||
      (req.query.token as string) ||
      (req.body?.token as string);

    const mergedParams = { ...(req.query || {}), ...(req.body || {}) };
    console.log('[Exotel Connect Request] Query/Body:', JSON.stringify(mergedParams));

    const outcome = await callService.handleCcmConnect(mergedParams, token);

    // If client explicitly requested JSON (via Accept header or ?format=json)
    const acceptsJson = req.headers['accept']?.includes('application/json') || req.query.format === 'json';

    if (acceptsJson) {
      return res.status(outcome.httpStatus).type('application/json').json(outcome.payload);
    }

    // Default for Exotel Flow Builder Connect Applet:
    // Exotel requires Content-Type: text/plain with ONLY the destination phone number (e.g. +919876543210)
    if (outcome.httpStatus === 200 && outcome.destinationPhone) {
      console.log(`[Exotel Connect Success] Returning text/plain destination: ${outcome.destinationPhone}`);
      return res.status(200).type('text/plain').send(outcome.destinationPhone);
    }

    if (outcome.httpStatus !== 200) {
      const errorMsg = (outcome.payload as any)?.error || 'Unable to resolve destination';
      console.warn(`[Exotel Connect Failed] Status: ${outcome.httpStatus}, Error: ${errorMsg}`);
      return res.status(outcome.httpStatus).type('text/plain').send(errorMsg);
    }

    return res.status(200).type('text/plain').send(outcome.destinationPhone || '');
  } catch (err: any) {
    console.error('[Exotel CCM Connect Error]:', err.message);
    return res.status(500).type('text/plain').send('');
  }
}

/**
 * CCM Fallback URL Handler (GET/POST /api/v1/exotel/fallback)
 * Accepts Exotel failover requests, logs failover, and returns safe verified destination.
 */
export async function ccmFallbackHandler(req: Request, res: Response) {
  try {
    const authHeader = req.headers['authorization'] as string;
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : undefined;
    const token =
      (req.headers['x-exotel-token'] as string) ||
      bearerToken ||
      (req.query.token as string) ||
      (req.body?.token as string);

    const mergedParams = { ...(req.query || {}), ...(req.body || {}) };
    console.log('[Exotel Fallback Request] Query/Body:', JSON.stringify(mergedParams));

    const outcome = await callService.handleCcmFallback(mergedParams, token);

    const acceptsJson = req.headers['accept']?.includes('application/json') || req.query.format === 'json';

    if (acceptsJson) {
      return res.status(outcome.httpStatus).type('application/json').json(outcome.payload);
    }

    if (outcome.httpStatus === 200 && outcome.destinationPhone) {
      console.log(`[Exotel Fallback Success] Returning text/plain destination: ${outcome.destinationPhone}`);
      return res.status(200).type('text/plain').send(outcome.destinationPhone);
    }

    if (outcome.httpStatus !== 200) {
      const errorMsg = (outcome.payload as any)?.error || 'Unable to resolve destination';
      console.warn(`[Exotel Fallback Failed] Status: ${outcome.httpStatus}, Error: ${errorMsg}`);
      return res.status(outcome.httpStatus).type('text/plain').send(errorMsg);
    }

    return res.status(200).type('text/plain').send(outcome.destinationPhone || '');
  } catch (err: any) {
    console.error('[Exotel CCM Fallback Error]:', err.message);
    return res.status(500).type('text/plain').send('');
  }
}

/**
 * CCM Call Events Webhook Handler (POST /api/v1/exotel/events)
 * Handles dial, ringing, answered, completed, terminal events with idempotency.
 */
export async function ccmEventsHandler(req: Request, res: Response) {
  try {
    const authHeader = req.headers['authorization'] as string;
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : undefined;
    const token =
      (req.headers['x-exotel-token'] as string) ||
      bearerToken ||
      (req.query.token as string);
    const payload = req.body || {};

    const outcome = await callService.handleCcmEvents(payload, token);
    return res.status(outcome.status).json({ message: outcome.message });
  } catch (err: any) {
    console.error('[Exotel CCM Events Error]:', err.message);
    return res.status(200).json({ message: 'Error processed internally' });
  }
}

