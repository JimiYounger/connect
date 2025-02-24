// src/features/auth/components/LogoutButton.tsx

'use client'

import { useAuth } from '../context/auth-context'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface LogoutButtonProps {
  className?: string
  children?: React.ReactNode
  redirectTo?: string
}

export function LogoutButton({ 
  className = '', 
  children,
  redirectTo = '/'
}: LogoutButtonProps) {
  const { signOut, loading } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await signOut()
      router.push(redirectTo)
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <Button
      onClick={handleLogout}
      disabled={loading.any}
      className={className}
    >
      {children || 'Sign out'}
    </Button>
  )
} 