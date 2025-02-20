// src/features/auth/components/AuthGuard.tsx

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useAuth } from '../context/auth-context'
import { useProfile } from '@/features/users/hooks/useProfile'

interface AuthGuardProps {
  children: React.ReactNode
  redirectTo?: string
  allowedRoles?: string[]
  loadingComponent?: React.ReactNode
}

export function AuthGuard({ 
  children, 
  redirectTo = '/login',
  allowedRoles = [],
  loadingComponent = <div>Loading...</div>
}: AuthGuardProps) {
  const { 
    session,
    loading,
    isAuthenticated
  } = useAuth()
  const { profile, isLoading: profileLoading } = useProfile(session)
  const router = useRouter()
  
  useEffect(() => {
    // Don't perform any redirects while still initializing
    if (loading.initializing) {
      return
    }

    // Handle unauthenticated users
    if (!loading.session && !isAuthenticated) {
      router.push(redirectTo)
      return
    }

    // Check role access only when we have all necessary data
    if (!loading.session && !profileLoading && profile) {
      const hasInvalidRole = 
        allowedRoles.length > 0 && 
        profile.role_type &&
        !allowedRoles.includes(profile.role_type)

      if (hasInvalidRole) {
        router.push('/unauthorized')
      }
    }
  }, [
    isAuthenticated,
    profile,
    profileLoading,
    loading.session,
    loading.initializing,
    router,
    redirectTo,
    allowedRoles
  ])

  // Show loading state while any critical data is being fetched
  if (loading.initializing || loading.session || 
      (isAuthenticated && profileLoading)) {
    return <>{loadingComponent}</>
  }

  // Don't render anything if not authenticated
  if (!isAuthenticated) {
    return null
  }

  // Don't render if we need role validation but profile isn't loaded yet
  if (allowedRoles.length > 0 && !profile) {
    return null
  }

  // Check role access
  const hasValidRole = 
    allowedRoles.length === 0 || 
    (profile?.role_type && 
     allowedRoles.includes(profile.role_type))

  if (!hasValidRole) {
    return null
  }

  return <>{children}</>
} 