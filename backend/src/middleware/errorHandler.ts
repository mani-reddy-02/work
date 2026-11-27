import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) {
    return next(err);
  }

  const isProd = process.env.NODE_ENV === 'production';
  if (isProd) {
    console.error('[Error]:', { code: err?.code, statusCode: err?.statusCode || 500, message: err?.message });
  } else {
    console.error('[Error]:', err);
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        details: isProd ? undefined : (err as any).errors,
      },
    });
  }

  // Handle unique constraint violations from Prisma
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      error: {
        code: 'CONFLICT_ERROR',
        message: 'A record with this data already exists.',
      },
    });
  }

  // Handle database connection unreachable or timeout errors from Prisma
  if (
    err.code === 'P1001' ||
    err.message?.includes("Can't reach database server") ||
    err.message?.includes("Connection terminated") ||
    err.message?.includes("connection timeout") ||
    err.message?.includes("timeout")
  ) {
    return res.status(503).json({
      success: false,
      error: {
        code: 'DATABASE_UNAVAILABLE',
        message: 'Database server is temporarily busy or unreachable. Please try again in a few moments.',
      },
    });
  }

  const statusCode = typeof err.statusCode === 'number' && err.statusCode >= 400 && err.statusCode < 600
    ? err.statusCode
    : 500;
  const message = isProd && statusCode >= 500
    ? 'Internal Server Error'
    : (err.message || 'Internal Server Error');

  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message,
    },
  });
};
