/**
 * Simple in-memory rate limiter using sliding window.
 * For production, replace with Redis-based solution.
 */

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  for (const [key, entry] of store.entries()) {
    entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);
    if (entry.timestamps.length === 0) {
      store.delete(key);
    }
  }
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  limit: number;
}

/**
 * Check rate limit for a given identifier.
 * @param identifier - Unique key (e.g., IP address, user ID)
 * @param limit - Maximum number of requests allowed in the window
 * @param windowMs - Time window in milliseconds
 */
export function rateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  cleanup(windowMs);

  const now = Date.now();
  const entry = store.get(identifier) || { timestamps: [] };

  // Remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

  if (entry.timestamps.length >= limit) {
    return {
      success: false,
      remaining: 0,
      limit,
    };
  }

  entry.timestamps.push(now);
  store.set(identifier, entry);

  return {
    success: true,
    remaining: limit - entry.timestamps.length,
    limit,
  };
}

/**
 * Get client IP from request headers (works with Vercel/proxies).
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  return 'unknown';
}
