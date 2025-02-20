// src/lib/logging/error-logger.ts

import { getRedis } from '@/lib/redis'
import { ErrorLog, ErrorMetadata, ErrorSeverity, ErrorSource } from '../types/errors'
import { v4 as uuidv4 } from 'uuid'

export class ErrorLogger {
  private static readonly ERROR_KEY_PREFIX = 'error:'
  private static readonly ERROR_TTL = 60 * 60 * 24 * 30 // 30 days
  private static readonly isClient = typeof window !== 'undefined'

  private static getRedisInstance() {
    if (this.isClient) {
      return null
    }
    try {
      return getRedis()
    } catch (error) {
      console.error('Failed to get Redis instance:', error)
      return null
    }
  }

  static async log(
    error: Error | unknown,
    metadata: Omit<ErrorMetadata, 'timestamp'>
  ): Promise<string> {
    const errorId = uuidv4()
    const timestamp = Date.now()

    const errorLog: ErrorLog = {
      id: errorId,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp,
      ...metadata
    }

    if (this.isClient) {
      try {
        await fetch('/api/log-error', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(errorLog)
        })
      } catch (fetchError) {
        console.error('Failed to send error to API:', fetchError)
      }
      return errorId
    }

    try {
      const redis = this.getRedisInstance()
      if (redis) {
        await redis.set(
          `${this.ERROR_KEY_PREFIX}${errorId}`,
          errorLog,
          { ex: this.ERROR_TTL }
        )
      } else {
        console.error('Redis not initialized:', errorLog)
      }

      if (metadata.severity === ErrorSeverity.CRITICAL) {
        await this.handleCriticalError(errorLog)
      }

      return errorId
    } catch (loggingError) {
      console.error('Failed to log error:', loggingError)
      console.error('Original error:', error)
      return 'logging-failed'
    }
  }

  private static async handleCriticalError(errorLog: ErrorLog): Promise<void> {
    console.error('CRITICAL ERROR:', errorLog)
  }

  static async getError(errorId: string): Promise<ErrorLog | null> {
    const redis = this.getRedisInstance()
    if (!redis) return null
    
    return redis.get<ErrorLog>(`${this.ERROR_KEY_PREFIX}${errorId}`)
  }

  static async getRecentErrors(limit = 10): Promise<ErrorLog[]> {
    try {
      const redis = this.getRedisInstance()
      if (!redis) return []
      
      const keys = await redis.keys(`${this.ERROR_KEY_PREFIX}*`)
      
      const errors = await Promise.all(
        keys.map((key) => this.getError(key.replace(this.ERROR_KEY_PREFIX, '')))
      )

      return errors
        .filter((error): error is ErrorLog => error !== null)
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit)
    } catch (error) {
      console.error('Failed to get recent errors:', error)
      return []
    }
  }
}