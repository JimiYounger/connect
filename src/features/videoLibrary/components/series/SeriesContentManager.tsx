'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Image from 'next/image'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { 
  Plus, 
  GripVertical, 
  Video, 
  FileText, 
  Edit, 
  Trash2, 
  Clock,
  Hash
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import SeriesContentSelector from './SeriesContentSelector'

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

interface Series {
  id: string
  name: string
  content_count: number
  has_seasons: boolean
  content?: SeriesContent[]
}

interface SeriesContentManagerProps {
  seriesId: string
}

// Sortable Content Item Component
function SortableContentItem({ 
  item, 
  onEdit, 
  onDelete 
}: { 
  item: SeriesContent, 
  onEdit: () => void, 
  onDelete: () => void 
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const formatDuration = (seconds: number) => {
    if (!seconds) return ''
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-center space-x-4">
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab hover:cursor-grabbing text-gray-400 hover:text-gray-600"
        >
          <GripVertical className="h-5 w-5" />
        </div>

        {/* Content Icon and Thumbnail */}
        <div className="flex-shrink-0">
          {item.content_type === 'video' ? (
            <div className="w-16 h-12 bg-gray-200 rounded flex items-center justify-center">
              {item.content.thumbnail_url ? (
                <Image 
                  src={item.content.thumbnail_url} 
                  alt={item.content.title}
                  width={64}
                  height={48}
                  className="w-full h-full object-cover rounded"
                />
              ) : (
                <Video className="h-6 w-6 text-gray-400" />
              )}
            </div>
          ) : (
            <div className="w-16 h-12 bg-gray-200 rounded flex items-center justify-center">
              {item.content.preview_image_url ? (
                <Image 
                  src={item.content.preview_image_url} 
                  alt={item.content.title}
                  width={64}
                  height={48}
                  className="w-full h-full object-cover rounded"
                />
              ) : (
                <FileText className="h-6 w-6 text-gray-400" />
              )}
            </div>
          )}
        </div>

        {/* Content Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900 line-clamp-1">
                {item.content.title}
              </h4>
              {item.content.description && (
                <p className="text-xs text-gray-600 line-clamp-1 mt-1">
                  {item.content.description}
                </p>
              )}
              <div className="flex items-center space-x-4 mt-2">
                <Badge variant="outline" className="text-xs">
                  {item.content_type}
                </Badge>
                {item.content_type === 'video' && item.content.duration && (
                  <span className="text-xs text-gray-500 flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatDuration(item.content.duration)}
                  </span>
                )}
                <span className="text-xs text-gray-500">
                  Season {item.season_number}
                </span>
                {item.module_name && (
                  <span className="text-xs text-gray-500">
                    Module: {item.module_name}
                  </span>
                )}
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={onEdit}
                className="h-8 w-8 p-0"
              >
                <Edit className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SeriesContentManager({ seriesId }: SeriesContentManagerProps) {
  const [showContentSelector, setShowContentSelector] = useState(false)
  const [editingItem, setEditingItem] = useState<SeriesContent | null>(null)
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Setup drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Fetch series content
  const { data: seriesData, isLoading } = useQuery({
    queryKey: ['video-series', seriesId],
    queryFn: async () => {
      const response = await fetch(`/api/video-library/series/${seriesId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch series')
      }
      const result = await response.json()
      return result.data as Series
    },
  })

  // Reorder content mutation
  const reorderMutation = useMutation({
    mutationFn: async (orderedContent: any[]) => {
      const response = await fetch(`/api/video-library/series/${seriesId}/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ordered_content: orderedContent }),
      })
      if (!response.ok) {
        throw new Error('Failed to reorder content')
      }
      return response.json()
    },
    onError: (error: Error) => {
      // If the mutation fails, refetch to restore correct state
      queryClient.invalidateQueries({ queryKey: ['video-series', seriesId] })
      toast({
        title: 'Error',
        description: `Failed to reorder content: ${error.message}`,
        variant: 'destructive',
      })
    },
    onSuccess: () => {
      // Refetch to ensure we have the latest data from server
      queryClient.invalidateQueries({ queryKey: ['video-series', seriesId] })
    },
  })

  // Delete content mutation
  const deleteMutation = useMutation({
    mutationFn: async ({ content_type, content_id }: { content_type: string, content_id: string }) => {
      const response = await fetch(`/api/video-library/series/${seriesId}/content`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content_type, content_id }),
      })
      if (!response.ok) {
        throw new Error('Failed to remove content')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video-series', seriesId] })
      toast({
        title: 'Success',
        description: 'Content removed from series',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to remove content: ${error.message}`,
        variant: 'destructive',
      })
    },
  })

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || !seriesData?.content) return

    const activeIndex = seriesData.content.findIndex(item => item.id === active.id)
    const overIndex = seriesData.content.findIndex(item => item.id === over.id)

    if (activeIndex !== overIndex) {
      const reorderedContent = arrayMove(seriesData.content, activeIndex, overIndex)
      
      // First, optimistically update the UI immediately
      queryClient.setQueryData(['video-series', seriesId], (old: any) => {
        if (!old) return old
        return {
          ...old,
          content: reorderedContent.map((item, index) => ({
            ...item,
            order_index: index
          }))
        }
      })
      
      // Then prepare the API call
      const orderedContent = reorderedContent.map((item, index) => ({
        content_id: item.content_id,
        content_type: item.content_type,
        order_index: index,
        season_number: item.season_number,
        module_name: item.module_name,
      }))

      // Make the API call
      reorderMutation.mutate(orderedContent)
    }
  }

  const handleAddContent = () => {
    setShowContentSelector(true)
  }

  const handleEditItem = (item: SeriesContent) => {
    setEditingItem(item)
  }

  const handleDeleteItem = (item: SeriesContent) => {
    if (window.confirm(`Remove "${item.content.title}" from this series?`)) {
      deleteMutation.mutate({
        content_type: item.content_type,
        content_id: item.content_id,
      })
    }
  }

  const handleContentAdded = () => {
    setShowContentSelector(false)
    queryClient.invalidateQueries({ queryKey: ['video-series', seriesId] })
  }

  // Group content by seasons
  const contentBySeasons = (seriesData?.content || []).reduce((acc, item) => {
    const season = item.season_number
    if (!acc[season]) {
      acc[season] = []
    }
    acc[season].push(item)
    return acc
  }, {} as Record<number, SeriesContent[]>)

  const seasons = Object.keys(contentBySeasons).map(Number).sort((a, b) => a - b)

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 rounded-lg animate-pulse"></div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Series Content</h3>
          <p className="text-sm text-gray-600">
            Drag to reorder • Click edit to manage seasons and modules
          </p>
        </div>
        <Button onClick={handleAddContent} data-add-content-button>
          <Plus className="h-4 w-4 mr-2" />
          Add Content
        </Button>
      </div>

      {/* Content Management */}
      {!seriesData?.content || seriesData.content.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Plus className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No content yet</h3>
            <p className="text-gray-600 mb-4">
              Start building your series by adding videos and documents.
            </p>
            <Button onClick={handleAddContent}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Item
            </Button>
          </CardContent>
        </Card>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="space-y-6">
            {seasons.map(seasonNumber => (
              <Card key={seasonNumber}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Hash className="h-5 w-5" />
                    Season {seasonNumber}
                    <Badge variant="secondary">
                      {contentBySeasons[seasonNumber].length} items
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <SortableContext
                    items={contentBySeasons[seasonNumber].map(item => item.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {contentBySeasons[seasonNumber].map((item) => (
                      <SortableContentItem
                        key={item.id}
                        item={item}
                        onEdit={() => handleEditItem(item)}
                        onDelete={() => handleDeleteItem(item)}
                      />
                    ))}
                  </SortableContext>
                </CardContent>
              </Card>
            ))}
          </div>
        </DndContext>
      )}

      {/* Content Selector Modal */}
      {showContentSelector && (
        <SeriesContentSelector
          seriesId={seriesId}
          existingSeasons={seasons}
          onClose={() => setShowContentSelector(false)}
          onSuccess={handleContentAdded}
        />
      )}

      {/* Edit Item Modal */}
      {editingItem && (
        <ContentEditModal
          item={editingItem}
          seriesId={seriesId}
          onClose={() => setEditingItem(null)}
          onSuccess={() => {
            setEditingItem(null)
            queryClient.invalidateQueries({ queryKey: ['video-series', seriesId] })
          }}
        />
      )}

    </div>
  )
}

// Content Edit Modal Component
function ContentEditModal({ 
  item, 
  seriesId, 
  onClose, 
  onSuccess 
}: { 
  item: SeriesContent, 
  seriesId: string, 
  onClose: () => void, 
  onSuccess: () => void 
}) {
  const [seasonNumber, setSeasonNumber] = useState(item.season_number.toString())
  const [moduleName, setModuleName] = useState(item.module_name || '')
  const { toast } = useToast()

  const updateMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/video-library/series/${seriesId}/content`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content_updates: [{
            content_id: item.content_id,
            content_type: item.content_type,
            season_number: parseInt(seasonNumber),
            module_name: moduleName.trim() || null,
          }]
        }),
      })
      if (!response.ok) {
        throw new Error('Failed to update content')
      }
      return response.json()
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Content updated successfully',
      })
      onSuccess()
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to update content: ${error.message}`,
        variant: 'destructive',
      })
    },
  })

  const handleSave = () => {
    if (!seasonNumber || isNaN(parseInt(seasonNumber)) || parseInt(seasonNumber) < 1) {
      toast({
        title: 'Error',
        description: 'Season number must be a positive number',
        variant: 'destructive',
      })
      return
    }
    updateMutation.mutate()
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Content</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              {item.content.title}
            </h4>
            <Badge variant="outline">
              {item.content_type}
            </Badge>
          </div>

          <div>
            <Label htmlFor="season">Season Number</Label>
            <Input
              id="season"
              type="number"
              min="1"
              value={seasonNumber}
              onChange={(e) => setSeasonNumber(e.target.value)}
              placeholder="1"
            />
          </div>

          <div>
            <Label htmlFor="module">Module Name (Optional)</Label>
            <Input
              id="module"
              value={moduleName}
              onChange={(e) => setModuleName(e.target.value)}
              placeholder="e.g., Introduction, Advanced Concepts"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
