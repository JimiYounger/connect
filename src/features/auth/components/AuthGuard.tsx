// src/features/auth/components/AuthGuard.tsx

'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo } from 'react'
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
  
  // Memoize the loading component to prevent unnecessary re-renders
  const loadingView = useMemo(() => loadingComponent, [loadingComponent])
  
  useEffect(() => {
    let redirectTimeout: NodeJS.Timeout

    if (!loading.any && !isAuthenticated) {
      // Add a small delay to prevent flash of content
      redirectTimeout = setTimeout(() => {
        router.push(redirectTo)
      }, 100)
    }

    return () => {
      clearTimeout(redirectTimeout)
    }
  }, [isAuthenticated, loading.any, router, redirectTo])

  // Early return for loading state
  if (loading.any) {
    return <>{loadingView}</>
  }

  // Early return for unauthenticated state
  if (!isAuthenticated) {
    return null
  }

  // Render children only when authenticated and not loading
  return <>{children}</>
} 