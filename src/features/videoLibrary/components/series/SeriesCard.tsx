'use client'

import { useState } from 'react'
import { MoreHorizontal, Edit, Trash2, Eye, Clock, Hash } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
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
}

export default function SeriesCard({ series, onEdit, onDelete }: SeriesCardProps) {
  const [imageError, setImageError] = useState(false)

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
        return 'bg-blue-100 text-blue-800'
      case 'collection':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-green-100 text-green-800'
    }
  }

  const getSeriesTypeLabel = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1)
  }

  // Generate thumbnail
  const thumbnailElement = () => {
    if (series.thumbnail_url && !imageError) {
      return (
        <img
          src={series.thumbnail_url}
          alt={series.name}
          className="w-full h-32 object-cover"
          onError={() => setImageError(true)}
        />
      )
    }

    // Fallback to colored background
    return (
      <div 
        className="w-full h-32 flex items-center justify-center text-white font-medium"
        style={{ backgroundColor: series.thumbnail_color || '#3b82f6' }}
      >
        <div className="text-center">
          <Hash className="h-8 w-8 mx-auto mb-1 opacity-75" />
          <span className="text-sm opacity-90">{getSeriesTypeLabel(series.series_type)}</span>
        </div>
      </div>
    )
  }

  return (
    <Card className="group hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="p-0">
        <div className="relative">
          {thumbnailElement()}
          
          {/* Overlay with actions */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="flex items-center space-x-2">
              <Link href={`/admin/video-library/series/${series.id}`}>
                <Button size="sm" variant="secondary" className="bg-white text-gray-900 hover:bg-gray-100">
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
              </Link>
            </div>
          </div>

          {/* Status badges */}
          <div className="absolute top-2 left-2 flex items-center space-x-1">
            <Badge className={getSeriesTypeColor(series.series_type)}>
              {getSeriesTypeLabel(series.series_type)}
            </Badge>
            {series.is_public && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Public
              </Badge>
            )}
            {series.has_seasons && (
              <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                Seasons
              </Badge>
            )}
          </div>

          {/* Actions dropdown */}
          <div className="absolute top-2 right-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 bg-white/80 hover:bg-white text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Series
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
        </div>
      </CardHeader>

      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Title and Description */}
          <div>
            <h3 className="font-semibold text-gray-900 line-clamp-1" title={series.name}>
              {series.name}
            </h3>
            {series.description && (
              <p className="text-sm text-gray-600 line-clamp-2 mt-1" title={series.description}>
                {series.description}
              </p>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-4">
              <span className="flex items-center">
                <Hash className="h-3 w-3 mr-1" />
                {series.content_count} items
              </span>
              {series.total_duration > 0 && (
                <span className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatDuration(series.total_duration)}
                </span>
              )}
            </div>
          </div>

          {/* Tags */}
          {series.tags && series.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {series.tags.slice(0, 3).map((tag, index) => (
                <Badge 
                  key={index} 
                  variant="outline" 
                  className="text-xs px-2 py-0"
                >
                  {tag}
                </Badge>
              ))}
              {series.tags.length > 3 && (
                <Badge variant="outline" className="text-xs px-2 py-0">
                  +{series.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Updated date */}
          <div className="text-xs text-gray-400 pt-1 border-t">
            Updated {new Date(series.updated_at).toLocaleDateString()}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}