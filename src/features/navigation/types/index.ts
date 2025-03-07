import type { Database } from '@/types/supabase'

type NavigationMenuBase = Database['public']['Tables']['navigation_menus']['Row']
type NavigationItemBase = Database['public']['Tables']['navigation_items']['Row']
type NavigationItemRoleBase = Database['public']['Tables']['navigation_item_roles']['Row']

/**
 * Base types for navigation menu database rows
 */
export interface NavigationMenuRow extends NavigationMenuBase {
  items_count?: number
  created_by_name?: string
}

export interface NavigationMenuInsert extends Partial<Omit<NavigationMenuRow, 'name'>> {
  name: string
}

export interface NavigationMenuUpdate extends Partial<NavigationMenuRow> {}

/**
 * Base types for navigation item database rows
 */
export interface NavigationItemRow extends NavigationItemBase {
  id: string
  menu_id: string | null
  parent_id: string | null
  title: string
  url: string
  description: string | null
  dynamic_variables: Database['public']['Tables']['navigation_items']['Row']['dynamic_variables'] | null
  is_external: boolean | null
  open_in_iframe: boolean | null
  order_index: number
  is_active: boolean | null
  is_public: boolean | null
  start_date: string | null
  end_date: string | null
  created_at: string | null
  updated_at: string | null
  created_by: string | null
}

export interface NavigationItemInsert extends Partial<Omit<NavigationItemRow, 'title' | 'url' | 'order_index'>> {
  title: string
  url: string
  order_index: number
}

export interface NavigationItemUpdate extends Partial<NavigationItemRow> {}

/**
 * Base types for navigation item roles database rows
 */
export interface NavigationItemRoleRow extends NavigationItemRoleBase {
  id: string
  navigation_item_id: string | null
  role_type: string
  team: string | null
  area: string | null
  region: string | null
  created_at: string | null
}

export interface NavigationItemRoleInsert extends Partial<Omit<NavigationItemRoleRow, 'role_type'>> {
  role_type: string
}

export interface NavigationItemRoleUpdate extends Partial<NavigationItemRoleRow> {}

/**
 * Extended interface for navigation items that includes child items
 */
export interface NavigationItemWithChildren extends NavigationItemRow {
  children?: NavigationItemWithChildren[]
  roles?: NavigationItemRoleRow[]
}

/**
 * Interface for a complete navigation menu including all nested items
 */
export interface NavigationMenuWithItems extends NavigationMenuRow {
  items: NavigationItemWithChildren[]
}

/**
 * Interface for navigation items formatted for frontend display
 */
export interface NavigationItemForDisplay {
  id: string
  title: string
  processedUrl: string
  description?: string | null
  isExternal: boolean
  openInIframe: boolean
  orderIndex: number
  isActive: boolean
  isPublic: boolean
  children?: NavigationItemForDisplay[]
  roles?: {
    roleType: string
    team?: string | null
    area?: string | null
    region?: string | null
  }[]
  metadata?: {
    startDate?: string
    endDate?: string
    createdAt?: string
    updatedAt?: string
    createdBy?: string
  }
}

export type NavigationAnalytics = Database['public']['Tables']['navigation_analytics']['Row'] 