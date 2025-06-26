// src/lib/redis/errors.ts

export class RedisError extends Error {
  constructor(
    message: string,
    public readonly code: RedisErrorCode,
    public readonly originalError?: unknown,
    public readonly context?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'RedisError'
  }
}

export const RedisErrorCodes = {
  CONNECTION_ERROR: 'REDIS_CONNECTION_ERROR',
  OPERATION_ERROR: 'REDIS_OPERATION_ERROR',
  INVALID_DATA: 'REDIS_INVALID_DATA',
  TIMEOUT: 'REDIS_TIMEOUT',
  RATE_LIMIT: 'REDIS_RATE_LIMIT',
  QUEUE_ERROR: 'REDIS_QUEUE_ERROR',
} as const

export type RedisErrorCode = typeof RedisErrorCodes[keyof typeof RedisErrorCodes] 