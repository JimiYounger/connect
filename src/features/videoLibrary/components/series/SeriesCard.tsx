'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { MoreHorizontal, Edit, Trash2, Power, Clock, Hash, Play } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Series {
  id: string
  name: string
  description?: string
  series_type: 'playlist' | 'course' | 'collection'
  has_seasons: boolean
  thumbnail_url?: string
  thumbnail_source: 'vimeo' | 'upload' | 'url' | 'default'
  thumbnail_color?: string
  is_public: boolean
  is_active: boolean
  content_count: number
  total_duration: number
  tags: string[]
  order_index: number
  created_at: string
  updated_at: string
}

interface SeriesCardProps {
  series: Series
  onEdit: () => void
  onDelete: () => void
  onToggleActive: () => void
}

export default function SeriesCard({ series, onEdit, onDelete, onToggleActive }: SeriesCardProps) {
  const [imageError, setImageError] = useState(false)
  const router = useRouter()

  const formatDuration = (seconds: number) => {
    if (!seconds) return '0 min'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const getSeriesTypeColor = (type: string) => {
    switch (type) {
      case 'course':
        return 'bg-blue-500/90 text-white'
      case 'collection':
        return 'bg-purple-500/90 text-white'
      default:
        return 'bg-green-500/90 text-white'
    }
  }

  const getSeriesTypeLabel = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1)
  }

  // Generate background image or color
  const getBackgroundStyle = () => {
    if (series.thumbnail_url && !imageError) {
      return {
        backgroundImage: `url(${series.thumbnail_url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    }
    return {
      backgroundColor: series.thumbnail_color || '#3b82f6',
    }
  }

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent click when clicking on dropdown or buttons
    if ((e.target as HTMLElement).closest('[data-dropdown-trigger]') || 
        (e.target as HTMLElement).closest('button')) {
      return
    }
    router.push(`/admin/video-library/series/${series.id}`)
  }

  return (
    <div className="group cursor-pointer space-y-2" onClick={handleCardClick}>
      {/* Main card container */}
      <div 
        className="relative w-full rounded-lg overflow-hidden transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl"
        style={{ aspectRatio: '2/3', ...getBackgroundStyle() }}
      >
        {/* Gradient overlay - Only visible on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Status badges - Always visible */}
        <div className="absolute top-3 left-3 flex flex-col gap-1">
          <Badge className={getSeriesTypeColor(series.series_type)}>
            {getSeriesTypeLabel(series.series_type)}
          </Badge>
          <Badge 
            className={series.is_active 
              ? "bg-green-500/90 text-white" 
              : "bg-red-500/90 text-white"
            }
          >
            {series.is_active ? 'Active' : 'Inactive'}
          </Badge>
        </div>

        {/* Actions dropdown - Visible on hover */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 bg-black/50 hover:bg-black/70 text-white border-none"
                data-dropdown-trigger
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white">
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Series
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onToggleActive}>
                <Power className="h-4 w-4 mr-2" />
                {series.is_active ? 'Deactivate' : 'Activate'}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={onDelete}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Series
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Fallback icon for default thumbnails */}
        {(!series.thumbnail_url || imageError) && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white/80">
              <Play className="h-12 w-12 mx-auto mb-2 opacity-60" />
              <span className="text-sm font-medium opacity-80">{getSeriesTypeLabel(series.series_type)}</span>
            </div>
          </div>
        )}

        {/* Hover overlay with additional info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 space-y-2">
            {/* Description */}
            {series.description && (
              <p className="text-white/90 text-xs line-clamp-3" title={series.description}>
                {series.description}
              </p>
            )}

            {/* Stats */}
            <div className="flex items-center gap-3 text-white/80 text-xs">
              <span className="flex items-center gap-1">
                <Hash className="h-3 w-3" />
                {series.content_count} items
              </span>
              {series.total_duration > 0 && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDuration(series.total_duration)}
                </span>
              )}
            </div>

            {/* Tags */}
            {series.tags && series.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {series.tags.slice(0, 3).map((tag, index) => (
                  <Badge 
                    key={index} 
                    variant="outline" 
                    className="text-xs px-1.5 py-0.5 bg-white/20 text-white border-white/30 hover:bg-white/30"
                  >
                    {tag}
                  </Badge>
                ))}
                {series.tags.length > 3 && (
                  <Badge 
                    variant="outline" 
                    className="text-xs px-1.5 py-0.5 bg-white/20 text-white border-white/30"
                  >
                    +{series.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}

            {/* Secondary badges */}
            <div className="flex flex-wrap gap-1">
              {series.is_public && (
                <Badge className="bg-blue-500/80 text-white text-xs">
                  Public
                </Badge>
              )}
              {series.has_seasons && (
                <Badge className="bg-orange-500/80 text-white text-xs">
                  {series.series_type === 'course' ? 'Modules' : 'Seasons'}
                </Badge>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 pt-2">
              <Button 
                size="sm" 
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 text-xs h-7"
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit()
                }}
              >
                <Edit className="h-3 w-3 mr-1" />
                Edit
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 text-xs h-7"
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleActive()
                }}
              >
                <Power className="h-3 w-3 mr-1" />
                {series.is_active ? 'Deactivate' : 'Activate'}
              </Button>
            </div>
          </div>

        {/* Hidden image for error handling */}
        {series.thumbnail_url && (
          <Image
            src={series.thumbnail_url}
            alt=""
            width={1}
            height={1}
            className="hidden"
            onError={() => setImageError(true)}
            onLoad={() => setImageError(false)}
          />
        )}
      </div>

      {/* Series title - Below the card */}
      <div className="px-1">
        <h3 className="text-gray-900 font-medium text-sm line-clamp-2 leading-tight" title={series.name}>
          {series.name}
        </h3>
      </div>
    </div>
  )
}