import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validate';
import {
  createMarketingRequest,
  createCampRequest,
  getMyRequests,
} from './hospital-requests.controller';
import {
  createMarketingRequestSchema,
  createCampRequestSchema,
} from './hospital-requests.schema';

const router = Router();

// Protect all routes with authentication and role restrictions
router.use(authenticate);
router.use(requireRole(['HOSPITAL_ADMIN', 'SUPER_ADMIN']));

// POST /api/v1/hospital/marketing-requests
router.post(
  '/marketing-requests',
  validateRequest(createMarketingRequestSchema as any),
  createMarketingRequest
);

// POST /api/v1/hospital/camp-requests
router.post(
  '/camp-requests',
  validateRequest(createCampRequestSchema as any),
  createCampRequest
);

// GET /api/v1/hospital/requests
router.get('/requests', getMyRequests);

export default router;
