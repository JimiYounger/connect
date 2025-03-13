// src/features/auth/components/LoginButton.tsx
'use client'

import { useState } from 'react'
import { useAuth } from '../context/auth-context'
import { Button } from '@/components/ui/button'

interface LoginButtonProps {
  className?: string
  children?: React.ReactNode
}

export function LoginButton({ className, children }: LoginButtonProps) {
  const { signIn } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const handleSignIn = async () => {
    try {
      setIsLoading(true)
      // Store a flag in sessionStorage to indicate we're in the auth flow
      // This can help with detecting auth flow state on page loads
      sessionStorage.setItem('auth_flow_started', Date.now().toString())
      await signIn()
    } catch (error) {
      console.error('Login error:', error)
      setIsLoading(false)
      // Clear the auth flow flag if there's an error
      sessionStorage.removeItem('auth_flow_started')
    }
  }

  return (
    <Button
      onClick={handleSignIn}
      className={className}
      disabled={isLoading}
    >
      {isLoading ? (
        <span className="flex items-center">
          <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Signing in...
        </span>
      ) : (
        children || 'Sign in with Google'
      )}
    </Button>
  )
} 