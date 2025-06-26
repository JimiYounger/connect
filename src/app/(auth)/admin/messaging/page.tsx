'use client'

import { AuthGuard } from '@/features/auth/components/AuthGuard'
import { MessageDashboard } from '@/features/messaging/components/admin/MessageDashboard'
import { usePermissions } from '@/features/permissions/hooks/usePermissions'
import { useProfile } from '@/features/users/hooks/useProfile'
import { useAuth } from '@/features/auth/context/auth-context'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

export default function MessagingPage() {
  const { session } = useAuth()
  const { profile } = useProfile(session)
  const { can } = usePermissions(profile)

  // Check permissions
  const hasPermission = can('manage_users')

  return (
    <AuthGuard>
      <div className="flex flex-col min-h-screen">
        {!hasPermission ? (
          <div className="flex items-center justify-center min-h-screen">
            <p className="text-muted-foreground">You don&apos;t have permission to access this page</p>
          </div>
        ) : (
          <Suspense fallback={<div className="p-4"><Skeleton className="h-[600px] w-full" /></div>}>
            <MessageDashboard />
          </Suspense>
        )}
      </div>
    </AuthGuard>
  )
} 