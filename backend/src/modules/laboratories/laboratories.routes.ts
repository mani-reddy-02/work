import { Router } from 'express';
import { 
  getLaboratories, 
  getLaboratoryById, 
  getLaboratoryTests, 
  createHospitalLab, 
  uploadLicenseCertificate,
  getLaboratoryAvailability,
  updateLaboratoryAvailability,
  getMyLaboratoryAvailability,
  updateMyLaboratoryAvailability
} from './laboratories.controller';
import { authenticate, optionalAuthenticate } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validate';
import { createHospitalLabSchema } from './laboratories.schema';

const router = Router();

// Protected hospital lab routes
router.post('/upload-license', optionalAuthenticate, uploadLicenseCertificate);
router.post('/', authenticate, validateRequest(createHospitalLabSchema), createHospitalLab);
router.get('/me/availability', authenticate, getMyLaboratoryAvailability);
router.put('/me/availability', authenticate, updateMyLaboratoryAvailability);

// Public discovery routes
router.get('/', getLaboratories);
router.get('/:id', getLaboratoryById);
router.get('/:id/tests', getLaboratoryTests);
router.get('/:id/availability', getLaboratoryAvailability);

router.put('/:id/availability', authenticate, updateLaboratoryAvailability);

export default router;
