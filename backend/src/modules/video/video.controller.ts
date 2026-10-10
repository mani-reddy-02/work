import { Request, Response, NextFunction } from 'express';
import { VideoService } from './video.service';
import { z } from 'zod';
import { env } from '../../config/env';

const tokenSchema = z.object({
  bookingId: z.string().uuid({ message: 'Valid booking ID is required' }),
});

export class VideoController {
  /**
   * Health / Configuration status of LiveKit video consultation service
   */
  public static async getConfigurationStatus(req: Request, res: Response): Promise<void> {
    const config = VideoService.validateConfig();
    res.json({
      success: true,
      data: {
        isConfigured: config.isConfigured,
        serverUrl: config.isConfigured && env.LIVEKIT_URL ? env.LIVEKIT_URL : null,
        message: config.isConfigured
          ? 'LiveKit Cloud video consultation service is active and ready.'
          : config.error,
      },
    });
  }

  /**
   * Generate LiveKit room token for an eligible OP appointment
   */
  public static async generateToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = tokenSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: parsed.error.issues[0]?.message || 'Invalid booking ID',
          },
        });
        return;
      }

      const result = await VideoService.generateToken(
        parsed.data.bookingId,
        req.user!.id,
        req.user!.role
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      if (error.statusCode) {
        res.status(error.statusCode).json({
          success: false,
          error: {
            code: error.code || 'VIDEO_ERROR',
            message: error.message,
          },
        });
        return;
      }
      next(error);
    }
  }

  /**
   * Get current consultation status and elapsed duration
   */
  public static async getStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const bookingId = Array.isArray(req.params.bookingId) ? req.params.bookingId[0] : req.params.bookingId;
      if (!bookingId) {
        res.status(400).json({
          success: false,
          error: { code: 'BAD_REQUEST', message: 'Booking ID is required' },
        });
        return;
      }

      const result = await VideoService.getStatus(bookingId, req.user!.id, req.user!.role);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      if (error.statusCode) {
        res.status(error.statusCode).json({
          success: false,
          error: { code: error.code || 'VIDEO_ERROR', message: error.message },
        });
        return;
      }
      next(error);
    }
  }

  /**
   * End an active consultation room and save duration
   */
  public static async endCall(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const bookingId = Array.isArray(req.params.bookingId) ? req.params.bookingId[0] : req.params.bookingId;
      if (!bookingId) {
        res.status(400).json({
          success: false,
          error: { code: 'BAD_REQUEST', message: 'Booking ID is required' },
        });
        return;
      }

      const result = await VideoService.endConsultation(bookingId, req.user!.id, req.user!.role);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      if (error.statusCode) {
        res.status(error.statusCode).json({
          success: false,
          error: { code: error.code || 'VIDEO_ERROR', message: error.message },
        });
        return;
      }
      next(error);
    }
  }

  /**
   * Retrieve video consultation history for the logged in user
   */
  public static async getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const history = await VideoService.getHistory(req.user!.id, req.user!.role);
      res.status(200).json({
        success: true,
        data: history,
      });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Handle incoming LiveKit Cloud webhooks with signature verification
   */
  public static async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        res.status(401).json({
          success: false,
          error: { code: 'WEBHOOK_UNAUTHORIZED', message: 'Missing Authorization header' },
        });
        return;
      }

      const rawBody = (req as any).rawBody || (typeof req.body === 'string' ? req.body : JSON.stringify(req.body));
      const result = await VideoService.processWebhook(rawBody, authHeader);

      res.status(200).json({ success: true, ...result });
    } catch (error: any) {
      const status = error.statusCode || 400;
      res.status(status).json({
        success: false,
        error: {
          code: error.code || 'WEBHOOK_ERROR',
          message: error.message,
        },
      });
    }
  }
}
