'use client'

import { ErrorBoundary } from '@/components/error-boundary'
import { useState } from 'react'

function ErrorButton({ label, onTrigger }: { label: string; onTrigger: () => void }) {
  return (
    <button
      onClick={onTrigger}
      className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 mr-2"
    >
      {label}
    </button>
  )
}

function ErrorTrigger() {
  const [count, setCount] = useState(0)

  const logError = async (error: Error, context: any = {}) => {
    try {
      const response = await fetch('/api/log-error', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: error.message,
          name: error.name,
          stack: error.stack,
          source: 'client',
          severity: 'high',
          context: {
            ...context,
            location: window.location.href,
            userAgent: window.navigator.userAgent,
            timestamp: new Date().toISOString(),
          },
        }),
      })

      const data = await response.json()
      console.log('Error logged with ID:', data.errorId)
    } catch (e) {
      console.error('Failed to log error:', e)
    }
  }

  const triggerClientError = () => {
    try {
      // Trigger a TypeError
      const obj: any = null
      obj.nonExistentMethod()
    } catch (error) {
      if (error instanceof Error) {
        logError(error, {
          type: 'Client Error',
          action: 'triggerClientError',
          component: 'ErrorTrigger',
        }).catch(console.error)
      }
      throw error // Re-throw to trigger error boundary
    }
  }

  const triggerAsyncError = async () => {
    try {
      const response = await fetch('/api/test-error')
      const data = await response.json()
      console.log('Error logged with ID:', data.errorId)
    } catch (error) {
      if (error instanceof Error) {
        logError(error, {
          action: 'triggerAsyncError',
          component: 'ErrorTrigger'
        })
      }
      throw error
    }
  }

  const triggerStateError = () => {
    try {
      setCount(() => {
        throw new Error('State update error')
      })
    } catch (error) {
      if (error instanceof Error) {
        logError(error, {
          action: 'triggerStateError',
          component: 'ErrorTrigger',
          currentCount: count
        })
      }
      throw error
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl mb-4">Error Testing Page</h1>
      <div className="space-y-4">
        <div>
          <ErrorBoundary>
            <ErrorButton label="Trigger Client Error" onTrigger={triggerClientError} />
          </ErrorBoundary>
          <ErrorButton label="Trigger Async Error" onTrigger={triggerAsyncError} />
          <ErrorButton label="Trigger State Error" onTrigger={triggerStateError} />
        </div>
        <div>
          <p>Counter: {count}</p>
          <button 
            onClick={() => setCount(c => c + 1)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Increment
          </button>
        </div>
      </div>
    </div>
  )
}

export default function TestErrorsPage() {
  return (
    <ErrorBoundary>
      <ErrorTrigger />
    </ErrorBoundary>
  )
} 