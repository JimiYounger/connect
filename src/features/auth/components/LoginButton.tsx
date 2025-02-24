// src/features/auth/components/LoginButton.tsx
'use client'

import { useAuth } from '../context/auth-context'
import { Button } from '@/components/ui/button'

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
  const { signIn, loading } = useAuth()

  return (
    <Button
      onClick={() => signIn(redirectTo)}
      disabled={loading.any}
      className={className}
    >
      {children || 'Sign in with Google'}
    </Button>
  )
} 