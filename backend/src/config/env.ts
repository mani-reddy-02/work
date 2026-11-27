import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  JWT_SECRET: z.string(),
  JWT_EXPIRES_IN: z.string().default('7d'),
  WHATSAPP_ACCESS_TOKEN: z.string().optional(),
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
  WHATSAPP_BUSINESS_ACCOUNT_ID: z.string().optional(),
  WHATSAPP_API_VERSION: z.string().default('v21.0'),
  WHATSAPP_WEBHOOK_VERIFY_TOKEN: z.string().default('mediquee_wa_verify_token_secure'),
  WHATSAPP_APP_SECRET: z.string().optional(),
  SUPABASE_URL: z.string().optional(),
  META_WA_PHONE_NUMBER_ID: z.string().optional(),
  META_WA_ACCESS_TOKEN: z.string().optional(),
  META_WA_TEMPLATE_NAME: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-3.8-flash'),
  GROQ_API_KEY: z.string().optional(),
  GROQ_MODEL: z.string().default('llama-3.3-70b-versatile'),
  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_MODEL: z.string().default('meta-llama/llama-3.3-70b-instruct:free'),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_BASE_URL: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),
  LIVEKIT_URL: z.string().optional(),
  LIVEKIT_API_KEY: z.string().optional(),
  LIVEKIT_API_SECRET: z.string().optional(),
  // Exotel Telephony Cloud API
  EXOTEL_ACCOUNT_SID: z.string().optional(),
  EXOTEL_API_KEY: z.string().optional(),
  EXOTEL_API_TOKEN: z.string().optional(),
  EXOTEL_SUBDOMAIN: z.string().default('api.exotel.com'),
  EXOTEL_BASE_URL: z.string().optional(),
  EXOTEL_CALLER_ID: z.string().optional(),
  EXOTEL_APP_ID: z.string().optional(),
  EXOTEL_WEBHOOK_SECRET: z.string().default('mediquee_exotel_webhook_secret_key'),
  EXOTEL_ENABLE_RECORDING: z.string().default('false'),
  EXOTEL_STATUS_CALLBACK_URL: z.string().optional(),
  // Razorpay Payment Gateway
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('Invalid environment variables:\n', _env.error.format());
  throw new Error('Invalid environment variables');
}

export const env = _env.data;

// Production fail-closed secret strength enforcement (OWASP A02/A04)
if (env.NODE_ENV === 'production') {
  if (!env.JWT_SECRET || env.JWT_SECRET.trim().length < 32 || env.JWT_SECRET === 'local_dev_secret_key') {
    throw new Error('[SECURITY CRITICAL] JWT_SECRET must be a strong, unique secret (at least 32 characters) in production.');
  }
}
