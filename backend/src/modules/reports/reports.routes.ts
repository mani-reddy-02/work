import { Router } from 'express';
import { getReports, uploadReport, deleteReport, downloadReport } from './reports.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/', getReports);
router.post('/upload', uploadReport);
router.delete('/:id', deleteReport);
router.get('/:id/download', downloadReport);
router.get('/:id/file', downloadReport);

export default router;
