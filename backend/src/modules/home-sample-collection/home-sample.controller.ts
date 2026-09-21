import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/prisma';

export const getHomeSampleRequests = async (req: Request, res: Response, next: NextFunction) => {
  res.status(501).json({ success: false, message: 'Not Implemented' });
};

export const updateHomeSampleStatus = async (req: Request, res: Response, next: NextFunction) => {
  res.status(501).json({ success: false, message: 'Not Implemented' });
};

export const assignPhlebotomist = async (req: Request, res: Response, next: NextFunction) => {
  res.status(501).json({ success: false, message: 'Not Implemented' });
};
