// src/features/auth/components/AuthGuard.tsx

'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useAuth } from '../context/auth-context'
import { LoadingState } from '@/components/loading-state'

interface AuthGuardProps {
  children: React.ReactNode
  redirectTo?: string
  loadingComponent?: React.ReactNode
}

export function AuthGuard({ 
  children, 
  redirectTo = '/',
  loadingComponent = <LoadingState />
}: AuthGuardProps) {
  const { loading, isAuthenticated } = useAuth()
  const router = useRouter()
  
  useEffect(() => {
    if (!loading.any && !isAuthenticated) {
      router.push(redirectTo)
    }
  }, [isAuthenticated, loading.any, router, redirectTo])

  if (loading.any) {
    return <>{loadingComponent}</>
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
} 