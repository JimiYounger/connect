// my-app/src/features/navigation/hooks/useNavigation.ts

import { useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { UseQueryResult } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/context/auth-context'
import type {
  NavigationMenuUpdate,
  NavigationItemUpdate,
  NavigationItemRoleInsert,
  NavigationItemWithChildren,
  NavigationMenuWithItems,
  NavigationItemForDisplay
} from '../types'
import * as navigationService from '../services/navigation-service'

// Query keys for React Query
const QUERY_KEYS = {
  navigationMenus: ['navigation-menus'],
  navigationMenu: (id: string) => ['navigation-menu', id],
  navigationItems: (menuId?: string) => ['navigation-items', menuId],
  navigationItem: (id: string) => ['navigation-item', id],
  userNavigation: (userId: string) => ['user-navigation', userId],
}

export function useNavigation() {
  const queryClient = useQueryClient()
  const { session, profile: userProfile } = useAuth()

  // Process dynamic URLs with user data
  const processUrl = useCallback((url: string): string => {
    if (!url || !userProfile || !session?.user) return url

    const variables: Record<string, string> = {
      userId: session.user.id ?? '',
      userEmail: session.user.email ?? '',
      roleType: userProfile.role_type ?? '',
      team: userProfile.team ?? '',
      area: userProfile.area ?? '',
      region: userProfile.region ?? '',
    }

    return url.replace(/\${(\w+)}/g, (_, key) => variables[key] || '')
  }, [session, userProfile])

  // Process navigation item for display
  const processNavigationItem = useCallback((
    item: NavigationItemWithChildren,
    userProfile: any
  ): NavigationItemForDisplay => {
    return {
      id: item.id,
      title: item.title,
      processedUrl: processUrl(item.url),
      description: item.description ?? undefined,
      isExternal: item.is_external ?? false,
      openInIframe: item.open_in_iframe ?? false,
      orderIndex: item.order_index,
      isActive: item.is_active ?? false,
      isPublic: item.is_public ?? false,
      children: item.children?.map(child => processNavigationItem(child, userProfile)) ?? [],
      roles: item.roles?.map(role => ({
        roleType: role.role_type,
        team: role.team ?? undefined,
        area: role.area ?? undefined,
        region: role.region ?? undefined
      })),
      metadata: {
        startDate: item.start_date ?? undefined,
        endDate: item.end_date ?? undefined,
        createdAt: item.created_at ?? undefined,
        updatedAt: item.updated_at ?? undefined,
        createdBy: item.created_by ?? undefined
      }
    }
  }, [processUrl])

  // Queries
  const {
    data: menus,
    isLoading: isLoadingMenus,
    error: menusError
  } = useQuery({
    queryKey: QUERY_KEYS.navigationMenus,
    queryFn: navigationService.getNavigationMenus,
    enabled: !!session
  })

  // Get navigation for current user
  const {
    data: userNavigation,
    isLoading: isLoadingUserNav,
    error: userNavError
  } = useQuery({
    queryKey: QUERY_KEYS.userNavigation(session?.user?.id ?? ''),
    queryFn: () => navigationService.getUserNavigation(
      session?.user?.id ?? '',
      userProfile?.role_type ?? '',
      userProfile?.team ?? undefined,
      userProfile?.area ?? undefined,
      userProfile?.region ?? undefined
    ),
    enabled: !!(session?.user?.id && userProfile?.role_type),
    select: useCallback((items: NavigationItemWithChildren[]): NavigationItemForDisplay[] => {
      return items.map(item => processNavigationItem(item, userProfile))
    }, [processNavigationItem, userProfile])
  })

  // Log navigation item click
  const logNavigationClick = useCallback(async (itemId: string) => {
    if (!session?.user?.id) return

    try {
      await navigationService.getUserNavigation(
        session.user.id,
        'CLICK',
        itemId,
        undefined,
        undefined
      )
    } catch (error) {
      console.error('Failed to log navigation click:', error)
    }
  }, [session])

  // Custom hooks for specific queries
  const useNavigationMenu = (id: string): UseQueryResult<NavigationMenuWithItems | null> => {
    return useQuery({
      queryKey: QUERY_KEYS.navigationMenu(id),
      queryFn: () => navigationService.getNavigationMenuById(id),
      enabled: !!id
    })
  }

  const useNavigationItems = (menuId?: string): UseQueryResult<NavigationItemWithChildren[]> => {
    return useQuery({
      queryKey: QUERY_KEYS.navigationItems(menuId),
      queryFn: () => navigationService.getNavigationItems(menuId),
      enabled: !!session
    })
  }

  // Mutations
  const createMenuMutation = useMutation({
    mutationFn: navigationService.createNavigationMenu,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.navigationMenus })
    }
  })

  const updateMenuMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: NavigationMenuUpdate }) =>
      navigationService.updateNavigationMenu(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.navigationMenus })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.navigationMenu(id) })
    }
  })

  const deleteMenuMutation = useMutation({
    mutationFn: navigationService.deleteNavigationMenu,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.navigationMenus })
    }
  })

  const createItemMutation = useMutation({
    mutationFn: navigationService.createNavigationItem,
    onSuccess: (data) => {
      if (data.menu_id) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.navigationItems(data.menu_id) })
      }
    }
  })

  const updateItemMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: NavigationItemUpdate }) =>
      navigationService.updateNavigationItem(id, data),
    onSuccess: (data) => {
      if (data.menu_id) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.navigationItems(data.menu_id) })
      }
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.navigationItem(data.id) })
    }
  })

  const deleteItemMutation = useMutation({
    mutationFn: navigationService.deleteNavigationItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.navigationItems() })
    }
  })

  const assignRoleMutation = useMutation({
    mutationFn: ({ itemId, roleData }: { itemId: string; roleData: NavigationItemRoleInsert }) =>
      navigationService.assignRoleToItem(itemId, roleData),
    onSuccess: (_, { itemId }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.navigationItem(itemId) })
    }
  })

  const removeRoleMutation = useMutation({
    mutationFn: navigationService.removeRoleFromItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.navigationItems() })
    }
  })

  return {
    // Queries
    menus,
    isLoadingMenus,
    menusError,
    userNavigation,
    isLoadingUserNav,
    userNavError,

    // Mutations
    createMenu: createMenuMutation.mutateAsync,
    updateMenu: updateMenuMutation.mutateAsync,
    deleteMenu: deleteMenuMutation.mutateAsync,
    createItem: createItemMutation.mutateAsync,
    updateItem: updateItemMutation.mutateAsync,
    deleteItem: deleteItemMutation.mutateAsync,
    assignRole: assignRoleMutation.mutateAsync,
    removeRole: removeRoleMutation.mutateAsync,

    // Custom hooks
    useNavigationMenu,
    useNavigationItems,

    // Utility functions
    processUrl,
    logNavigationClick,
  }
} 