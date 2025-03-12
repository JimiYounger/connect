'use client'

import { Users, MapPin, Globe } from 'lucide-react'
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { Tables } from '@/types/supabase'

type Banner = Tables<'carousel_banners_detailed'>

interface BannerRoleIndicatorProps {
  banner: Banner
}

export function BannerRoleIndicator({ banner }: BannerRoleIndicatorProps) {
  // Parse the role_details JSON if it exists
  const roleDetails = banner.role_details ? 
    (typeof banner.role_details === 'string' ? 
      JSON.parse(banner.role_details) : 
      banner.role_details) : 
    null;

  // If no role details or empty object, banner is visible to all users
  if (!roleDetails || Object.keys(roleDetails).length === 0) {
    return null;
  }

  // Extract unique values
  const roleTypes = new Set<string>();
  const teams = new Set<string>();
  const areas = new Set<string>();
  const regions = new Set<string>();

  // Process role details
  Object.values(roleDetails).forEach((detail: any) => {
    if (detail.role_type && detail.role_type !== 'Any') {
      roleTypes.add(detail.role_type);
    }
    if (detail.team) teams.add(detail.team);
    if (detail.area) areas.add(detail.area);
    if (detail.region) regions.add(detail.region);
  });

  // If no specific assignments, banner is visible to all
  if (roleTypes.size === 0 && teams.size === 0 && areas.size === 0 && regions.size === 0) {
    return null;
  }

  return (
    <div className="absolute top-4 left-4 z-10 flex gap-1.5">
      {roleTypes.size > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="secondary" className="bg-black/70 text-white border-none hover:bg-black/80 flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span>{roleTypes.size}</span>
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="p-0 overflow-hidden">
              <div className="bg-black text-white p-3 rounded-md">
                <div className="font-medium mb-2">Visible to roles:</div>
                <div className="flex flex-wrap gap-2">
                  {Array.from(roleTypes).map(role => (
                    <Badge key={`role-${role}`} variant="outline" className="border-white/30 text-white">
                      {role}
                    </Badge>
                  ))}
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      
      {teams.size > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="secondary" className="bg-black/70 text-white border-none hover:bg-black/80 flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span>{teams.size}</span>
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="p-0 overflow-hidden">
              <div className="bg-black text-white p-3 rounded-md">
                <div className="font-medium mb-2">Visible to teams:</div>
                <div className="flex flex-wrap gap-2">
                  {Array.from(teams).map(team => (
                    <Badge key={`team-${team}`} variant="outline" className="border-white/30 text-white">
                      {team}
                    </Badge>
                  ))}
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      
      {areas.size > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="secondary" className="bg-black/70 text-white border-none hover:bg-black/80 flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span>{areas.size}</span>
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="p-0 overflow-hidden">
              <div className="bg-black text-white p-3 rounded-md">
                <div className="font-medium mb-2">Visible to areas:</div>
                <div className="flex flex-wrap gap-2">
                  {Array.from(areas).map(area => (
                    <Badge key={`area-${area}`} variant="outline" className="border-white/30 text-white">
                      {area}
                    </Badge>
                  ))}
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      
      {regions.size > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="secondary" className="bg-black/70 text-white border-none hover:bg-black/80 flex items-center gap-1">
                <Globe className="h-3 w-3" />
                <span>{regions.size}</span>
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="p-0 overflow-hidden">
              <div className="bg-black text-white p-3 rounded-md">
                <div className="font-medium mb-2">Visible to regions:</div>
                <div className="flex flex-wrap gap-2">
                  {Array.from(regions).map(region => (
                    <Badge key={`region-${region}`} variant="outline" className="border-white/30 text-white">
                      {region}
                    </Badge>
                  ))}
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
} 