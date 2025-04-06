'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/features/auth/context/auth-context'
import { useProfile } from '@/features/users/hooks/useProfile'
import { usePermissions } from '@/features/permissions/hooks/usePermissions'
import { Loader2 } from 'lucide-react'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { session, loading, signOut } = useAuth()
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
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Link href="/admin" className="flex items-center gap-2">
              <Image src="/connect.png" alt="Connect Logo" width={32} height={32} />
              <span className="font-semibold text-lg">Connect Admin</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <nav className="hidden md:flex">
              <ul className="flex space-x-4">
                <li>
                  <Link href="/admin/dashboards" className="text-sm text-gray-700 hover:text-gray-900">Dashboards</Link>
                </li>
                <li>
                  <Link href="/admin/widgets" className="text-sm text-gray-700 hover:text-gray-900">Widgets</Link>
                </li>
                <li>
                  <Link href="/admin/navigation" className="text-sm text-gray-700 hover:text-gray-900">Navigation</Link>
                </li>
                <li>
                  <Link href="/admin/messaging" className="text-sm text-gray-700 hover:text-gray-900">Messaging</Link>
                </li>
                <li>
                  <Link href="/admin/carousel" className="text-sm text-gray-700 hover:text-gray-900">Carousel</Link>
                </li>
              </ul>
            </nav>
            <button 
              onClick={() => signOut()}
              className="px-3 py-1.5 rounded-md border border-gray-300 bg-white text-sm text-gray-700 hover:bg-gray-50"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}