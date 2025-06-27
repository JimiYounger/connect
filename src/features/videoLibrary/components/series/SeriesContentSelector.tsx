'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import Image from 'next/image'
import { Search, Video, FileText, Plus, Hash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'

interface ContentItem {
  id: string
  title: string
  description?: string
  duration?: number
  thumbnail_url?: string
  preview_image_url?: string
  category?: string
  subcategory?: string
  type: 'video' | 'document'
  created_at: string
}

interface SeriesContentSelectorProps {
  seriesId: string
  existingSeasons: number[]
  onClose: () => void
  onSuccess: () => void
}

export default function SeriesContentSelector({ seriesId, existingSeasons, onClose, onSuccess }: SeriesContentSelectorProps) {
  const [search, setSearch] = useState('')
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [selectedSeason, setSelectedSeason] = useState<string>(existingSeasons.length > 0 ? existingSeasons[0].toString() : '')
  const [newSeasonName, setNewSeasonName] = useState('')
  const [isCreatingNewSeason, setIsCreatingNewSeason] = useState(existingSeasons.length === 0)
  const { toast } = useToast()

  // Suggest the next available season number
  const suggestedSeasonNumber = existingSeasons.length > 0 ? Math.max(...existingSeasons) + 1 : 1

  // Fetch available content
  const { data: content, isLoading } = useQuery({
    queryKey: ['available-content', seriesId, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        series_id: seriesId,
        limit: '50',
      })
      if (search) params.append('search', search)

      const response = await fetch(`/api/video-library/series/available-content?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch content')
      }
      const result = await response.json()
      return result.data as { videos: ContentItem[], documents: ContentItem[] }
    },
  })

  // Add content mutation
  const addContentMutation = useMutation({
    mutationFn: async (items: { content_type: string, content_id: string }[]) => {
      const seasonNumber = isCreatingNewSeason ? suggestedSeasonNumber : parseInt(selectedSeason)
      
      const promises = items.map(async (item, index) => {
        const response = await fetch(`/api/video-library/series/${seriesId}/content`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content_type: item.content_type,
            content_id: item.content_id,
            order_index: index,
            season_number: seasonNumber,
            module_name: isCreatingNewSeason && newSeasonName ? newSeasonName : null,
          }),
        })
        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to add content')
        }
        return response.json()
      })
      return Promise.all(promises)
    },
    onSuccess: () => {
      const seasonNumber = isCreatingNewSeason ? suggestedSeasonNumber : parseInt(selectedSeason)
      const seasonName = isCreatingNewSeason && newSeasonName ? ` "${newSeasonName}"` : ''
      
      toast({
        title: 'Success',
        description: `Added ${selectedItems.size} item(s) to Season ${seasonNumber}${seasonName}`,
      })
      onSuccess()
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to add content: ${error.message}`,
        variant: 'destructive',
      })
    },
  })

  const handleToggleItem = (itemId: string) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId)
    } else {
      newSelected.add(itemId)
    }
    setSelectedItems(newSelected)
  }

  const handleAddSelected = () => {
    if (selectedItems.size === 0) return

    // Validate season selection
    if (!isCreatingNewSeason && !selectedSeason) {
      toast({
        title: 'Error',
        description: 'Please select a season or create a new one',
        variant: 'destructive',
      })
      return
    }

    const allContent = [...(content?.videos || []), ...(content?.documents || [])]
    const itemsToAdd = Array.from(selectedItems).map(itemId => {
      const item = allContent.find(c => c.id === itemId)
      return {
        content_type: item?.type || 'video',
        content_id: itemId,
      }
    })

    addContentMutation.mutate(itemsToAdd)
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

  const renderContentGrid = (items: ContentItem[], type: 'video' | 'document') => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => (
        <Card 
          key={item.id} 
          className={`cursor-pointer transition-all ${
            selectedItems.has(item.id) ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-md'
          }`}
          onClick={() => handleToggleItem(item.id)}
        >
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                {type === 'video' ? (
                  <div className="w-16 h-12 bg-gray-200 rounded flex items-center justify-center">
                    {item.thumbnail_url ? (
                      <Image 
                        src={item.thumbnail_url} 
                        alt={item.title}
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
                    {item.preview_image_url ? (
                      <Image 
                        src={item.preview_image_url} 
                        alt={item.title}
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
              
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                  {item.title}
                </h4>
                {item.description && (
                  <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                    {item.description}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {item.category && (
                      <Badge variant="outline" className="text-xs">
                        {item.category}
                      </Badge>
                    )}
                    {type === 'video' && item.duration && (
                      <span className="text-xs text-gray-500">
                        {formatDuration(item.duration)}
                      </span>
                    )}
                  </div>
                  {selectedItems.has(item.id) && (
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                      <Plus className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Add Content to Series</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search videos and documents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Season Selection */}
          <div className="space-y-3 p-4 border rounded-lg bg-gray-50">
            <div className="flex items-center space-x-2">
              <Hash className="h-4 w-4 text-gray-600" />
              <Label className="text-sm font-medium">Add to Season</Label>
            </div>
            
            <div className="space-y-3">
              {/* Existing Season Selection */}
              {existingSeasons.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="existing-season"
                      name="season-option"
                      checked={!isCreatingNewSeason}
                      onChange={() => setIsCreatingNewSeason(false)}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="existing-season" className="text-sm">Add to existing season</Label>
                  </div>
                  {!isCreatingNewSeason && (
                    <Select value={selectedSeason} onValueChange={setSelectedSeason}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a season" />
                      </SelectTrigger>
                      <SelectContent>
                        {existingSeasons.map(seasonNum => (
                          <SelectItem key={seasonNum} value={seasonNum.toString()}>
                            Season {seasonNum}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}

              {/* New Season Creation */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="new-season"
                    name="season-option"
                    checked={isCreatingNewSeason}
                    onChange={() => setIsCreatingNewSeason(true)}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="new-season" className="text-sm">
                    Create new Season {suggestedSeasonNumber}
                  </Label>
                </div>
                {isCreatingNewSeason && (
                  <Input
                    placeholder={`Season ${suggestedSeasonNumber} name (optional)`}
                    value={newSeasonName}
                    onChange={(e) => setNewSeasonName(e.target.value)}
                    className="w-full"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Selected Count */}
          {selectedItems.size > 0 && (
            <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg">
              <span className="text-sm text-blue-800">
                {selectedItems.size} item(s) selected
              </span>
              <Button size="sm" onClick={() => setSelectedItems(new Set())}>
                Clear Selection
              </Button>
            </div>
          )}

          {/* Content Tabs */}
          <Tabs defaultValue="videos" className="flex-1">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="videos">
                Videos ({content?.videos?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="documents">
                Documents ({content?.documents?.length || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="videos" className="mt-4 max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : content?.videos && content.videos.length > 0 ? (
                renderContentGrid(content.videos, 'video')
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No videos available to add
                </div>
              )}
            </TabsContent>

            <TabsContent value="documents" className="mt-4 max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : content?.documents && content.documents.length > 0 ? (
                renderContentGrid(content.documents, 'document')
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No documents available to add
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddSelected}
              disabled={selectedItems.size === 0 || addContentMutation.isPending}
            >
              {addContentMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add {selectedItems.size > 0 ? `${selectedItems.size} ` : ''}to {
                    isCreatingNewSeason 
                      ? `Season ${suggestedSeasonNumber}` 
                      : selectedSeason 
                        ? `Season ${selectedSeason}` 
                        : 'Season'
                  }
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}