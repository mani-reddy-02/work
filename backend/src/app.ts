import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import apiRouter from './routes';
import { errorHandler } from './middleware/errorHandler';
import { env } from './config/env';
import { viewFileHandler, universalFileProxy } from './modules/files/files.controller';

const app = express();

// Trust the first reverse proxy hop (Nginx) so req.ip & rate limiters see real client IPs
app.set('trust proxy', 1);

// Security and middleware
const isProd = env.NODE_ENV === 'production';

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  hsts: isProd ? { maxAge: 31536000, includeSubDomains: true } : false,
}));

const productionOrigins = [
  'https://mediquee.in',
  'https://www.mediquee.in',
  'https://hospital.mediquee.in',
  'https://admin.mediquee.in',
  'https://api.mediquee.in',
  'https://34.93.190.51',
];

const devOnlyOrigins = [
  'http://mediquee.in',
  'http://www.mediquee.in',
  'http://hospital.mediquee.in',
  'http://admin.mediquee.in',
  'http://34.93.190.51',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:3000',
];

const configuredOrigins = (env.CORS_ORIGIN || '')
  .split(',')
  .map(s => s.trim())
  .filter(s => Boolean(s) && (!isProd || s.startsWith('https://')));

const allowedOrigins = Array.from(new Set([
  ...configuredOrigins,
  ...productionOrigins,
  ...(isProd ? [] : devOnlyOrigins),
]));

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. mobile apps, curl, server-to-server) where origin is undefined
    if (!origin) return callback(null, true);
    const domainRegex = isProd
      ? /^https:\/\/([a-z0-9-]+\.)?mediquee\.in$/
      : /^https?:\/\/([a-z0-9-]+\.)?mediquee\.in$/;
    if (
      allowedOrigins.includes(origin) ||
      domainRegex.test(origin)
    ) {
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

// Sanitize query parameters in HTTP access logs to redact secrets/tokens
morgan.token('url', (req: express.Request) => {
  const rawUrl = req.originalUrl || req.url || '';
  return rawUrl.replace(/([?&](?:token|verify_token|key|secret|password)=)[^&]+/gi, '$1[REDACTED]');
});
app.use(morgan('dev'));

// File streaming & inline preview handlers (resolves Supabase Storage & local disk files)
app.get('/uploads/reports/:filename', viewFileHandler('reports'));
app.get('/uploads/licenses/:filename', viewFileHandler('licenses'));
app.get('/uploads/attachments/:filename', viewFileHandler('attachments'));
app.get('/uploads/avatars/:filename', viewFileHandler('avatars'));

// Universal file proxy/preview endpoint
app.get('/api/v1/files/preview', universalFileProxy);
app.get('/api/v1/files/view', universalFileProxy);

// Static files strictly for non-sensitive public uploads (e.g. icons)
app.use('/uploads/icons', express.static(path.join(process.cwd(), 'uploads/icons')));

// Root Route & Health Check
const defaultFrontendUrl = isProd
  ? 'https://mediquee.in'
  : (configuredOrigins[0] || 'http://localhost:5173');

app.get('/', (req, res) => {
  if (req.accepts('html')) {
    return res.redirect(defaultFrontendUrl);
  }
  return res.json({
    status: 'ok',
    message: 'MediQuee Backend API Service is running',
    version: 'v1',
    endpoints: '/api/v1',
    frontend: defaultFrontendUrl
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes (supports /api/v1, /v1, and /api prefixes)
app.use('/api/v1', apiRouter);
app.use('/v1', apiRouter);
app.use('/api', apiRouter);

// Global Error Handler
app.use(errorHandler);

export default app;
