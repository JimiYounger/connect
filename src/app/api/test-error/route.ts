import { ErrorLogger } from '@/lib/logging/error-logger'
import { ErrorSeverity, ErrorSource, AppError } from '@/lib/types/errors'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Simulate different types of errors
    const errorType = Math.random()
    
    if (errorType < 0.33) {
      // Test regular error
      throw new Error('Test regular error')
    } else if (errorType < 0.66) {
      // Test custom AppError
      throw new AppError('Test custom error', {
        severity: ErrorSeverity.HIGH,
        source: ErrorSource.SERVER,
        context: {
          test: 'data'
        }
      })
    } else {
      // Test critical error
      throw new AppError('Test critical error', {
        severity: ErrorSeverity.CRITICAL,
        source: ErrorSource.SERVER,
        context: {
          critical: true
        }
      })
    }
  } catch (error) {
    const errorId = await ErrorLogger.log(error, {
      severity: ErrorSeverity.HIGH,
      source: ErrorSource.SERVER,
      context: {
        endpoint: '/api/test-error'
      }
    })

    return NextResponse.json({ 
      status: 'error',
      message: 'Error logged successfully',
      errorId 
    }, { status: 500 })
  }
} 