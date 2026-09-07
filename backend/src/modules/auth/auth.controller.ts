import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const identifier = req.body.identifier || req.body.email || req.body.phone;
    const { password, role } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Identifier and password are required' },
      });
    }

    const result = await AuthService.login(identifier, password, role);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    if (
      error.message === 'Invalid credentials' ||
      error.message === 'Role mismatch' ||
      error.message === 'Account is deactivated'
    ) {
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
        hospitalId: (result as any).hospital?.id || null,
        token: result.token,
        role: result.user.role,
        user: result.user,
      },
    });
  } catch (error: any) {
    if (error.message?.includes('already exists')) {
      res.status(409).json({
        success: false,
        error: { code: 'CONFLICT_ERROR', message: error.message },
      });
    } else {
      next(error);
    }
  }
};
