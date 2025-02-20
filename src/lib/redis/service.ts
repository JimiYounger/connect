// src/lib/redis/service.ts

import { Redis, SetCommandOptions } from '@upstash/redis'
import type { CacheEntry, RedisOptions, RedisActivityLog, RedisQueueItem } from '../types/redis'
import { RedisError, RedisErrorCodes } from './errors'

export class RedisService {
  private client: Redis
  
  constructor(client: Redis) {
    this.client = client
  }

  private convertOptions(options?: RedisOptions): SetCommandOptions {
    if (!options) return {}
    
    if (options.ex) {
      return { ex: options.ex }
    }
    
    if (options.nx) {
      return { nx: true }
    }
    
    if (options.xx) {
      return { xx: true }
    }
    
    return {}
  }

  // Core cache methods
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.client.get<CacheEntry<T>>(key)
      if (!data) return null
      
      if (data.expiresAt && data.expiresAt < Date.now()) {
        await this.delete(key)
        return null
      }
      
      return data.data
    } catch (error) {
      throw new RedisError(
        `Failed to get data for key: ${key}`,
        RedisErrorCodes.OPERATION_ERROR,
        error
      )
    }
  }

  async set<T>(key: string, value: T, options?: RedisOptions): Promise<void> {
    try {
      const entry: CacheEntry<T> = {
        data: value,
        timestamp: Date.now(),
        expiresAt: options?.ex ? Date.now() + options.ex * 1000 : undefined
      }
      await this.client.set(key, entry, this.convertOptions(options))
    } catch (error) {
      throw new RedisError(
        `Failed to set data for key: ${key}`,
        RedisErrorCodes.OPERATION_ERROR,
        error
      )
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.client.del(key)
    } catch (error) {
      throw new RedisError(
        `Failed to delete key: ${key}`,
        RedisErrorCodes.OPERATION_ERROR,
        error
      )
    }
  }

  // Activity logging methods (for Phase 3)
  async logActivity(log: RedisActivityLog): Promise<void> {
    try {
      const key = `activity:${log.userId}:${Date.now()}`
      await this.set(key, log, { ex: 60 * 60 * 24 * 30 }) // 30 days retention
    } catch (error) {
      throw new RedisError(
        'Failed to log activity',
        RedisErrorCodes.OPERATION_ERROR,
        error
      )
    }
  }

  // Queue methods (for Phase 5)
  async enqueue<T>(queue: string, data: T, priority = 0): Promise<string> {
    try {
      const id = `${queue}:${Date.now()}`
      const item: RedisQueueItem<T> = {
        id,
        data,
        status: 'pending',
        priority,
        attempts: 0,
        maxAttempts: 3,
        addedAt: Date.now()
      }
      await this.set(`queue:${id}`, item)
      return id
    } catch (error) {
      throw new RedisError(
        'Failed to enqueue item',
        RedisErrorCodes.QUEUE_ERROR,
        error
      )
    }
  }

  // Add this new method for getting keys
  async keys(pattern: string): Promise<string[]> {
    try {
      return await this.client.keys(pattern)
    } catch (error) {
      throw new RedisError(
        `Failed to get keys with pattern: ${pattern}`,
        RedisErrorCodes.OPERATION_ERROR,
        error
      )
    }
  }
} 