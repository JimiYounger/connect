// my-app/src/features/content/services/content-service.ts
import { createBrowserClient } from '@supabase/ssr'
import type { UserProfile } from '@/features/users/types'
import type { 
  CarouselBanner, 
  NavigationItem, 
  Dashboard,
  DashboardWidget
} from '../types'
import type { Database } from '@/types/supabase'
import { ErrorLogger } from '@/lib/logging/error-logger'
import { ErrorSeverity, ErrorSource } from '@/lib/types/errors'
import { WidgetShape, VALID_WIDGET_RATIOS, type WidgetSizeRatio } from '@/features/widgets/types'

const supabase = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

class ContentService {
  async getUserCarouselBanners(profile: UserProfile): Promise<CarouselBanner[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_user_carousel_banners', {
          user_role_type: profile.role_type || '',
          user_team: profile.team || '',
          user_area: profile.area || '',
          user_region: profile.region || ''
        })

      if (error) throw error
      return Array.isArray(data) ? data : []
    } catch (error) {
      ErrorLogger.log(error, {
        severity: ErrorSeverity.MEDIUM,
        source: ErrorSource.CLIENT,
        context: {
          userId: profile.id,
          action: 'Get User Carousel Banners'
        }
      })
      throw error
    }
  }

  async getUserNavigationItems(profile: UserProfile): Promise<NavigationItem[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_user_navigation_items', {
          user_role_type: profile.role_type || '',
          user_team: profile.team || '',
          user_area: profile.area || '',
          user_region: profile.region || ''
        })

      if (error) throw error
      return Array.isArray(data) ? data : []
    } catch (error) {
      ErrorLogger.log(error, {
        severity: ErrorSeverity.MEDIUM,
        source: ErrorSource.CLIENT,
        context: {
          userId: profile.id,
          action: 'Get User Navigation Items'
        }
      })
      throw error
    }
  }

  async getUserDashboard(profile: UserProfile): Promise<Dashboard[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_user_dashboard', {
          user_role_type: profile.role_type || ''
        })

      if (error) throw error

      // Transform the widgets to ensure they match the expected types
      if (data && Array.isArray(data)) {
        return data.map(dashboard => ({
          ...dashboard,
          widgets: Array.isArray(dashboard.widgets) 
            ? this.transformWidgets(dashboard.widgets)
            : []
        }))
      }

      return []
    } catch (error) {
      ErrorLogger.log(error, {
        severity: ErrorSeverity.MEDIUM,
        source: ErrorSource.CLIENT,
        context: {
          userId: profile.id,
          action: 'Get User Dashboard'
        }
      })
      throw error
    }
  }

  private transformWidgets(widgets: unknown[]): DashboardWidget[] {
    if (!Array.isArray(widgets)) return []

    return widgets
      .filter((widget): widget is Record<string, unknown> => {
        if (!widget || typeof widget !== 'object') return false
        const w = widget as Record<string, unknown>
        return 'widget_type' in w && 
               'shape' in w && 
               'size_ratio' in w
      })
      .map(widget => {
        // Validate and transform shape
        const shape = this.validateWidgetShape(widget.shape)
        if (!shape) {
          ErrorLogger.log(new Error(`Invalid widget shape: ${widget.shape}`), {
            severity: ErrorSeverity.LOW,
            source: ErrorSource.CLIENT,
            context: { widget }
          })
          return null
        }

        // Validate and transform size ratio
        const sizeRatio = this.validateWidgetSizeRatio(widget.size_ratio)
        if (!sizeRatio) {
          ErrorLogger.log(new Error(`Invalid widget size ratio: ${widget.size_ratio}`), {
            severity: ErrorSeverity.LOW,
            source: ErrorSource.CLIENT,
            context: { widget }
          })
          return null
        }

        // Transform placement and config properties to match our interface
        const { placement, config, ...rest } = widget as Record<string, any>
        
        return {
          ...rest,
          shape,
          size_ratio: sizeRatio,
          placement: placement || undefined,
          config: config || undefined
        } as DashboardWidget
      })
      .filter((widget): widget is DashboardWidget => widget !== null)
  }

  private validateWidgetShape(shape: unknown): WidgetShape | null {
    if (typeof shape !== 'string') return null
    return Object.values(WidgetShape).includes(shape as WidgetShape) 
      ? shape as WidgetShape 
      : null
  }

  private validateWidgetSizeRatio(ratio: unknown): WidgetSizeRatio | null {
    if (typeof ratio !== 'string') return null
    
    // Check if the ratio is in our predefined list
    if (VALID_WIDGET_RATIOS.includes(ratio as WidgetSizeRatio)) {
      return ratio as WidgetSizeRatio;
    }
    
    // Handle the case for '4:1' ratio specifically
    if (ratio === '4:1') {
      console.warn('Using non-standard widget ratio: 4:1');
      return ratio as WidgetSizeRatio;
    }
    
    return null;
  }
}

export const contentService = new ContentService()