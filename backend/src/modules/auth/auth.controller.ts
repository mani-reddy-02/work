import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const result = await AuthService.login(email, password);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    if (error.message === 'Invalid credentials') {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: error.message },
      });
    } else {
      next(error);
    }
  }
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await AuthService.register(req.body);

    res.status(201).json({
      success: true,
      data: {
        id: result.user.id,
        hospitalId: result.hospital.id,
        token: result.token,
        role: result.user.role,
      },
    });
  } catch (error: any) {
    if (error.message.includes('already exists')) {
      res.status(409).json({
        success: false,
        error: { code: 'CONFLICT_ERROR', message: error.message },
      });
    } else {
      next(error);
    }
  }
};
