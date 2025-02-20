// src/lib/types/redis.ts

export interface RedisConfig {
  url: string
  token: string
}

export interface RedisOptions {
  ex?: number // expiration in seconds
  nx?: true   // only set if key doesn't exist
  xx?: true   // only set if key exists
}

export interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt?: number
  metadata?: {
    userId?: string
    source?: string
    lastModified?: number
  }
}

// Activity logging types for Phase 3
export interface RedisActivityLog {
  userId: string
  action: string
  resource: string
  timestamp: number
  metadata?: Record<string, unknown>
}

// Queue types for Phase 5
export interface RedisQueueItem<T> {
  id: string
  data: T
  status: 'pending' | 'processing' | 'completed' | 'failed'
  priority?: number
  attempts?: number
  maxAttempts?: number
  addedAt: number
  processedAt?: number
} 