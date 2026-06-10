import crypto from 'crypto';
import { NextRequest } from 'next/server';

/**
 * Compare two strings in a timing-safe manner to prevent timing attacks.
 */
export function timingSafeEqualString(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/**
 * Validates that a specific header matches the expected secret.
 * Fails closed if the secret is not configured in production.
 */
export function requireHeaderSecret(req: Request | NextRequest, headerName: string, expectedSecret?: string): boolean {
  if (!expectedSecret) {
    // If we are in production and the secret is missing from ENV, fail closed.
    if (process.env.NODE_ENV === 'production') return false;
    // In local dev, if both are missing, we might allow it, but failing closed is safer.
    return false;
  }
  const provided = req.headers.get(headerName);
  return timingSafeEqualString(provided, expectedSecret);
}

/**
 * Asserts that the request comes from the same origin as NEXT_PUBLIC_APP_URL.
 */
export function assertSameOrigin(req: Request | NextRequest): boolean {
  if (process.env.NODE_ENV !== 'production') return true; // Relaxed in dev
  
  const expectedOrigin = process.env.NEXT_PUBLIC_APP_URL;
  if (!expectedOrigin) return false; // Fail closed

  const origin = req.headers.get('origin') || req.headers.get('referer');
  if (!origin) return false;

  try {
    const expectedHost = new URL(expectedOrigin).host;
    const requestHost = new URL(origin).host;
    return expectedHost === requestHost;
  } catch {
    return false;
  }
}

/**
 * Get client IP safely.
 */
export function getRequestIp(req: Request | NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp;
  return 'unknown';
}

/**
 * Safely parse JSON from a request with a maximum byte size.
 */
export async function parseJsonSafe<T>(req: Request | NextRequest, maxBytes: number = 5 * 1024 * 1024): Promise<T | null> {
  const contentLength = req.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > maxBytes) {
    throw new Error('Payload too large');
  }
  
  try {
    const text = await req.text();
    if (text.length > maxBytes) {
      throw new Error('Payload too large');
    }
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

/**
 * Validate that a URL is a public HTTPS URL.
 */
export function validatePublicHttpsUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    if (url.protocol !== 'https:') return false;
    if (blockPrivateNetworkUrl(urlString)) return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * Blocks known private/local IP addresses and domains.
 * Useful to prevent SSRF against internal resources.
 */
export function blockPrivateNetworkUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    const host = url.hostname;

    // Block localhost
    if (host === 'localhost' || host.endsWith('.localhost')) return true;

    // IP blocks
    const ipv4Regex = /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/;
    const match = host.match(ipv4Regex);
    if (match) {
      const parts = match.slice(1).map(Number);
      
      // 127.0.0.0/8
      if (parts[0] === 127) return true;
      // 0.0.0.0/8
      if (parts[0] === 0) return true;
      // 10.0.0.0/8
      if (parts[0] === 10) return true;
      // 172.16.0.0/12
      if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
      // 192.168.0.0/16
      if (parts[0] === 192 && parts[1] === 168) return true;
      // 169.254.0.0/16 (Link local)
      if (parts[0] === 169 && parts[1] === 254) return true;
    }

    return false;
  } catch {
    return true; // If invalid URL, block it
  }
}
