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
  const { profile } = useProfile(session)

  return useQuery<CarouselBanner[], Error>({
    queryKey: ['carousel-banners', profile?.id],
    queryFn: async (): Promise<CarouselBanner[]> => {
      if (!profile) {
        return []
      }
      return contentService.getUserCarouselBanners(profile)
    },
    staleTime: STALE_TIME,
    enabled: !!profile,
    retry: false
  })
}

/**
 * Hook to fetch user-specific navigation items
 */
export function useUserNavigation() {
  const { session } = useAuth()
  const { profile } = useProfile(session)

  return useQuery<NavigationItem[], Error>({
    queryKey: ['navigation-items', profile?.id],
    queryFn: async (): Promise<NavigationItem[]> => {
      if (!profile) {
        return []
      }
      return contentService.getUserNavigationItems(profile)
    },
    staleTime: STALE_TIME,
    enabled: !!profile,
    retry: false
  })
}

/**
 * Hook to fetch user-specific dashboard
 */
export function useUserDashboard() {
  const { session } = useAuth()
  const { profile } = useProfile(session)

  return useQuery<Dashboard | null, Error>({
    queryKey: ['user-dashboard', profile?.id],
    queryFn: async (): Promise<Dashboard | null> => {
      if (!profile) {
        return null
      }
      const dashboards = await contentService.getUserDashboard(profile)
      return dashboards[0] || null
    },
    staleTime: STALE_TIME,
    enabled: !!profile,
    retry: false
  })
}

/**
 * Main hook that combines all user content queries
 */
export function useUserContent(): ContentState {
  const { session } = useAuth()
  const { profile } = useProfile(session)
  const banners = useUserBanners()
  const navigation = useUserNavigation()
  const dashboard = useUserDashboard()

  const isLoading = banners.isLoading || navigation.isLoading || dashboard.isLoading
  const errors = [
    { error: banners.error, source: 'carousel' as const },
    { error: navigation.error, source: 'navigation' as const },
    { error: dashboard.error, source: 'dashboard' as const }
  ].filter((item): item is { error: Error; source: 'carousel' | 'navigation' | 'dashboard' } => item.error !== null)

  // Log combined errors if any occur
  if (errors.length > 0) {
    ErrorLogger.log(new Error('Content fetch errors occurred'), {
      severity: ErrorSeverity.MEDIUM,
      source: ErrorSource.CLIENT,
      context: {
        userId: profile?.id,
        action: 'Fetch User Content',
        errors: errors.map(({ error, source }) => ({
          message: error.message,
          source
        }))
      }
    })
  }

  return {
    carouselBanners: banners.data ?? null,
    navigationItems: navigation.data ?? null,
    dashboard: dashboard.data ?? null,
    loading: {
      carousel: banners.isLoading,
      navigation: navigation.isLoading,
      dashboard: dashboard.isLoading
    },
    errors: errors.map(({ error, source }) => ({
      code: error.name,
      message: error.message,
      source
    })),
    isInitialized: !isLoading
  }
} 