import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate, requireRole } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validate';
import {
  initiateCallSchema,
  callStatusParamSchema,
  bookingCallHistoryParamSchema,
  verifyHostQuerySchema,
} from './exotel.schema';
import {
  initiateCallHandler,
  registerIntentHandler,
  getCallStatusHandler,
  getBookingCallsHandler,
  webhookHandler,
  verifyHostHandler,
  getConfigStatusHandler,
  ccmConnectHandler,
  ccmFallbackHandler,
  ccmEventsHandler,
} from './exotel.controller';

const router = Router();

// Anti-Toll-Fraud & Anti-Harassment Rate Limiter:
// Max 5 call connection requests per 10 minutes per IP
const callRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: 429,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many call attempts. Please wait a few minutes before initiating another call.',
    },
  },
});

/**
 * 1. Initiate Authenticated Click-to-Call (Supports both CCM and Direct Connect)
 * Requires valid JWT. Phone numbers resolved strictly server-side from booking records.
 */
router.post('/initiate', authenticate, callRateLimiter, validateRequest(initiateCallSchema), initiateCallHandler);
router.post('/calls/initiate', authenticate, callRateLimiter, validateRequest(initiateCallSchema), initiateCallHandler);

/**
 * Pre-register Call Intent for Direct Inbound Masked Dialing (e.g. tel:08047290980)
 */
router.post('/intent', authenticate, callRateLimiter, validateRequest(initiateCallSchema), registerIntentHandler);
router.post('/calls/intent', authenticate, callRateLimiter, validateRequest(initiateCallSchema), registerIntentHandler);

/**
 * 2. CCM Primary URL: Dynamic routing callback from Exotel Connect Applet
 * Expected response: text/plain with destination E.164 phone number (or JSON if requested)
 */
router.get('/connect', ccmConnectHandler);
router.post('/connect', ccmConnectHandler);

/**
 * 3. CCM Fallback URL: Failover callback if Primary URL fails or times out
 */
router.get('/fallback', ccmFallbackHandler);
router.post('/fallback', ccmFallbackHandler);

/**
 * 4. CCM Call Events Webhook Endpoint
 * Tracks dial, ringing, answered, completed, terminal events
 */
router.post('/events', ccmEventsHandler);
router.get('/events', ccmEventsHandler);

/**
 * 5. Retrieve Call Status by CallSid
 */
router.get('/status/:callSid', authenticate, validateRequest(callStatusParamSchema), getCallStatusHandler);

/**
 * 6. Retrieve Historical Call Sessions for a Booking
 */
router.get('/booking/:bookingId', authenticate, validateRequest(bookingCallHistoryParamSchema), getBookingCallsHandler);

/**
 * 7. Legacy Exotel Webhook Endpoint (Supports StatusCallback and Passthru Applet)
 * Public endpoint protected via secure token verification in query or header.
 */
router.post('/webhook', webhookHandler);
router.get('/webhook', webhookHandler);

/**
 * 8. Verify API Host connectivity without placing real calls
 * Restricted to Admins
 */
router.get('/verify-host', authenticate, requireRole(['SUPER_ADMIN', 'HOSPITAL_ADMIN']), validateRequest(verifyHostQuerySchema), verifyHostHandler);

/**
 * 9. Safe Configuration Health Check
 * Restricted to Admins (zero secrets exposed)
 */
router.get('/config-status', authenticate, requireRole(['SUPER_ADMIN', 'HOSPITAL_ADMIN']), getConfigStatusHandler);

export default router;

