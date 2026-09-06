import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Error]:', err);

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        details: err.errors,
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

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production' && statusCode === 500 ? 'Internal Server Error' : message,
    },
  });
};
