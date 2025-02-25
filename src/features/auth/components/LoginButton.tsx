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

  const handleSignIn = async () => {
    // Add loading class to the document body
    document.body.classList.add('loading')
    
    // Store the loading state in localStorage so it persists across redirects
    localStorage.setItem('auth_loading', 'true')
    
    await signIn(redirectTo)
  }

  return (
    <Button
      onClick={handleSignIn}
      disabled={loading.any}
      className={className}
    >
      {children || 'Sign in with Google'}
    </Button>
  )
} 