import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import apiRouter from './routes';
import { errorHandler } from './middleware/errorHandler';
import { env } from './config/env';

const app = express();

// Security and middleware
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    // Allow any localhost port for local development, or fallback to the exact CORS_ORIGIN
    if (!origin || origin.startsWith('http://localhost:') || env.CORS_ORIGIN.split(',').includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// API Routes
app.use('/api/v1', apiRouter);

// Global Error Handler
app.use(errorHandler);

export default app;
