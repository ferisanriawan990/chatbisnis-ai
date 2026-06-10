"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.encrypt = encrypt;
exports.decrypt = decrypt;
exports.maskSecret = maskSecret;
var crypto_1 = __importDefault(require("crypto"));
var ALGORITHM = 'aes-256-gcm';
var IV_LENGTH = 12; // GCM recommended IV length
var AUTH_TAG_LENGTH = 16;
function getEncryptionSecret() {
    var secret = process.env.ENCRYPTION_SECRET;
    if (!secret) {
        throw new Error('ENCRYPTION_SECRET environment variable is required');
    }
    if (secret.length !== 32) {
        throw new Error('ENCRYPTION_SECRET must be exactly 32 characters');
    }
    return Buffer.from(secret, 'utf8');
}
/**
 * Encrypt a plaintext string using AES-256-GCM.
 * Returns format: iv:authTag:ciphertext (all hex-encoded)
 */
function encrypt(text) {
    if (!text) {
        throw new Error('Cannot encrypt empty value');
    }
    var key = getEncryptionSecret();
    var iv = crypto_1.default.randomBytes(IV_LENGTH);
    var cipher = crypto_1.default.createCipheriv(ALGORITHM, key, iv, {
        authTagLength: AUTH_TAG_LENGTH,
    });
    var encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    var authTag = cipher.getAuthTag();
    return "".concat(iv.toString('hex'), ":").concat(authTag.toString('hex'), ":").concat(encrypted);
}
/**
 * Decrypt an AES-256-GCM encrypted string.
 * Expects format: iv:authTag:ciphertext (all hex-encoded)
 */
function decrypt(encryptedText) {
    if (!encryptedText) {
        throw new Error('Cannot decrypt empty value');
    }
    var key = getEncryptionSecret();
    var parts = encryptedText.split(':');
    if (parts.length !== 3) {
        throw new Error('Invalid encrypted text format');
    }
    var iv = Buffer.from(parts[0], 'hex');
    var authTag = Buffer.from(parts[1], 'hex');
    var ciphertext = Buffer.from(parts[2], 'hex');
    var decipher = crypto_1.default.createDecipheriv(ALGORITHM, key, iv, {
        authTagLength: AUTH_TAG_LENGTH,
    });
    decipher.setAuthTag(authTag);
    var decrypted = decipher.update(ciphertext);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString('utf8');
}
/**
 * Mask a secret string for safe display. Shows only last 4 chars.
 * Example: "sk-abc123xyz" → "••••••••xyz"
 */
function maskSecret(secret) {
    if (!secret || secret.length <= 4) {
        return '••••••••';
    }
    var visible = secret.slice(-4);
    return "".concat('•'.repeat(Math.min(secret.length - 4, 12))).concat(visible);
}
