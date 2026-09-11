import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import usersRoutes from '../modules/users/users.routes';
import departmentsRoutes from '../modules/departments/departments.routes';
import staffRoutes from '../modules/staff/staff.routes';
import permissionsRoutes from '../modules/permissions/permissions.routes';
import adminRoutes from '../modules/admin/admin.routes';
import publicRoutes from '../modules/public/public.routes';
import referenceRoutes from '../modules/reference/reference.routes';
import bookingRoutes from '../modules/bookings/bookings.routes';
import dashboardRoutes from '../modules/dashboard/dashboard.routes';
import payoutsRoutes from '../modules/payouts/payouts.routes';
import diseasesRoutes from '../modules/diseases/diseases.routes';
import hospitalsRoutes from '../modules/hospitals/hospitals.routes';
import doctorsRoutes from '../modules/doctors/doctors.routes';
import appointmentsRoutes from '../modules/appointments/appointments.routes';
import laboratoriesRoutes from '../modules/laboratories/laboratories.routes';
import labTestsRoutes from '../modules/laboratories/lab-tests.routes';
import labBookingsRoutes from '../modules/laboratories/lab-bookings.routes';
import homeNursingRoutes from '../modules/home-nursing/home-nursing.routes';
import homeSampleRoutes from '../modules/home-sample-collection/home-sample.routes';
import reportsRoutes from '../modules/reports/reports.routes';
import { prisma } from '../config/prisma';

const router = Router();

// Health Checks
router.get('/health', (req, res) => {
  res.json({ success: true, message: 'Server is healthy' });
});

router.get('/health/db', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ success: true, message: 'Database is healthy' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Database connection failed' });
  }
});

// API Routes
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/departments', departmentsRoutes);
router.use('/staff', staffRoutes);
router.use('/permissions', permissionsRoutes);
router.use('/admin', adminRoutes);
router.use('/public', publicRoutes);
router.use('/reference', referenceRoutes);
router.use('/hospital/bookings', bookingRoutes);
router.use('/hospital/dashboard', dashboardRoutes);
router.use('/hospital/payouts', payoutsRoutes);
router.use('/diseases', diseasesRoutes);
router.use('/hospitals', hospitalsRoutes);
router.use('/doctors', doctorsRoutes);
router.use('/doctor', doctorsRoutes);
router.use('/appointments', appointmentsRoutes);
router.use('/user/bookings/op', appointmentsRoutes);
router.use('/laboratories', laboratoriesRoutes);
router.use('/lab-tests', labTestsRoutes);
router.use('/lab-bookings', labBookingsRoutes);
router.use('/home-nursing', homeNursingRoutes);
router.use('/home-sample-collection', homeSampleRoutes);
router.use('/reports', reportsRoutes);

export default router;
