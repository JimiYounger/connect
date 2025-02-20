// src/features/permissions/hooks/usePermissions.ts

'use client'

import { useCallback, useMemo, useRef } from 'react'
import { useAuth } from '@/features/auth/context/auth-context'
import { useProfile } from '@/features/users/hooks/useProfile'
import { checkPermission } from '../utils/checkPermissions'
import { ErrorLogger } from '@/lib/logging/error-logger'
import { ErrorSeverity, ErrorSource } from '@/lib/types/errors'
import type { UserProfile } from '@/features/users/types'
import type { PermissionAction, UserPermissions, RoleType } from '../types'

export function usePermissions(profile: UserProfile | null) {
  const { session } = useAuth()
  const lastCheckRef = useRef<{
    action: PermissionAction
    context?: Record<string, string>
    result: boolean
  } | null>(null)

  const userPermissions = useMemo<UserPermissions | null>(() => {
    if (!profile) return null

    return {
      roleType: profile.role_type as RoleType,
      role: profile.role || '', 
      team: profile.team || undefined,
      area: profile.area || undefined,
      region: profile.region || undefined
    }
  }, [profile])

  const can = useCallback(async (
    action: PermissionAction,
    context?: {
      team?: string
      area?: string
      region?: string
    }
  ): Promise<boolean> => {
    if (!userPermissions) {
      await ErrorLogger.log(
        new Error('Permission check attempted without user permissions'),
        {
          severity: ErrorSeverity.HIGH,
          source: ErrorSource.CLIENT,
          context: { action, checkContext: context }
        }
      )
      return false
    }

    // Check cache for identical permission check
    const lastCheck = lastCheckRef.current
    if (
      lastCheck && 
      lastCheck.action === action && 
      JSON.stringify(lastCheck.context) === JSON.stringify(context)
    ) {
      return lastCheck.result
    }

    // Perform permission check
    const result = checkPermission(userPermissions, action, context)
    lastCheckRef.current = {
      action,
      context,
      result
    }

    // Remove activity logging for failed permission checks
    if (!result && (action.startsWith('admin:') || action.startsWith('system:'))) {
      await ErrorLogger.log(
        new Error(`Unauthorized access attempt: ${action}`),
        {
          severity: ErrorSeverity.HIGH,
          source: ErrorSource.CLIENT,
          context: {
            action,
            checkContext: context,
            userPermissions,
            userId: session?.user?.id
          }
        }
      )
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('[Permissions] Check:', {
        action,
        context,
        result,
        userPermissions
      })
    }

    return result
  }, [userPermissions, session])

  return {
    can,
    isLoading: false,
    error: null,
    userPermissions
  }
} 