import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import { getHospitalProfile, updateHospitalProfile } from './hospital-profile.controller';

const router = Router();

// Protect all profile operations with authentication and tenant role checks
router.use(authenticate);
router.use(requireRole(['HOSPITAL_ADMIN', 'SUPER_ADMIN']));

// GET /api/v1/hospital/profile - Read authoritative profile of logged-in hospital
router.get('/', getHospitalProfile);

// PUT /api/v1/hospital/profile - Update authoritative profile of logged-in hospital
router.put('/', updateHospitalProfile);

export default router;
