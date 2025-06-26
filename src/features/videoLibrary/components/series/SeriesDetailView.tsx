'use client'

import { useState, use } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Edit, Settings, Users, Clock, Hash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import SeriesForm from './SeriesForm'
import SeriesContentManager from './SeriesContentManager'

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
  content?: SeriesContent[]
}

interface SeriesContent {
  id: string
  content_type: 'video' | 'document'
  content_id: string
  order_index: number
  season_number: number
  module_name?: string
  created_at: string
  content: {
    id: string
    title: string
    description?: string
    duration?: number
    thumbnail_url?: string
    preview_image_url?: string
    type: 'video' | 'document'
  }
}

interface SeriesDetailViewProps {
  params: Promise<{ id: string }>
}

export default function SeriesDetailView({ params }: SeriesDetailViewProps) {
  const [showEditForm, setShowEditForm] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const queryClient = useQueryClient()
  const resolvedParams = use(params)

  // Fetch series details
  const { data: series, isLoading, error } = useQuery({
    queryKey: ['video-series', resolvedParams.id],
    queryFn: async () => {
      const response = await fetch(`/api/video-library/series/${resolvedParams.id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch series')
      }
      const result = await response.json()
      return result.data as Series
    },
  })

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

  const handleEditSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['video-series', resolvedParams.id] })
    setShowEditForm(false)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-48 bg-gray-200 rounded-lg animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertDescription className="text-red-800">
          Failed to load series details. Please try again later.
        </AlertDescription>
      </Alert>
    )
  }

  if (!series) {
    return (
      <Alert className="border-yellow-200 bg-yellow-50">
        <AlertDescription className="text-yellow-800">
          Series not found.
        </AlertDescription>
      </Alert>
    )
  }

  // Generate thumbnail
  const thumbnailElement = () => {
    if (series.thumbnail_url) {
      return (
        <img
          src={series.thumbnail_url}
          alt={series.name}
          className="w-full h-48 object-cover rounded-lg"
        />
      )
    }

    // Fallback to colored background
    return (
      <div 
        className="w-full h-48 flex items-center justify-center text-white font-medium rounded-lg"
        style={{ backgroundColor: series.thumbnail_color || '#3b82f6' }}
      >
        <div className="text-center">
          <Hash className="h-12 w-12 mx-auto mb-2 opacity-75" />
          <span className="text-lg opacity-90">{getSeriesTypeLabel(series.series_type)}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Series Header */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Thumbnail */}
            <div className="md:col-span-1">
              {thumbnailElement()}
            </div>

            {/* Series Info */}
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
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
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">{series.name}</h1>
                  {series.description && (
                    <p className="text-gray-600 mb-4">{series.description}</p>
                  )}
                </div>
                <Button onClick={() => setShowEditForm(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Series
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <Hash className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{series.content_count}</div>
                  <div className="text-sm text-gray-600">Items</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <Clock className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatDuration(series.total_duration)}
                  </div>
                  <div className="text-sm text-gray-600">Duration</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <Users className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {series.is_public ? 'Public' : 'Private'}
                  </div>
                  <div className="text-sm text-gray-600">Visibility</div>
                </div>
              </div>

              {/* Tags */}
              {series.tags && series.tags.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {series.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Management Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="content" className="flex items-center gap-2">
            <Hash className="h-4 w-4" />
            Content
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="mt-6">
          <SeriesContentManager seriesId={series.id} />
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Series Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Created:</span>
                    <span className="ml-2 text-gray-600">
                      {new Date(series.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Updated:</span>
                    <span className="ml-2 text-gray-600">
                      {new Date(series.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Type:</span>
                    <span className="ml-2 text-gray-600">
                      {getSeriesTypeLabel(series.series_type)}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Order:</span>
                    <span className="ml-2 text-gray-600">
                      {series.order_index}
                    </span>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <Button onClick={() => setShowEditForm(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Series Settings
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Form Modal */}
      {showEditForm && (
        <SeriesForm
          series={series}
          onClose={() => setShowEditForm(false)}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  )
}