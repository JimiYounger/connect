// src/features/carousel/types/index.ts

import { type Tables } from "@/types/supabase"

export type CarouselBanner = Tables<"carousel_banners">
export type CarouselBannerDetailed = Tables<"carousel_banners_detailed">

export type ClickBehavior = "video" | "url"

export type BannerFormData = {
  title: string
  description?: string
  fileId?: string
  orderIndex?: number
  isActive: boolean
  clickBehavior: ClickBehavior
  url?: string
  openInIframe: boolean
  vimeoVideoId?: string
  vimeoVideoTitle?: string
  startDate?: Date | null
  endDate?: Date | null
  roles: string[]
}

export type VimeoVideo = {
  id: string
  title: string
  description: string
  thumbnail_url: string
  duration: number
} 