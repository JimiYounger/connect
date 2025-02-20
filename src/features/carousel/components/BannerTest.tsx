// src/features/carousel/components/BannerTest.tsx

'use client'

import { useEffect, useRef } from 'react'
import { useBanners } from '../hooks/useBanners'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/context/auth-context'
import { useProfile } from '@/features/users/hooks/useProfile'
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'

export function BannerTest() {
  const { session, isAuthenticated } = useAuth()
  const { profile } = useProfile(session)
  const { banners, isLoading, error, refetch } = useBanners()
  const initialized = useRef(false)
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    if (!initialized.current && session) {
      initialized.current = true
      refetch().catch(console.error)
    }
  }, [session, refetch])

  const handleCreateTest = async () => {
    try {
      const { error } = await supabase
        .from('carousel_banners')
        .insert({
          title: "Test Banner",
          description: "This is a test banner",
          is_active: true,
          click_behavior: "url",
          url: "https://example.com",
          open_in_iframe: false,
          order_index: banners.length + 1,
          file_id: null,
        })

      if (error) throw error

      // Insert role assignments if needed
      await supabase
        .from('carousel_banner_roles')
        .insert({ role_type: "setter" })

      await refetch()
    } catch (err) {
      console.error("Failed to create banner:", err)
    }
  }

  const handleUpdateTest = async () => {
    if (banners.length === 0) return
    try {
      const { error } = await supabase
        .from('carousel_banners')
        .update({
          title: "Updated Banner",
          description: "This banner was updated"
        })
        .eq('id', banners[0].id!)

      if (error) throw error
      await refetch()
    } catch (err) {
      console.error("Failed to update banner:", err)
    }
  }

  const handleDeleteTest = async () => {
    if (banners.length === 0) return
    try {
      const { error } = await supabase
        .from('carousel_banners')
        .delete()
        .eq('id', banners[0].id!)

      if (error) throw error
      await refetch()
    } catch (err) {
      console.error("Failed to delete banner:", err)
    }
  }

  if (!isAuthenticated || !profile) return <div>Please log in to manage banners</div>
  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div className="space-y-4">
      <div className="space-x-4">
        <Button onClick={handleCreateTest}>Create Test Banner</Button>
        <Button onClick={handleUpdateTest}>Update First Banner</Button>
        <Button onClick={handleDeleteTest}>Delete First Banner</Button>
      </div>

      <div className="p-4 bg-gray-100 rounded-lg overflow-auto">
        <h3 className="font-semibold mb-2">Current Banners:</h3>
        {banners.map((banner, index) => (
          <div key={banner.id} className="mb-2 p-2 bg-white rounded">
            <strong>{index + 1}. {banner.title}</strong>
            <p className="text-sm text-gray-600">{banner.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
} 