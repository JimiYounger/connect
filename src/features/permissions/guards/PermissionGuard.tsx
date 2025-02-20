// src/features/permissions/guards/PermissionGuard.tsx

'use client'

import { usePermissions } from '../hooks/usePermissions'
import type { PermissionAction } from '../types'
import { redirect } from 'next/navigation'
import { useProfile } from '@/features/users/hooks/useProfile'
import { useAuth } from '@/features/auth/context/auth-context'

interface PermissionGuardProps {
  children: React.ReactNode
  action: PermissionAction
  context?: {
    team?: string
    area?: string
    region?: string
  }
  fallback?: React.ReactNode
  redirectTo?: string
}

export function PermissionGuard({
  children,
  action,
  context,
  fallback,
  redirectTo
}: PermissionGuardProps) {
  const { session } = useAuth()
  const { profile, isLoading: profileLoading } = useProfile(session)
  const { can, isLoading: permissionsLoading } = usePermissions(profile)

  if (profileLoading || permissionsLoading) {
    return <div>Loading...</div> // You might want to replace this with a proper loading component
  }

  const hasPermission = can(action, context)

  if (!hasPermission) {
    if (redirectTo) {
      redirect(redirectTo)
    }
    return fallback || <div>Access Denied</div>
  }

  return <>{children}</>
} 