// src/lib/logging/activity-logger.ts

import { getRedis } from '@/lib/redis'
import { ActivityLog, ActivityType, ActivityStatus } from '@/lib/types/activity'

export class ActivityLogger {
  private static readonly isClient = typeof window !== 'undefined'
  private static throttleMap = new Map<string, number>()
  private static readonly THROTTLE_DURATION = 1000 // 1 second in milliseconds

  private static getThrottleKey(
    type: ActivityType,
    action: string,
    userId?: string
  ): string {
    return `${type}:${action}:${userId || 'anonymous'}`
  }

  private static shouldThrottle(
    type: ActivityType,
    action: string,
    userId?: string
  ): boolean {
    const key = this.getThrottleKey(type, action, userId)
    const lastLogTime = this.throttleMap.get(key)
    const currentTime = Date.now()

    if (!lastLogTime) {
      this.throttleMap.set(key, currentTime)
      return false
    }

    if (currentTime - lastLogTime < this.THROTTLE_DURATION) {
      return true
    }

    this.throttleMap.set(key, currentTime)
    return false
  }

  private static cleanupThrottleMap(): void {
    const currentTime = Date.now()
    for (const [key, timestamp] of this.throttleMap.entries()) {
      if (currentTime - timestamp > this.THROTTLE_DURATION) {
        this.throttleMap.delete(key)
      }
    }
  }

  private static getRedisInstance() {
    if (this.isClient) {
      return null
    }
    const redis = getRedis()
    if (!redis) {
      throw new Error('Redis service is not available')
    }
    return redis
  }

  static async log(
    type: ActivityType,
    action: string,
    status: ActivityStatus,
    details: Record<string, unknown>,
    userId?: string,
    userEmail?: string,
    metadata?: ActivityLog['metadata']
  ): Promise<string | null> {
    // Clean up old throttle entries periodically
    this.cleanupThrottleMap()

    // Check if this log should be throttled
    if (this.shouldThrottle(type, action, userId)) {
      return null
    }

    const activityLog: ActivityLog = {
      id: crypto.randomUUID(),
      type,
      action,
      userId,
      userEmail,
      status,
      details,
      metadata,
      timestamp: Date.now()
    }

    if (this.isClient) {
      try {
        const response = await fetch('/api/log-activity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(activityLog)
        })
        if (!response.ok) {
          throw new Error('Failed to log activity')
        }
        return activityLog.id
      } catch (error) {
        console.error('Failed to send activity to API:', error)
        return activityLog.id
      }
    }

    try {
      const redis = this.getRedisInstance()
      if (!redis) {
        console.error('Redis not available')
        return activityLog.id
      }

      await redis.set(
        `activity:${activityLog.id}`,
        activityLog,
        { ex: 60 * 60 * 24 * 30 } // 30 days
      )

      return activityLog.id
    } catch (error) {
      console.error('Failed to log activity:', error)
      return activityLog.id
    }
  }

  static async getActivities(limit: number = 100): Promise<ActivityLog[]> {
    try {
      const redis = this.getRedisInstance()
      if (!redis) {
        console.error('Redis not available for getting activities')
        return []
      }
      
      // Get all activity keys
      const keys = await redis.keys('activity:*')
      
      // Sort keys by timestamp (newest first)
      const activities = await Promise.all(
        keys.slice(0, limit).map(async (key) => {
          const data = await redis.get<ActivityLog>(key)
          return data || null
        })
      )

      return activities
        .filter((activity): activity is ActivityLog => activity !== null)
        .sort((a, b) => b.timestamp - a.timestamp)
    } catch (error) {
      console.error('Failed to get activities:', error)
      throw error
    }
  }
}