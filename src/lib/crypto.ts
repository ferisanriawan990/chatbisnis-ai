import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // GCM recommended IV length
const AUTH_TAG_LENGTH = 16;

function getEncryptionSecret(): Buffer {
  const secret = process.env.ENCRYPTION_KEY || process.env.ENCRYPTION_SECRET;
  if (!secret) {
    throw new Error('ENCRYPTION_KEY or ENCRYPTION_SECRET environment variable is required');
  }
  if (secret.length !== 32) {
    throw new Error('Encryption key must be exactly 32 characters');
  }
  return Buffer.from(secret, 'utf8');
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 * Returns format: iv:authTag:ciphertext (all hex-encoded)
 */
export function encrypt(text: string): string {
  if (!text) {
    throw new Error('Cannot encrypt empty value');
  }

  const key = getEncryptionSecret();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt an AES-256-GCM encrypted string.
 * Expects format: iv:authTag:ciphertext (all hex-encoded)
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) {
    throw new Error('Cannot decrypt empty value');
  }

  const key = getEncryptionSecret();
  const parts = encryptedText.split(':');

  if (parts.length !== 3) {
    throw new Error('Invalid encrypted text format');
  }

  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const ciphertext = Buffer.from(parts[2], 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString('utf8');
}

/**
 * Mask a secret string for safe display. Shows only last 4 chars.
 * Example: "sk-abc123xyz" → "••••••••xyz"
 */
export function maskSecret(secret: string): string {
  if (!secret || secret.length <= 4) {
    return '••••••••';
  }
  const visible = secret.slice(-4);
  return `${'•'.repeat(Math.min(secret.length - 4, 12))}${visible}`;
}
