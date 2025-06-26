// my-app/src/features/content/hooks/useUserContent.ts

import { useQuery } from '@tanstack/react-query'
import { contentService } from '../services/content-service'
import { useProfile } from '@/features/users/hooks/useProfile'
import type { CarouselBanner, NavigationItem, Dashboard, ContentState } from '../types'
import { ErrorLogger } from '@/lib/logging/error-logger'
import { ErrorSeverity, ErrorSource } from '@/lib/types/errors'
import { useAuth } from '@/features/auth/context/auth-context'

const STALE_TIME = 5 * 60 * 1000 // 5 minutes

/**
 * Hook to fetch user-specific carousel banners
 */
export function useUserBanners() {
  const { session } = useAuth()
  const { profile, isLoading: profileLoading } = useProfile(session)

  return useQuery<CarouselBanner[], Error>({
    queryKey: ['carousel-banners', profile?.id],
    queryFn: async (): Promise<CarouselBanner[]> => {
      if (!profile) {
        console.log('No profile available for carousel banners')
        return []
      }
      try {
        const banners = await contentService.getUserCarouselBanners(profile)
        console.log('Fetched carousel banners:', banners.length)
        return banners
      } catch (error) {
        console.error('Error fetching carousel banners:', error)
        throw error
      }
    },
    staleTime: STALE_TIME,
    enabled: !!profile && !profileLoading,
    retry: 3,
    // Add a short refetch interval to ensure data loads after profile is available
    refetchInterval: profile ? false : 1000,
    refetchIntervalInBackground: false
  })
}

/**
 * Hook to fetch user-specific navigation items
 */
export function useUserNavigation() {
  const { session } = useAuth()
  const { profile, isLoading: profileLoading } = useProfile(session)

  return useQuery<NavigationItem[], Error>({
    queryKey: ['navigation-items', profile?.id],
    queryFn: async (): Promise<NavigationItem[]> => {
      if (!profile) {
        console.log('No profile available for navigation items')
        return []
      }
      try {
        const items = await contentService.getUserNavigationItems(profile)
        console.log('Fetched navigation items:', items.length)
        return items
      } catch (error) {
        console.error('Error fetching navigation items:', error)
        throw error
      }
    },
    staleTime: STALE_TIME,
    enabled: !!profile && !profileLoading,
    retry: 3,
    // Add a short refetch interval to ensure data loads after profile is available
    refetchInterval: profile ? false : 1000,
    refetchIntervalInBackground: false
  })
}

/**
 * Hook to fetch user-specific dashboard
 */
export function useUserDashboard() {
  const { session } = useAuth()
  const { profile, isLoading: profileLoading } = useProfile(session)

  return useQuery<Dashboard | null, Error>({
    queryKey: ['user-dashboard', profile?.id],
    queryFn: async (): Promise<Dashboard | null> => {
      if (!profile) {
        console.log('No profile available for dashboard')
        return null
      }
      try {
        const dashboards = await contentService.getUserDashboard(profile)
        console.log('Fetched dashboards:', dashboards.length)
        return dashboards[0] || null
      } catch (error) {
        console.error('Error fetching dashboard:', error)
        throw error
      }
    },
    staleTime: STALE_TIME,
    enabled: !!profile && !profileLoading,
    retry: 3,
    // Add a short refetch interval to ensure data loads after profile is available
    refetchInterval: profile ? false : 1000,
    refetchIntervalInBackground: false
  })
}

/**
 * Main hook that combines all user content queries
 */
export function useUserContent(): ContentState {
  const { session } = useAuth()
  const { profile, isLoading: profileLoading } = useProfile(session)
  
  console.log('useUserContent - Auth session:', !!session)
  console.log('useUserContent - Profile:', !!profile, 'Loading:', profileLoading)
  
  const banners = useUserBanners()
  const navigation = useUserNavigation()
  const dashboard = useUserDashboard()

  const isLoading = banners.isLoading || navigation.isLoading || dashboard.isLoading || profileLoading
  const errors = [
    { error: banners.error, source: 'carousel' as const },
    { error: navigation.error, source: 'navigation' as const },
    { error: dashboard.error, source: 'dashboard' as const }
  ].filter((item): item is { error: Error; source: 'carousel' | 'navigation' | 'dashboard' } => !!item.error)

  // Log combined errors if any occur
  if (errors.length > 0) {
    ErrorLogger.log(new Error('Content fetch errors occurred'), {
      severity: ErrorSeverity.MEDIUM,
      source: ErrorSource.CLIENT,
      context: {
        userId: profile?.id,
        action: 'Fetch User Content',
        errors: errors.map(({ error, source }) => ({
          message: error?.message,
          source
        }))
      }
    })
  }

  console.log('useUserContent - Query states:', {
    banners: { isLoading: banners.isLoading, isError: !!banners.error, data: !!banners.data },
    navigation: { isLoading: navigation.isLoading, isError: !!navigation.error, data: !!navigation.data },
    dashboard: { isLoading: dashboard.isLoading, isError: !!dashboard.error, data: !!dashboard.data }
  })

  return {
    carouselBanners: banners.data ?? [],
    navigationItems: navigation.data ?? [],
    dashboard: dashboard.data ?? null,
    loading: {
      carousel: banners.isLoading || profileLoading,
      navigation: navigation.isLoading || profileLoading,
      dashboard: dashboard.isLoading || profileLoading
    },
    errors: errors.map(({ error, source }) => ({
      code: error?.name || 'UnknownError',
      message: error?.message || 'Unknown error occurred',
      source
    })),
    isInitialized: !isLoading
  }
} 