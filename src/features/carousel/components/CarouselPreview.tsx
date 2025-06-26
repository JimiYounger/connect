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
  banners: Banner[]
  isLoading: boolean
  error: Error | null
}

export function CarouselPreview({ banners, isLoading, error }: CarouselPreviewProps) {
  const [activeRole, setActiveRole] = useState<string | null>(null)
  
  // Helper function to check if a banner is visible to a specific role
  const isBannerVisibleToRole = (banner: Banner, role: string): boolean => {
    // If no role_details, banner is visible to all
    if (!banner.role_details) return true;
    
    // Parse role_details if it's a string
    const roleDetails = typeof banner.role_details === 'string' 
      ? JSON.parse(banner.role_details) 
      : banner.role_details;
    
    // If no role assignments, banner is visible to all
    if (!roleDetails || Object.keys(roleDetails).length === 0) return true;
    
    // Check if any role assignment matches the selected role
    return Object.values(roleDetails).some((detail: any) => {
      // If role_type is 'Any', it's visible to all roles
      if (detail.role_type === 'Any') return true;
      
      // Check if the role_type matches the selected role
      return detail.role_type?.toLowerCase() === role.toLowerCase();
    });
  };

  const filteredBanners = banners
    // Only filter by is_active, not by date constraints
    .filter(banner => banner.is_active)
    // Filter by role if a role is selected
    .filter(banner => {
      if (!activeRole || activeRole === 'All') return true;
      return isBannerVisibleToRole(banner, activeRole);
    });

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
        <div className="flex justify-between items-center">
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
        </div>

        {filteredBanners.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No active banners to display{activeRole ? ` for ${activeRole}s` : ''}
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