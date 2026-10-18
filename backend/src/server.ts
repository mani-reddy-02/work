import dns from 'dns';
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {
  // ignore
}
import app from './app';
import { env } from './config/env';
import { prisma } from './config/prisma';

import { startDoctorOverrideAutoReactivationJob } from './modules/doctors/doctor-override.service';

const PORT = env.PORT || 5000;

const startServer = async () => {
  try {
    await prisma.$connect();
    console.log('Successfully connected to the database.');

    // Start background auto-reactivation worker for expired doctor overrides
    startDoctorOverrideAutoReactivationJob();

    app.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`Server is running on port ${PORT} in ${env.NODE_ENV} mode.`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
