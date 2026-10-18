import { Router } from 'express';
import {
  getHospitalLabTests,
  addHospitalLabTestsBatch,
  updateHospitalLabTest,
  deleteHospitalLabTest,
  getHospitalLabPackages,
  createHospitalLabPackage,
  updateHospitalLabPackage,
  deleteHospitalLabPackage
} from './lab-tests.controller';

const router = Router();

// Notice: In the prompt, the paths were prefixed with /api/v1/hospital/lab-tests.
// Assuming this router is mounted at /api/v1/hospital/lab-tests in src/app.ts or similar.
router.get('/', getHospitalLabTests);
router.post('/batch', addHospitalLabTestsBatch);
router.patch('/:id', updateHospitalLabTest);
router.delete('/:id', deleteHospitalLabTest);
router.get('/packages', getHospitalLabPackages);
router.post('/packages', createHospitalLabPackage);
router.patch('/packages/:id', updateHospitalLabPackage);
router.delete('/packages/:id', deleteHospitalLabPackage);

export default router;
