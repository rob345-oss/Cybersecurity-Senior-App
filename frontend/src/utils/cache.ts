/**
 * Cache entry with expiration time
 */
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

/**
 * Simple in-memory cache for API responses
 */
class ApiCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultTTL: number;

  constructor(defaultTTL: number = 5 * 60 * 1000) {
    // Default TTL: 5 minutes
    this.defaultTTL = defaultTTL;
  }

  /**
   * Generate a cache key from path and body
   */
  private generateKey(path: string, body?: unknown): string {
    const bodyStr = body ? JSON.stringify(body) : "";
    return `${path}:${bodyStr}`;
  }

  /**
   * Get cached data if available and not expired
   */
  get<T>(path: string, body?: unknown): T | null {
    const key = this.generateKey(path, body);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Store data in cache
   */
  set<T>(path: string, data: T, body?: unknown, ttl?: number): void {
    const key = this.generateKey(path, body);
    const expiresAt = Date.now() + (ttl || this.defaultTTL);

    this.cache.set(key, {
      data,
      expiresAt
    });
  }

  /**
   * Clear a specific cache entry
   */
  clear(path: string, body?: unknown): void {
    const key = this.generateKey(path, body);
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clearAll(): void {
    this.cache.clear();
  }

  /**
   * Remove expired entries (cleanup)
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }
}

// Export singleton instance
export const apiCache = new ApiCache();

// Run cleanup every minute
if (typeof window !== "undefined") {
  setInterval(() => {
    apiCache.cleanup();
  }, 60 * 1000);
}

