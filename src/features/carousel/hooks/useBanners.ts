// src/features/carousel/hooks/useBanners.ts

'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/features/auth/context/auth-context'
import { useProfile } from '@/features/users/hooks/useProfile'
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'
import type { Tables } from '@/types/supabase'

type Banner = Tables<'carousel_banners_detailed'>

export function useBanners() {
  const { session, isAuthenticated } = useAuth()
  const { profile } = useProfile(session)
  const [banners, setBanners] = useState<Banner[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchBanners = async () => {
    if (!session) return

    try {
      const supabase = createBrowserClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const { data, error } = await supabase
        .from('carousel_banners_detailed')
        .select('*')
        .order('order_index', { ascending: true })

      if (error) throw error
      setBanners(data || [])
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch banners'))
    } finally {
      setIsLoading(false)
    }
  }

  const updateBannerOrder = async (updatedBanners: Banner[]) => {
    if (!session) return

    // Optimistic update
    setBanners(updatedBanners)

    try {
      const supabase = createBrowserClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      for (const banner of updatedBanners) {
        const { error } = await supabase
          .from('carousel_banners')
          .update({ order_index: banner.order_index })
          .eq('id', banner.id)

        if (error) throw error
      }
    } catch (err) {
      // Revert on error
      await fetchBanners()
      throw err
    }
  }

  const toggleBannerActive = async (bannerId: string) => {
    if (!session) return

    const banner = banners.find(b => b.id === bannerId)
    if (!banner) return

    // Optimistic update
    setBanners(currentBanners => 
      currentBanners.map(b => 
        b.id === bannerId ? { ...b, is_active: !b.is_active } : b
      )
    )

    try {
      const supabase = createBrowserClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const { error } = await supabase
        .from('carousel_banners')
        .update({ is_active: !banner.is_active })
        .eq('id', bannerId)

      if (error) throw error
    } catch (err) {
      // Revert on error
      await fetchBanners()
      throw err
    }
  }

  const deleteBanner = async (bannerId: string) => {
    if (!session) return

    // Optimistic update
    setBanners(currentBanners => currentBanners.filter(b => b.id !== bannerId))

    try {
      const supabase = createBrowserClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const { error } = await supabase
        .from('carousel_banners')
        .delete()
        .eq('id', bannerId)

      if (error) throw error
    } catch (err) {
      // Revert on error
      await fetchBanners()
      throw err
    }
  }

  useEffect(() => {
    fetchBanners()
  }, [session])

  return {
    banners,
    isLoading,
    error,
    updateBannerOrder,
    toggleBannerActive,
    deleteBanner,
    refetch: fetchBanners
  }
}