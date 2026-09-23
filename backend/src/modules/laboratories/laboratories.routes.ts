import { Router } from 'express';
import { 
  getLaboratories, 
  getLaboratoryById, 
  getLaboratoryTests, 
  createHospitalLab, 
  uploadLicenseCertificate 
} from './laboratories.controller';
import { authenticate, optionalAuthenticate } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validate';
import { createHospitalLabSchema } from './laboratories.schema';

const router = Router();

// Public discovery routes
router.get('/', getLaboratories);
router.get('/:id', getLaboratoryById);
router.get('/:id/tests', getLaboratoryTests);

// Protected hospital lab routes
router.post('/upload-license', optionalAuthenticate, uploadLicenseCertificate);
router.post('/', authenticate, validateRequest(createHospitalLabSchema), createHospitalLab);

export default router;
