// src/lib/redis/index.ts

import { Redis } from '@upstash/redis'
import { RedisService } from './service'
import { RedisError, RedisErrorCodes } from './errors'
import type { RedisOptions } from '../types/redis'

let redisService: RedisService | null = null

export function initializeRedis() {
  if (typeof window !== 'undefined') {
    return null
  }

  if (redisService) {
    return redisService
  }

  try {
    if (!process.env.UPSTASH_REDIS_REST_URL) {
      throw new RedisError(
        'UPSTASH_REDIS_REST_URL is not defined in environment variables',
        RedisErrorCodes.CONNECTION_ERROR
      )
    }

    if (!process.env.UPSTASH_REDIS_REST_TOKEN) {
      throw new RedisError(
        'UPSTASH_REDIS_REST_TOKEN is not defined in environment variables',
        RedisErrorCodes.CONNECTION_ERROR
      )
    }

    const client = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })

    redisService = new RedisService(client)
    return redisService
  } catch (error) {
    console.error('Failed to initialize Redis:', error)
    throw new RedisError(
      'Failed to initialize Redis service',
      RedisErrorCodes.CONNECTION_ERROR,
      error
    )
  }
}

// Export a function to get or initialize Redis
export function getRedis(): RedisService {
  const redis = initializeRedis()
  if (!redis) {
    throw new RedisError(
      'Redis is not available in this environment',
      RedisErrorCodes.CONNECTION_ERROR
    )
  }
  return redis
}

// Export everything needed
export { RedisService } from './service'
export { RedisError, RedisErrorCodes } from './errors'
export type { RedisOptions }

// For backwards compatibility, but consider deprecating
export const redis = redisService