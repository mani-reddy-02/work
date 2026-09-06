import { Request, Response, NextFunction } from 'express';
import { z, ZodObject, ZodError } from 'zod';

export const validateRequest = (schema: ZodObject<any, any>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error instanceof ZodError ? error.errors : error
        }
      });
      }
      next(error);
    }
  };
};
