import crypto from 'crypto';
import { env } from '../config/env';

// Derive 32-byte encryption key using scrypt and a fixed application salt
const ENCRYPTION_SALT = 'mediquee-exotel-telephony-v1';
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits recommended for GCM
const AUTH_TAG_LENGTH = 16;

/**
 * Returns primary encryption key buffer.
 * Priority:
 * 1. Dedicated PHONE_ENCRYPTION_KEY from process.env
 * 2. JWT_SECRET from env
 * In production, throws error if neither is properly configured.
 */
function getPrimaryEncryptionKey(): Buffer {
  const customKey = process.env.PHONE_ENCRYPTION_KEY || process.env.EXOTEL_PHONE_ENCRYPTION_KEY;
  if (customKey && customKey.trim().length >= 16) {
    return crypto.scryptSync(customKey.trim(), ENCRYPTION_SALT, 32);
  }

  const jwtSecret = env.JWT_SECRET;
  if (jwtSecret && jwtSecret.trim().length >= 16) {
    return crypto.scryptSync(jwtSecret.trim(), ENCRYPTION_SALT, 32);
  }

  if (env.NODE_ENV === 'production') {
    throw new Error(
      '[SECURITY CRITICAL] PHONE_ENCRYPTION_KEY or strong JWT_SECRET must be configured in production for AES-256-GCM data protection.'
    );
  }

  // Safe development fallback only
  return crypto.scryptSync('mediquee-dev-only-secret-do-not-use-in-prod', ENCRYPTION_SALT, 32);
}

/**
 * Returns list of historical rotation keys to attempt during key rotation grace period.
 */
function getHistoricalKeys(): Buffer[] {
  const oldKeysStr = process.env.OLD_PHONE_ENCRYPTION_KEYS || '';
  if (!oldKeysStr.trim()) return [];

  return oldKeysStr
    .split(',')
    .map((k) => k.trim())
    .filter((k) => k.length >= 16)
    .map((k) => crypto.scryptSync(k, ENCRYPTION_SALT, 32));
}

/**
 * Encrypts a sensitive phone number at rest using AES-256-GCM.
 * Output format: "enc:v1:<iv_hex>:<authTag_hex>:<ciphertext_hex>"
 */
export function encryptPhoneNumber(plainPhone?: string | null): string {
  if (!plainPhone || !plainPhone.trim()) {
    return '';
  }

  const clean = plainPhone.trim();
  try {
    const key = getPrimaryEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });

    let encrypted = cipher.update(clean, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag().toString('hex');
    return `enc:v1:${iv.toString('hex')}:${authTag}:${encrypted}`;
  } catch (err: any) {
    console.error('[PhoneCrypto] Encryption error:', err.message);
    throw new Error('Failed to securely encrypt telephone number');
  }
}

/**
 * Decrypts an AES-256-GCM encrypted phone number with key rotation support.
 * Returns the plain phone number, or raw input if not encrypted.
 */
export function decryptPhoneNumber(encryptedPhone?: string | null): string {
  if (!encryptedPhone) return '';
  if (!encryptedPhone.startsWith('enc:v1:')) {
    return encryptedPhone; // Plaintext legacy or fallback
  }

  const parts = encryptedPhone.split(':');
  if (parts.length !== 5) {
    return encryptedPhone;
  }

  const iv = Buffer.from(parts[2], 'hex');
  const authTag = Buffer.from(parts[3], 'hex');
  const ciphertext = parts[4];

  // Try primary key first
  const keysToTry = [getPrimaryEncryptionKey(), ...getHistoricalKeys()];

  for (const key of keysToTry) {
    try {
      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
        authTagLength: AUTH_TAG_LENGTH,
      });
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch {
      // Continue to next key in rotation list if authTag verification fails
      continue;
    }
  }

  console.error('[PhoneCrypto] Decryption failed across all available keys (auth tag mismatch or corrupted ciphertext).');
  return '[ENCRYPTED_PHONE_UNAVAILABLE]';
}

/**
 * Masks a phone number for safe API responses and UI displays.
 * Example:
 * "+919876543210" -> "+91 98*** ***10"
 * "9876543210"    -> "98*** ***10"
 * "08047290980"   -> "080-***-0980"
 */
export function maskPhoneNumber(phone?: string | null): string {
  if (!phone) return 'Unavailable';
  const clean = phone.replace(/[\s-]/g, '').trim();

  // If already masked or empty
  if (clean.includes('***') || clean.length < 5) {
    return clean || 'Unavailable';
  }

  // Landline / Virtual number format (11 digits starting with 0)
  if (clean.length === 11 && clean.startsWith('0')) {
    return `${clean.slice(0, 3)}-***-${clean.slice(-4)}`;
  }

  // International format with country code (e.g. +91...)
  if (clean.startsWith('+')) {
    const prefix = clean.slice(0, 3); // e.g. +91
    const national = clean.slice(3);
    if (national.length >= 6) {
      return `${prefix} ${national.slice(0, 2)}*** ***${national.slice(-2)}`;
    }
    return `${prefix} ***${national.slice(-2)}`;
  }

  // Standard Indian 10-digit mobile number
  if (clean.length === 10) {
    return `${clean.slice(0, 2)}*** ***${clean.slice(-2)}`;
  }

  // Fallback generic masking
  if (clean.length > 4) {
    return `${clean.slice(0, 2)}****${clean.slice(-2)}`;
  }

  return '****';
}
