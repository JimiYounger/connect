'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import SeriesForm from './SeriesForm'
import SeriesCard from './SeriesCard'

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

export default function SeriesManagement() {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingSeries, setEditingSeries] = useState<Series | null>(null)
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Fetch series
  const { data: series, isLoading, error } = useQuery({
    queryKey: ['video-series'],
    queryFn: async () => {
      const response = await fetch('/api/video-library/series')
      if (!response.ok) {
        throw new Error('Failed to fetch series')
      }
      const result = await response.json()
      return result.data as Series[]
    },
  })

  // Delete series mutation
  const deleteMutation = useMutation({
    mutationFn: async (seriesId: string) => {
      const response = await fetch(`/api/video-library/series/${seriesId}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error('Failed to delete series')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video-series'] })
      toast({
        title: 'Success',
        description: 'Series deleted successfully',
      })
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to delete series: ${error.message}`,
        variant: 'destructive',
      })
    },
  })

  // Toggle active status mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ seriesId, isActive }: { seriesId: string; isActive: boolean }) => {
      const response = await fetch(`/api/video-library/series/${seriesId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: isActive }),
      })
      if (!response.ok) {
        throw new Error('Failed to update series status')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video-series'] })
      toast({
        title: 'Success',
        description: 'Series status updated successfully',
      })
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update series status: ${error.message}`,
        variant: 'destructive',
      })
    },
  })

  const handleDelete = async (seriesId: string, seriesName: string) => {
    if (window.confirm(`Are you sure you want to delete the series "${seriesName}"? This action cannot be undone.`)) {
      deleteMutation.mutate(seriesId)
    }
  }

  const handleToggleActive = (seriesId: string, currentStatus: boolean) => {
    toggleActiveMutation.mutate({ seriesId, isActive: !currentStatus })
  }

  const handleEdit = (series: Series) => {
    setEditingSeries(series)
    setShowCreateForm(true)
  }

  const handleFormClose = () => {
    setShowCreateForm(false)
    setEditingSeries(null)
  }

  const handleFormSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['video-series'] })
    handleFormClose()
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-64 bg-gray-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertDescription className="text-red-800">
          Failed to load series. Please try again later.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">All Series</h2>
          <p className="text-sm text-gray-600">
            {series?.length || 0} series total
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Series
        </Button>
      </div>

      {/* Series Grid */}
      {series && series.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
          {series.map((seriesItem) => (
            <SeriesCard 
              key={seriesItem.id} 
              series={seriesItem}
              onEdit={() => handleEdit(seriesItem)}
              onDelete={() => handleDelete(seriesItem.id, seriesItem.name)}
              onToggleActive={() => handleToggleActive(seriesItem.id, seriesItem.is_active)}
            />
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <CardContent>
            <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Plus className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No series yet</h3>
            <p className="text-gray-600 mb-4">
              Create your first series to organize videos and documents together.
            </p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Series
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Form Modal */}
      {showCreateForm && (
        <SeriesForm
          series={editingSeries}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  )
}