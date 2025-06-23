interface CacheItem<T> {
  data: T
  expiresAt: number
}

class MemoryCache {
  private cache = new Map<string, CacheItem<any>>()
  
  /**
   * Get item from cache
   * Returns null if not found or expired
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key)
    
    if (!item) {
      return null
    }
    
    // Check if expired
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key)
      return null
    }
    
    return item.data
  }
  
  /**
   * Set item in cache with TTL
   * @param key Cache key
   * @param data Data to cache
   * @param ttlMs Time to live in milliseconds
   */
  set<T>(key: string, data: T, ttlMs: number): void {
    const expiresAt = Date.now() + ttlMs
    
    this.cache.set(key, {
      data,
      expiresAt
    })
  }
  
  /**
   * Delete specific key from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key)
  }
  
  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear()
  }
  
  /**
   * Get all cache keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys())
  }
  
  /**
   * Clear expired items (cleanup)
   */
  cleanup(): void {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key)
      }
    }
  }
  
  /**
   * Get cache stats for debugging
   */
  getStats() {
    const now = Date.now()
    let expired = 0
    let active = 0
    
    for (const item of this.cache.values()) {
      if (now > item.expiresAt) {
        expired++
      } else {
        active++
      }
    }
    
    return {
      total: this.cache.size,
      active,
      expired
    }
  }
}

// Singleton cache instance
export const memoryCache = new MemoryCache()

// Cache keys - centralized for easy management
export const CACHE_KEYS = {
  CATEGORIES_SUMMARY: 'categories_summary',
  USER_PERMISSIONS: (userId: string) => `user_permissions_${userId}`,
  SUBCATEGORY_VIDEOS: 'subcategory_videos',
  SUBCATEGORY_COUNT: 'subcategory_count',
} as const

// Cache TTLs (Time To Live) in milliseconds
export const CACHE_TTL = {
  CATEGORIES: 4 * 60 * 60 * 1000, // 4 hours (since categories only change 1-2x per week)
  USER_PERMISSIONS: 30 * 60 * 1000, // 30 minutes
  SUBCATEGORY_VIDEOS: 10 * 60 * 1000, // 10 minutes
  SUBCATEGORY_COUNT: 15 * 60 * 1000, // 15 minutes
} as const

// Cleanup expired items every hour
setInterval(() => {
  memoryCache.cleanup()
}, 60 * 60 * 1000)