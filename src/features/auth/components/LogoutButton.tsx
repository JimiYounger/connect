// src/features/auth/components/LogoutButton.tsx

import { useAuth } from '../context/auth-context'
import { useRouter } from 'next/navigation'
import { ErrorLogger } from '@/lib/logging/error-logger'
import { ErrorSeverity, ErrorSource } from '@/lib/types/errors'

interface LogoutButtonProps {
  className?: string
  children?: React.ReactNode
  redirectTo?: string
}

export function LogoutButton({ 
  className = '', 
  children,
  redirectTo = '/login'
}: LogoutButtonProps) {
  const { signOut, loading } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      // Remove activity logging for logout_initiated
      await signOut()
      // Remove activity logging for successful logout
      router.push(redirectTo)
    } catch (error) {
      // Keep error logging
      await ErrorLogger.log(
        error,
        {
          severity: ErrorSeverity.HIGH,
          source: ErrorSource.CLIENT,
          context: { 
            redirectTo,
            error: error instanceof Error ? error.message : String(error)
          }
        }
      )

      // Remove activity logging for failed logout attempt
      console.error('Logout failed:', error)
      // You might want to add error handling UI here
    }
  }

  const isLoading = loading.initializing || loading.session || loading.profile

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className={className}
    >
      {children || 'Sign out'}
    </button>
  )
} 