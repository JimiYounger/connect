// src/features/carousel/components/CarouselPreview.tsx

'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CarouselDisplay } from './CarouselDisplay'
import type { Tables } from '@/types/supabase'
import { cn } from '@/lib/utils'

type Banner = Tables<'carousel_banners_detailed'>

const ROLE_TYPES = ['All', 'Setter', 'Closer', 'Manager']

interface CarouselPreviewProps {
  profile: any // Add proper type from your profile type
  banners: Banner[]
  isLoading: boolean
  error: Error | null
}

export function CarouselPreview({ profile, banners, isLoading, error }: CarouselPreviewProps) {
  const [activeRole, setActiveRole] = useState<string | null>(null)

  const filteredBanners = banners
  .filter(banner => banner.is_active)
  .filter(banner => {
    if (!activeRole || activeRole === 'All') return true
    return !banner.visible_to_roles || banner.visible_to_roles.includes(activeRole.toLowerCase())
  })

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-2">Loading preview...</p>
          </div>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-4">
        <div className="text-red-600">Error: {error.message}</div>
      </Card>
    )
  }

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex gap-2 bg-muted p-1 rounded-lg">
          {ROLE_TYPES.map((role) => (
            <Button
              key={role}
              variant={activeRole === role || (role === 'All' && activeRole === null) ? "default" : "ghost"}
              className={cn(
                "flex-1",
                activeRole === role || (role === 'All' && activeRole === null)
                  ? "bg-background shadow-sm text-foreground font-medium"
                  : "hover:bg-background/50 text-muted-foreground"
              )}
              onClick={() => setActiveRole(role === 'All' ? null : role)}
            >
              {role}
            </Button>
          ))}
        </div>

        {filteredBanners.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No active banners to display
          </div>
        ) : (
          <CarouselDisplay 
            banners={filteredBanners}
            activeRole={activeRole}
          />
        )}
      </div>
    </Card>
  )
}