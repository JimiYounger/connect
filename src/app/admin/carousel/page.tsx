// src/app/admin/carousel/page.tsx

'use client'

import { BannerList } from "@/features/carousel/components/BannerList"
import { CarouselPreview } from "@/features/carousel/components/CarouselPreview"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useAuth } from "@/features/auth/context/auth-context"
import { useProfile } from "@/features/users/hooks/useProfile"
import { usePermissions } from "@/features/permissions/hooks/usePermissions"
import { hasPermissionLevel } from "@/features/permissions/constants/roles"
import { useBanners } from "@/features/carousel/hooks/useBanners"

export default function CarouselManagementPage() {
  const { session, loading } = useAuth()
  const { profile } = useProfile(session)
  const { userPermissions } = usePermissions(profile)
  const {
    banners,
    isLoading: bannersLoading,
    error: bannersError,
    updateBannerOrder,
    toggleBannerActive,
    deleteBanner
  } = useBanners()

  // Loading states
  if (loading.initializing) {
    return (
      <div className="page-container">
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-2">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  // Auth check
  if (!session) {
    return (
      <div className="page-container">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p>Please sign in to access this page</p>
        </div>
      </div>
    )
  }

  // Profile and permissions loading
  if (!profile || !userPermissions) {
    return (
      <div className="page-container">
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-2">Loading user data...</p>
          </div>
        </div>
      </div>
    )
  }

  // Permission check
  if (!hasPermissionLevel('Admin', userPermissions.roleType)) {
    return (
      <div className="page-container">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Unauthorized</h2>
          <p>You don&apos;t have permission to access this page</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Carousel Management</h1>
        <p className="page-description">
          Manage promotional banners and videos for the homepage carousel
        </p>
      </div>
      
      <div className="flex justify-end mb-8">
        <Button asChild>
          <Link href="/admin/carousel/new">Add New Banner</Link>
        </Button>
      </div>

      <CarouselPreview 
        banners={banners} 
        profile={profile} 
        isLoading={bannersLoading}
        error={bannersError}
      />
      
      <div className="space-y-6">
        <BannerList 
          banners={banners}
          profile={profile}
          isLoading={bannersLoading}
          error={bannersError}
          onUpdateOrder={updateBannerOrder}
          onToggleActive={toggleBannerActive}
          onDelete={deleteBanner}
        />
      </div>
    </div>
  )
}