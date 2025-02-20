// src/features/auth/components/LoginButton.tsx

import { useAuth } from '../context/auth-context'
import { ErrorLogger } from '@/lib/logging/error-logger'
import { ErrorSeverity, ErrorSource } from '@/lib/types/errors'

interface LoginButtonProps {
  redirectTo?: string
  className?: string
  children?: React.ReactNode
}

export function LoginButton({ 
  redirectTo, 
  className = '', 
  children 
}: LoginButtonProps) {
  const { signIn, loading, isAuthenticated } = useAuth()
  const isLoading = loading.initializing || loading.session || (isAuthenticated && loading.profile)

  const handleLogin = async () => {
    try {
      await signIn(redirectTo)

    } catch (error) {
      await ErrorLogger.log(
        error,
        {
          severity: ErrorSeverity.HIGH,
          source: ErrorSource.CLIENT,
          context: { 
            redirectTo: redirectTo || '/dashboard',
            error: error instanceof Error ? error.message : String(error)
          }
        }
      )

      console.error('Login failed:', error)
      // You might want to add error handling UI here
    }
  }

  return (
    <button
      onClick={handleLogin}
      disabled={isLoading}
      className={className}
    >
      {children || 'Sign in with Google'}
    </button>
  )
} 