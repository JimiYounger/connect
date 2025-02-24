// src/features/carousel/components/BannerDateIndicator.tsx

'use client'

import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import type { Tables } from '@/types/supabase'

type Banner = Tables<'carousel_banners_detailed'>

interface BannerDateIndicatorProps {
  banner: Banner
}

export function BannerDateIndicator({ banner }: BannerDateIndicatorProps) {
  // Skip rendering if no start or end date
  if (!banner.start_date && !banner.end_date) return null
  
  const now = new Date()
  const startDate = banner.start_date ? new Date(banner.start_date) : null
  const endDate = banner.end_date ? new Date(banner.end_date) : null
  
  // Check if banner is currently active based on dates
  const isBeforeStart = startDate && now < startDate
  const isAfterEnd = endDate && now > endDate
  
  // If banner is active (within date range), don't show indicator
  if (!isBeforeStart && !isAfterEnd) return null
  
  return (
    <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-2 rounded-md flex items-center z-10 text-sm">
      <CalendarIcon className="h-4 w-4 mr-2" />
      {isBeforeStart ? (
        <span>
          Scheduled: Active from {startDate && format(startDate, 'MMM d, yyyy')}
          {endDate && ` until ${format(endDate, 'MMM d, yyyy')}`}
        </span>
      ) : isAfterEnd ? (
        <span>
          Expired: Was active until {format(endDate, 'MMM d, yyyy')}
        </span>
      ) : null}
    </div>
  )
}