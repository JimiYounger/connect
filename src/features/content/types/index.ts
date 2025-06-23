// src/features/content/types/index.ts

import { z } from "zod"
import type { Tables } from "@/types/supabase"

export type CarouselBanner = Tables<"carousel_banners_detailed">
export type CarouselBannerDetailed = Tables<"carousel_banners_detailed">

// Navigation types
export type NavigationItem = Tables<"navigation_items">

// Dashboard types  
export type Dashboard = Tables<"dashboards"> & {
  widgets?: DashboardWidget[]
}

export type DashboardWidget = Tables<"widgets"> & {
  placement?: {
    layout_type?: string
    [key: string]: any
  }
  config?: {
    [key: string]: any
  }
  shape?: import('@/features/widgets/types').WidgetShape
  size_ratio?: import('@/features/widgets/types').WidgetSizeRatio
}

// Content state interface for the useUserContent hook
export interface ContentState {
  carouselBanners: CarouselBanner[]
  navigationItems: NavigationItem[]
  dashboard: Dashboard | null
  loading: {
    carousel: boolean
    navigation: boolean
    dashboard: boolean
  }
  errors: Array<{
    code: string
    message: string
    source: 'carousel' | 'navigation' | 'dashboard'
  }>
  isInitialized: boolean
}

export interface RoleAssignments {
  roleTypes: string[];
  teams: string[];
  areas: string[];
  regions: string[];
}

export const bannerFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
  clickBehavior: z.enum(["url", "video"], {
    required_error: "Please select a click behavior",
  }),
  url: z.string().nullable().optional()
    .refine((val) => {
      if (!val) return true
      try {
        new URL(val)
        return true
      } catch {
        return false
      }
    }, "Please enter a valid URL"),
  openInIframe: z.boolean().default(false),
  videoId: z.string().nullable().optional(),
  videoTitle: z.string().nullable().optional(),
  fileId: z.string().min(1, "Banner image is required"),
  startDate: z.date().nullable().optional(),
  endDate: z.date().nullable().optional(),
  roleAssignments: z.object({
    roleTypes: z.array(z.string()).default([]),
    teams: z.array(z.string()).default([]),
    areas: z.array(z.string()).default([]),
    regions: z.array(z.string()).default([]),
  }).default({
    roleTypes: [],
    teams: [],
    areas: [],
    regions: []
  }),
  orderIndex: z.number().optional(),
})

export type BannerFormData = z.infer<typeof bannerFormSchema>

export interface BannerFormDataWithId extends BannerFormData {
  id: string
}

export type RoleType = string

export interface CarouselBannerRole {
  id: string
  banner_id: string
  role_type: string
  created_at: string
}
