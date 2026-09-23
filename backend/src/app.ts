import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import apiRouter from './routes';
import { errorHandler } from './middleware/errorHandler';
import { env } from './config/env';

const app = express();

// Security and middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
  origin: (origin, callback) => {
    // Allow any localhost port for local development, or fallback to the exact CORS_ORIGIN
    if (!origin || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:') || env.CORS_ORIGIN.split(',').includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(morgan('dev'));

// Static files for uploads (reports, certificates, etc.)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Root Route & Health Check
app.get('/', (req, res) => {
  if (req.accepts('html')) {
    // If opened in a web browser, redirect directly to the user frontend
    return res.redirect('http://localhost:5173');
  }
  return res.json({
    status: 'ok',
    message: 'MediQuee Backend API Service is running',
    version: 'v1',
    endpoints: '/api/v1',
    frontend: 'http://localhost:5173'
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/v1', apiRouter);

// Global Error Handler
app.use(errorHandler);

export default app;
