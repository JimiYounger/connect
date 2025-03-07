'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/features/auth/context/auth-context'
import { useProfile } from '@/features/users/hooks/useProfile'
import { usePermissions } from '@/features/permissions/hooks/usePermissions'
import { Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { session, loading } = useAuth()
  const { profile, isLoading: isProfileLoading } = useProfile(session)
  const { can, isLoading: isPermissionLoading } = usePermissions(profile)
  const [hasAdminAccess, setHasAdminAccess] = useState<boolean | null>(null)

  useEffect(() => {
    let isMounted = true

    if (profile && !isPermissionLoading) {
      can('admin:access' as any).then((result) => {
        if (isMounted) {
          setHasAdminAccess(result)
        }
      })
    }

    return () => {
      isMounted = false
    }
  }, [profile, isPermissionLoading, can])

  // Show loading state while initializing
  if (loading.initializing || loading.any) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  // Check if user is authenticated
  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You must be signed in to access this area.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Show loading state while checking permissions
  if (isProfileLoading || isPermissionLoading || hasAdminAccess === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  // Show unauthorized state if no admin access
  if (!hasAdminAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertTitle>Unauthorized</AlertTitle>
          <AlertDescription>
            You do not have permission to access the admin area.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Render admin content if all checks pass
  return (
    <div className="container py-6">
      <Card className="p-6">
        {children}
      </Card>
    </div>
  )
} 