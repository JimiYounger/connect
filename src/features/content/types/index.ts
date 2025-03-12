// my-app/src/features/content/types/index.ts
import type { Json } from '@/types/supabase'
import type { Widget, WidgetConfigData, PublishedWidgetPlacement } from '@/features/widgets/types'

export interface CarouselBanner {
  banner_url: string | null
  click_behavior: string | null
  created_at: string | null
  description: string | null
  end_date: string | null
  file_id: string | null
  id: string | null
  is_active: boolean | null
  is_currently_active: boolean | null
  open_in_iframe: boolean | null
  order_index: number | null
  original_filename: string | null
  role_count: number | null
  role_details: Json | null
  role_ids: string[] | null
  start_date: string | null
  title: string | null
  updated_at: string | null
  url: string | null
  vimeo_video_id: string | null
  vimeo_video_title: string | null
  visible_to_roles: string | null
}

export interface NavigationItem {
  id: string
  menu_id: string
  parent_id: string
  title: string
  url: string
  description: string
  dynamic_variables: Json
  is_external: boolean
  open_in_iframe: boolean
  order_index: number
  is_active: boolean
  is_public: boolean
  start_date: string
  end_date: string
  created_at: string
  updated_at: string
  created_by: string
  is_currently_active: boolean
  visible_to_roles: string
  role_ids: string[]
  role_details: Json
  depth: number
  path: string[]
}

// Updated to match widget types structure
export interface DashboardWidget extends Widget {
  config?: WidgetConfigData
  placement?: Omit<PublishedWidgetPlacement, 'widget'> // Use the placement type but exclude the widget property to avoid circular reference
}

export interface Dashboard {
  id: string
  name: string
  description: string
  role_type: string
  version_id: string
  version_number: number
  version_name: string
  widgets: DashboardWidget[]
}

export interface ContentError {
  code: string
  message: string
  details?: unknown
  source: 'carousel' | 'navigation' | 'dashboard'
}

export interface LoadingState {
  carousel: boolean
  navigation: boolean
  dashboard: boolean
}

export interface ContentState {
  carouselBanners: CarouselBanner[] | null
  navigationItems: NavigationItem[] | null
  dashboard: Dashboard | null
  loading: LoadingState
  errors: ContentError[]
  isInitialized: boolean
}

export const initialContentState: ContentState = {
  carouselBanners: null,
  navigationItems: null,
  dashboard: null,
  loading: {
    carousel: false,
    navigation: false,
    dashboard: false
  },
  errors: [],
  isInitialized: false
}