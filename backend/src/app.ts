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

const allowedOrigins = [
  env.CORS_ORIGIN,
  'http://34.93.190.51',
  'https://34.93.190.51',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:3000',
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. mobile apps, curl, server-to-server) where origin is undefined
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true,
}));
app.use(express.json({ 
  limit: '20mb',
  verify: (req: any, _res, buf) => {
    req.rawBody = buf.toString('utf8');
  }
}));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(morgan('dev'));

// Explicitly block unauthenticated direct access to patient medical reports and sensitive documents
app.use('/uploads/reports', (req, res) => {
  res.status(403).json({
    success: false,
    message: 'Access denied: Direct static access to medical reports is forbidden. Please access reports via authenticated API endpoints.',
  });
});
app.use('/uploads/licenses', (req, res) => {
  res.status(403).json({
    success: false,
    message: 'Access denied: Direct static access to license documents is forbidden.',
  });
});

// Static files strictly for non-sensitive public uploads (e.g. icons)
app.use('/uploads/icons', express.static(path.join(process.cwd(), 'uploads/icons')));

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

// API Routes (supports both direct /api/v1 and reverse-proxied /v1)
app.use('/api/v1', apiRouter);
app.use('/v1', apiRouter);

// Global Error Handler
app.use(errorHandler);

export default app;
