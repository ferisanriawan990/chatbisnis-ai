export class MemoryCache {
  private cache: Map<string, { value: any; expiry: number }> = new Map();

  /**
   * Set a value in the cache with a Time-to-Live (TTL)
   * @param key Cache key
   * @param value Data to store
   * @param ttlSeconds Time-to-Live in seconds
   */
  set(key: string, value: any, ttlSeconds: number): void {
    const expiry = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { value, expiry });
  }

  /**
   * Get a value from the cache if it exists and hasn't expired
   * @param key Cache key
   * @returns The cached value or null
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value as T;
  }

  /**
   * Delete a key from the cache
   * @param key Cache key
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all expired items from the cache (can be run periodically)
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear the entire cache
   */
  clear(): void {
    this.cache.clear();
  }
}

// Global instance to persist across hot reloads in development
// and across invocations in a warm serverless container
const globalForCache = global as unknown as { systemCache: MemoryCache };

export const systemCache = globalForCache.systemCache || new MemoryCache();

if (process.env.NODE_ENV !== 'production') {
  globalForCache.systemCache = systemCache;
}
