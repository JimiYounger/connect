// src/features/carousel/types.ts

import { z } from "zod"
import type { Tables } from "@/types/supabase"

export type CarouselBanner = Tables<"carousel_banners">
export type CarouselBannerDetailed = Tables<"carousel_banners_detailed">

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
  vimeoVideoId: z.string().nullable().optional(),
  vimeoVideoTitle: z.string().nullable().optional(),
  fileId: z.string().min(1, "Banner image is required"),
  startDate: z.date().nullable().optional(),
  endDate: z.date().nullable().optional(),
  roles: z.array(z.string()).default([]),
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

export type { VimeoVideo } from './types/index'