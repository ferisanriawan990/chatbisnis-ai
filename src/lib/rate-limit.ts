/**
 * Simple in-memory rate limiter using sliding window.
 * For production, replace with Redis-based solution.
 */

import { Redis } from '@upstash/redis';

// Only init Redis if URL and Token exist
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

interface RateLimitEntry {
  timestamps: number[];
}

// In-Memory Fallback Store
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
export async function rateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const now = Date.now();

  // Try Redis first
  if (redis) {
    try {
      const windowSeconds = Math.ceil(windowMs / 1000);
      const key = `ratelimit:${identifier}`;
      
      const tx = redis.multi();
      tx.zadd(key, { score: now, member: now.toString() });
      tx.zremrangebyscore(key, 0, now - windowMs);
      tx.zcard(key);
      tx.expire(key, windowSeconds);
      
      const results = await tx.exec();
      const count = results[2] as number;

      if (count > limit) {
        return { success: false, remaining: 0, limit };
      }
      return { success: true, remaining: limit - count, limit };
    } catch (error) {
      console.warn("Redis rate limit failed, falling back to memory:", error);
    }
  }

  // Fallback to In-Memory
  cleanup(windowMs);

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
