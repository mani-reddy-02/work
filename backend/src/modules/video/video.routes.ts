import { Router } from 'express';
import { VideoController } from './video.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

// Public configuration status
router.get('/status', VideoController.getConfigurationStatus);

// LiveKit Webhook Endpoint (verified via HMAC signature)
router.post('/webhook', VideoController.handleWebhook);

// Protected video consultation endpoints
router.post('/token', authenticate, VideoController.generateToken);
router.get('/status/:bookingId', authenticate, VideoController.getStatus);
router.post('/end/:bookingId', authenticate, VideoController.endCall);
router.get('/history', authenticate, VideoController.getHistory);

export default router;
