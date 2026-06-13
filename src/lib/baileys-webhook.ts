import crypto from 'crypto';
import { timingSafeEqualString } from './security';

export interface BaileysWebhookPayload {
  event: 'message.received';
  sessionId: string;
  messageId: string;
  from: string;
  to: string;
  type: string;
  text?: string;
  caption?: string;
  timestamp: number;
  senderName?: string;
  participant?: string;
  isGroup: boolean;
  media?: {
    mimeType: string;
    sizeBytes: number;
    base64: string;
  };
  mediaDownloadError?: string;
}

export function verifyBaileysWebhook(
  rawBody: string,
  timestamp: string | null,
  signature: string | null,
  legacySecret: string | null,
  secret: string | undefined = process.env.BAILEYS_WEBHOOK_SECRET,
) {
  if (!secret) return false;

  if (timestamp && signature) {
    const timestampNumber = Number(timestamp);
    const ageSeconds = Math.abs(Date.now() / 1000 - timestampNumber);
    if (Number.isFinite(timestampNumber) && ageSeconds <= 300) {
      const digest = crypto
        .createHmac('sha256', secret)
        .update(`${timestamp}.${rawBody}`)
        .digest('hex');
      if (timingSafeEqualString(signature, `sha256=${digest}`)) return true;
    }
  }

  // Compatibility for the previous gateway release during secret rotation.
  return timingSafeEqualString(legacySecret, secret);
}

export function normalizeWhatsAppRecipient(jid: string) {
  if (jid.endsWith('@lid') || jid.endsWith('@g.us')) {
    return jid;
  }
  return jid
    .replace(/@s\.whatsapp\.net$/i, '')
    .replace(/@c\.us$/i, '')
    .replace(/:\d+$/, '')
    .replace(/[^0-9]/g, '');
}

export function webhookIdempotencyKey(messageId: string, suffix: string) {
  const safeMessageId = messageId.replace(/[^a-zA-Z0-9._:-]/g, '').slice(0, 80) || 'unknown';
  return `webhook:${safeMessageId}:${suffix}`.slice(0, 128);
}
