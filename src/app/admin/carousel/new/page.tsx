// src/app/admin/carousel/new/page.tsx

'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from "@/features/auth/context/auth-context"
import { useProfile } from "@/features/users/hooks/useProfile"
import { BannerForm } from '@/features/carousel/components/BannerForm'
import { hasPermissionLevel } from "@/features/permissions/constants/roles"
import { usePermissions } from "@/features/permissions/hooks/usePermissions"

export default function NewBannerPage() {
  const router = useRouter()
  const { session, loading } = useAuth()
  const { profile } = useProfile(session)
  const { userPermissions } = usePermissions(profile)

  // Only show loading state during initial auth check
  if (loading.initializing) {
    return (
      <div className="container py-6">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  // Check if we have a session
  if (!session) {
    return (
      <div className="container py-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p>Please sign in to access this page</p>
        </div>
      </div>
    )
  }

  // Wait for profile and permissions before checking access
  if (!profile || !userPermissions) {
    return (
      <div className="container py-6">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4">Loading user data...</p>
          </div>
        </div>
      </div>
    )
  }

  // Check permissions
  if (!hasPermissionLevel('Admin', userPermissions.roleType)) {
    return (
      <div className="container py-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Unauthorized</h2>
          <p>You don't have permission to access this page</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">Create New Banner</h1>
      <BannerForm 
        mode="create"
        onSuccess={() => router.push('/admin/carousel')}
      />
    </div>
  )
} 