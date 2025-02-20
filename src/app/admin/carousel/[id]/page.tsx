// src/app/admin/carousel/[id]/page.tsx

'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { useAuth } from "@/features/auth/context/auth-context"
import { useProfile } from "@/features/users/hooks/useProfile"
import { usePermissions } from "@/features/permissions/hooks/usePermissions"
import { hasPermissionLevel } from "@/features/permissions/constants/roles"
import { EditBannerForm } from '@/features/carousel/components/EditBannerForm'
import { LogoutButton } from "@/features/auth/components/LogoutButton"
import type { Database } from '@/types/supabase'
import type { BannerFormData } from '@/features/carousel/types'

type BannerWithRelations = Database['public']['Tables']['carousel_banners']['Row'] & {
  file: {
    id: string
    cdn_url: string
    uploadcare_uuid: string
    original_filename: string
    mime_type: string
    size: number
    created_at?: string
    user_id?: string | null
  } | null
  roles: Array<{ role_type: string }> | null
}

export default function EditBannerPage() {
  const params = useParams()
  const router = useRouter()
  const { session, isAuthenticated, loading } = useAuth()
  const { profile, isLoading: profileLoading } = useProfile(session)
  const { userPermissions, isLoading: permissionsLoading } = usePermissions(profile)
  const [banner, setBanner] = useState<BannerWithRelations | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchBanner() {
      if (!session || !params.id) return

      try {
        const supabase = createBrowserClient<Database>(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        
        const { data, error: fetchError } = await supabase
          .from('carousel_banners')
          .select(`
            *,
            file:files(
              id,
              cdn_url,
              uploadcare_uuid,
              original_filename,
              mime_type,
              size,
              created_at,
              user_id
            ),
            roles:carousel_banner_roles(
              role_type
            )
          `)
          .eq('id', params.id)
          .single()

        if (fetchError) throw fetchError
        setBanner(data)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch banner'))
      } finally {
        setIsLoading(false)
      }
    }

    fetchBanner()
  }, [params.id, session])

  // Loading states
  if (loading.initializing || loading.session || profileLoading || permissionsLoading || isLoading) {
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

  // Auth check
  if (!isAuthenticated || !session) {
    router.push('/login')
    return null
  }

  // Profile and permissions check
  if (!profile || !userPermissions) {
    return (
      <div className="container py-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p>Please sign in to access this page</p>
        </div>
      </div>
    )
  }

  // Role-based permission check
  if (!hasPermissionLevel('Admin', userPermissions.roleType)) {
    return (
      <div className="container py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="mb-8">You do not have permission to access this page.</p>
          <LogoutButton />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container py-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">
            Error: {error.message}
          </p>
        </div>
      </div>
    )
  }

  if (!banner) {
    return (
      <div className="container py-6">
        <div className="bg-destructive/15 text-destructive p-4 rounded-md">
          Banner not found
        </div>
      </div>
    )
  }

  const formData: Partial<BannerFormData> & { id: string } = {
    id: banner.id,
    title: banner.title || '',
    description: banner.description || null,
    isActive: banner.is_active ?? true,
    clickBehavior: banner.click_behavior as "url" | "video",
    url: banner.url || null,
    openInIframe: banner.open_in_iframe ?? false,
    vimeoVideoId: banner.vimeo_video_id || null,
    vimeoVideoTitle: banner.vimeo_video_title || null,
    fileId: banner.file_id || undefined,
    startDate: banner.start_date ? new Date(banner.start_date) : undefined,
    endDate: banner.end_date ? new Date(banner.end_date) : undefined,
    roles: banner.roles?.map(r => r.role_type) || [],
    orderIndex: banner.order_index ?? undefined,
  }

  const fullName = profile ? `${profile.first_name} ${profile.last_name}` : ''

  return (
    <div className="container py-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">Edit Banner</h1>
          <p className="text-muted-foreground">
            Update banner details and settings
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            {fullName}
          </span>
          <LogoutButton />
        </div>
      </div>
      <EditBannerForm initialData={formData} />
    </div>
  )
}