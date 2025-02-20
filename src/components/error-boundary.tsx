'use client'

import React from 'react'
import { ErrorSource, ErrorSeverity } from '@/lib/types/errors'

interface Props {
  children?: React.ReactNode
  fallback?: React.ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo })
    
    // Log the error
    fetch('/api/log-error', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: error.message,
        name: error.name,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        source: ErrorSource.CLIENT,
        severity: ErrorSeverity.HIGH,
        context: {
          type: 'React Error Boundary',
          location: window.location.href,
          userAgent: window.navigator.userAgent,
        },
        timestamp: Date.now(),
      }),
    })
    .then(response => response.json())
    .then(data => console.log('Error logged:', data))
    .catch(console.error)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="p-6 max-w-sm mx-auto bg-white rounded-xl shadow-md space-y-4">
          <div className="text-red-600">
            <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
            <div className="text-sm space-y-2">
              <p className="font-medium">{this.state.error?.name}</p>
              <p>{this.state.error?.message}</p>
              {process.env.NODE_ENV === 'development' && (
                <pre className="mt-2 text-xs bg-gray-50 p-4 rounded overflow-auto">
                  {this.state.error?.stack}
                </pre>
              )}
            </div>
          </div>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: undefined, errorInfo: undefined })
              window.location.reload()
            }}
            className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      )
    }

    return this.props.children
  }
} 