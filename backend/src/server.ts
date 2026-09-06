import app from './app';
import { env } from './config/env';
import { prisma } from './config/prisma';

const PORT = env.PORT || 5000;

const startServer = async () => {
  try {
    await prisma.$connect();
    console.log('Successfully connected to the database.');

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT} in ${env.NODE_ENV} mode.`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
