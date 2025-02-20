// src/lib/types/errors.ts

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ErrorSource {
  CLIENT = 'client',
  SERVER = 'server',
  DATABASE = 'database',
  REDIS = 'redis',
  EXTERNAL_API = 'external_api'
}

export interface ErrorMetadata {
  userId?: string
  path?: string
  timestamp: number
  severity: ErrorSeverity
  source: ErrorSource
  context?: Record<string, unknown>
}

export interface ErrorLog extends ErrorMetadata {
  id: string
  message: string
  stack?: string
  code?: string
}

export class AppError extends Error {
  constructor(
    message: string,
    public readonly metadata: Omit<ErrorMetadata, 'timestamp'>,
    public readonly code?: string
  ) {
    super(message)
    this.name = 'AppError'
  }
} 