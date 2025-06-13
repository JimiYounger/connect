'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Search,
  Filter,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  ExternalLink,
  FolderOpen,
  Tag,
  Grid3x3,
  List,
  BarChart3,
  Settings,
  Users,
  TrendingUp,
  Activity,
  PlayCircle,
  RefreshCw,
  Archive,
  Edit,
  Shield,
  Info
} from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface VideoFile {
  id: string
  title: string
  description?: string
  summary?: string
  vimeoId?: string
  vimeoUri?: string
  vimeoDuration?: number
  vimeoThumbnailUrl?: string
  category?: { id: string; name: string }
  subcategory?: { id: string; name: string }
  series?: { id: string; name: string }
  tags?: string[]
  adminSelected: boolean
  libraryStatus: 'pending' | 'approved' | 'rejected' | 'archived'
  transcriptStatus: 'pending' | 'processing' | 'completed' | 'failed'
  embeddingStatus: 'pending' | 'processing' | 'completed' | 'failed'
  summaryStatus: 'pending' | 'processing' | 'completed' | 'failed'
  createdAt: string
  updatedAt: string
  chunksCount: number
  permissions?: {
    roleTypes: string[]
    teams: string[]
    areas: string[]
    regions: string[]
  }
}

interface Category {
  id: string
  name: string
  description?: string
  videoCount: number
  subcategories?: Array<{
    id: string
    name: string
    description?: string
    videoCount: number
  }>
}

interface LibraryStats {
  totalVideos: number
  approvedVideos: number
  pendingVideos: number
  processingVideos: number
  failedVideos: number
  totalDuration: number
  categoriesCount: number
  tagsCount: number
  recentImports: number
}

export function AdminVideoLibrary() {
  const [videos, setVideos] = useState<VideoFile[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [stats, setStats] = useState<LibraryStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filters and search
  const [activeTab, setActiveTab] = useState('overview')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [_sortBy, _setSortBy] = useState<string>('updated_at')
  
  // Modal states
  const [selectedVideo, setSelectedVideo] = useState<VideoFile | null>(null)
  const [showVideoModal, setShowVideoModal] = useState(false)

  // Fetch videos with filters
  const fetchVideos = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/video-library/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          searchQuery: searchQuery || undefined,
          video_category_id: categoryFilter !== 'all' ? categoryFilter : undefined,
          library_status: statusFilter !== 'all' ? statusFilter : undefined,
          limit: 50
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch videos: ${response.status}`)
      }

      const data = await response.json()
      if (data.success) {
        setVideos(data.data || [])
        setError(null)
      } else {
        setError(data.error || 'Failed to fetch videos')
      }
    } catch (err) {
      console.error('Error fetching videos:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [searchQuery, categoryFilter, statusFilter])

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/video-library/categories')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setCategories(data.data || [])
        }
      }
    } catch (err) {
      console.error('Error fetching categories:', err)
    }
  }, [])

  // Generate stats from videos
  const generateStats = useCallback((videoList: VideoFile[]) => {
    const stats: LibraryStats = {
      totalVideos: videoList.length,
      approvedVideos: videoList.filter(v => v.libraryStatus === 'approved').length,
      pendingVideos: videoList.filter(v => v.libraryStatus === 'pending').length,
      processingVideos: videoList.filter(v => v.transcriptStatus === 'processing' || v.embeddingStatus === 'processing').length,
      failedVideos: videoList.filter(v => v.libraryStatus === 'rejected' || v.transcriptStatus === 'failed').length,
      totalDuration: videoList.reduce((sum, v) => sum + (v.vimeoDuration || 0), 0),
      categoriesCount: categories.length,
      tagsCount: new Set(videoList.flatMap(v => v.tags || [])).size,
      recentImports: videoList.filter(v => {
        const createdDate = new Date(v.createdAt)
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        return createdDate > weekAgo
      }).length
    }
    setStats(stats)
  }, [categories])

  // Initial data fetch
  useEffect(() => {
    Promise.all([fetchVideos(), fetchCategories()])
  }, [fetchVideos, fetchCategories])

  // Update stats when videos change
  useEffect(() => {
    if (videos.length > 0) {
      generateStats(videos)
    }
  }, [videos, generateStats])

  // Format duration
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  // Get status badge
  const getStatusBadge = (status: string, type: 'library' | 'processing' = 'library') => {
    if (type === 'library') {
      switch (status) {
        case 'approved':
          return { icon: CheckCircle, className: 'bg-green-100 text-green-800', text: 'Approved' }
        case 'pending':
          return { icon: Clock, className: 'bg-yellow-100 text-yellow-800', text: 'Pending' }
        case 'rejected':
          return { icon: XCircle, className: 'bg-red-100 text-red-800', text: 'Rejected' }
        case 'archived':
          return { icon: Archive, className: 'bg-gray-100 text-gray-800', text: 'Archived' }
        default:
          return { icon: AlertCircle, className: 'bg-gray-100 text-gray-800', text: 'Unknown' }
      }
    } else {
      switch (status) {
        case 'completed':
          return { icon: CheckCircle, className: 'bg-green-100 text-green-800', text: 'Complete' }
        case 'processing':
          return { icon: RefreshCw, className: 'bg-blue-100 text-blue-800', text: 'Processing' }
        case 'failed':
          return { icon: XCircle, className: 'bg-red-100 text-red-800', text: 'Failed' }
        default:
          return { icon: Clock, className: 'bg-gray-100 text-gray-800', text: 'Pending' }
      }
    }
  }

  // Process video
  const processVideo = async (videoId: string) => {
    try {
      const response = await fetch('/api/video-library/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoFileId: videoId })
      })

      if (!response.ok) {
        throw new Error('Failed to process video')
      }

      fetchVideos()
    } catch (err) {
      console.error('Error processing video:', err)
      alert('Failed to process video')
    }
  }

  // Overview tab content
  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <PlayCircle className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Videos</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalVideos}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Approved</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.approvedVideos}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingVideos}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">This Week</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.recentImports}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Activity & Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Videos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Videos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {videos.slice(0, 5).map((video) => (
                <div key={video.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                     onClick={() => { setSelectedVideo(video); setShowVideoModal(true) }}>
                  <Image 
                    src={video.vimeoThumbnailUrl || ''} 
                    alt={video.title}
                    width={64}
                    height={48}
                    className="w-16 h-12 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{video.title}</p>
                    <p className="text-xs text-gray-500">{new Date(video.createdAt).toLocaleDateString()}</p>
                  </div>
                  <Badge className={getStatusBadge(video.libraryStatus).className} variant="secondary">
                    {getStatusBadge(video.libraryStatus).text}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Categories Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categories.slice(0, 5).map((category) => (
                <div key={category.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{category.name}</p>
                    <p className="text-xs text-gray-500">{category.description}</p>
                  </div>
                  <Badge variant="outline">{category.videoCount} videos</Badge>
                </div>
              ))}
              <Button variant="ghost" className="w-full" onClick={() => setActiveTab('categories')}>
                View All Categories
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  // Videos tab content
  const renderVideos = () => (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex flex-1 gap-4 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-48">
              <FolderOpen className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex gap-2">
          <div className="flex rounded-lg border">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Button asChild>
            <Link href="/admin/video-library/import">
              <Plus className="h-4 w-4 mr-2" />
              Import Video
            </Link>
          </Button>
        </div>
      </div>

      {/* Videos Display */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading videos...</p>
          </div>
        </div>
      ) : videos.length === 0 ? (
        <div className="text-center py-12">
          <PlayCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Videos Found</h3>
          <p className="text-gray-600 mb-4">Get started by importing videos from your Vimeo library</p>
          <Button asChild>
            <Link href="/admin/video-library/import">
              <Plus className="h-4 w-4 mr-2" />
              Import from Vimeo
            </Link>
          </Button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {videos.map((video) => (
            <Card key={video.id} className="overflow-hidden hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => { setSelectedVideo(video); setShowVideoModal(true) }}>
              <CardHeader className="p-0">
                <div className="relative">
                  <Image
                    src={video.vimeoThumbnailUrl || ''}
                    alt={video.title}
                    width={400}
                    height={192}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-2 right-2">
                    <Badge className={getStatusBadge(video.libraryStatus).className} variant="secondary">
                      {getStatusBadge(video.libraryStatus).text}
                    </Badge>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs">
                    {formatDuration(video.vimeoDuration || 0)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <h3 className="font-semibold text-sm line-clamp-2 mb-3">{video.title}</h3>
                <div className="space-y-2">
                  {/* Category & Subcategory */}
                  <div className="flex items-center gap-1 text-xs">
                    <FolderOpen className="h-3 w-3 text-gray-500" />
                    <div className="flex flex-col">
                      <span className="text-gray-700 font-medium">
                        {video.category?.name || 'Uncategorized'}
                      </span>
                      {video.subcategory && (
                        <span className="text-gray-500">
                          → {video.subcategory.name}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Tags */}
                  {video.tags && video.tags.length > 0 ? (
                    <div className="flex items-start gap-1">
                      <Tag className="h-3 w-3 text-gray-500 mt-0.5" />
                      <div className="flex flex-wrap gap-1">
                        {video.tags.slice(0, 2).map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs px-1 py-0">
                            {tag}
                          </Badge>
                        ))}
                        {video.tags.length > 2 && (
                          <span className="text-xs text-gray-400">+{video.tags.length - 2}</span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Tag className="h-3 w-3" />
                      <span>No tags</span>
                    </div>
                  )}

                  {/* Permissions */}
                  <TooltipProvider>
                    <div className="flex items-center gap-1 text-xs">
                      <Shield className="h-3 w-3 text-gray-500" />
                      {video.permissions && (
                        video.permissions.roleTypes?.length > 0 ||
                        video.permissions.teams?.length > 0 ||
                        video.permissions.areas?.length > 0 ||
                        video.permissions.regions?.length > 0
                      ) ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1 cursor-help">
                              <Badge variant="secondary" className="text-xs px-1 py-0">
                                <Users className="h-2 w-2 mr-1" />
                                Restricted
                              </Badge>
                              <Info className="h-3 w-3 text-gray-400" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <div className="space-y-1">
                              {video.permissions.roleTypes?.length > 0 && (
                                <div>
                                  <p className="font-medium text-xs">Roles:</p>
                                  <p className="text-xs">{video.permissions.roleTypes.join(', ')}</p>
                                </div>
                              )}
                              {video.permissions.teams?.length > 0 && (
                                <div>
                                  <p className="font-medium text-xs">Teams:</p>
                                  <p className="text-xs">{video.permissions.teams.join(', ')}</p>
                                </div>
                              )}
                              {video.permissions.areas?.length > 0 && (
                                <div>
                                  <p className="font-medium text-xs">Areas:</p>
                                  <p className="text-xs">{video.permissions.areas.join(', ')}</p>
                                </div>
                              )}
                              {video.permissions.regions?.length > 0 && (
                                <div>
                                  <p className="font-medium text-xs">Regions:</p>
                                  <p className="text-xs">{video.permissions.regions.join(', ')}</p>
                                </div>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <Badge variant="outline" className="text-xs px-1 py-0">
                          <Users className="h-2 w-2 mr-1" />
                          Public
                        </Badge>
                      )}
                    </div>
                  </TooltipProvider>

                  {/* Actions */}
                  <div className="flex gap-1 pt-1">
                    <Button size="sm" variant="ghost" asChild className="h-7 px-2">
                      <Link href={`/admin/video-library/${video.id}/edit`}>
                        <Edit className="h-3 w-3" />
                      </Link>
                    </Button>
                    {video.vimeoId && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2"
                        onClick={(e) => {
                          e.stopPropagation()
                          window.open(`https://vimeo.com/${video.vimeoId}`, '_blank')
                        }}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {videos.map((video) => (
            <Card key={video.id} className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => { setSelectedVideo(video); setShowVideoModal(true) }}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Image
                    src={video.vimeoThumbnailUrl || ''}
                    alt={video.title}
                    width={96}
                    height={64}
                    className="w-24 h-16 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate">{video.title}</h3>
                    <p className="text-gray-600 text-sm line-clamp-2 mt-1">{video.description}</p>
                    
                    {/* Organization Info */}
                    <div className="flex items-center gap-6 mt-3">
                      {/* Category & Subcategory */}
                      <div className="flex items-center gap-1 text-sm">
                        <FolderOpen className="h-4 w-4 text-gray-500" />
                        <div className="flex items-center gap-1">
                          <span className="text-gray-700 font-medium">
                            {video.category?.name || 'Uncategorized'}
                          </span>
                          {video.subcategory && (
                            <span className="text-gray-500">
                              → {video.subcategory.name}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Tags */}
                      <div className="flex items-center gap-1 text-sm">
                        <Tag className="h-4 w-4 text-gray-500" />
                        {video.tags && video.tags.length > 0 ? (
                          <div className="flex items-center gap-1">
                            {video.tags.slice(0, 3).map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs px-1 py-0">
                                {tag}
                              </Badge>
                            ))}
                            {video.tags.length > 3 && (
                              <span className="text-xs text-gray-400">+{video.tags.length - 3}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">No tags</span>
                        )}
                      </div>

                      {/* Permissions */}
                      <TooltipProvider>
                        <div className="flex items-center gap-1 text-sm">
                          <Shield className="h-4 w-4 text-gray-500" />
                          {video.permissions && (
                            video.permissions.roleTypes?.length > 0 ||
                            video.permissions.teams?.length > 0 ||
                            video.permissions.areas?.length > 0 ||
                            video.permissions.regions?.length > 0
                          ) ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-1 cursor-help">
                                  <Badge variant="secondary" className="text-xs px-1 py-0">
                                    <Users className="h-3 w-3 mr-1" />
                                    Restricted
                                  </Badge>
                                  <Info className="h-3 w-3 text-gray-400" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <div className="space-y-1">
                                  {video.permissions.roleTypes?.length > 0 && (
                                    <div>
                                      <p className="font-medium text-xs">Roles:</p>
                                      <p className="text-xs">{video.permissions.roleTypes.join(', ')}</p>
                                    </div>
                                  )}
                                  {video.permissions.teams?.length > 0 && (
                                    <div>
                                      <p className="font-medium text-xs">Teams:</p>
                                      <p className="text-xs">{video.permissions.teams.join(', ')}</p>
                                    </div>
                                  )}
                                  {video.permissions.areas?.length > 0 && (
                                    <div>
                                      <p className="font-medium text-xs">Areas:</p>
                                      <p className="text-xs">{video.permissions.areas.join(', ')}</p>
                                    </div>
                                  )}
                                  {video.permissions.regions?.length > 0 && (
                                    <div>
                                      <p className="font-medium text-xs">Regions:</p>
                                      <p className="text-xs">{video.permissions.regions.join(', ')}</p>
                                    </div>
                                  )}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <Badge variant="outline" className="text-xs px-1 py-0">
                              <Users className="h-3 w-3 mr-1" />
                              Public
                            </Badge>
                          )}
                        </div>
                      </TooltipProvider>
                    </div>

                    {/* Basic Info */}
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span>{formatDuration(video.vimeoDuration || 0)}</span>
                      <span>{new Date(video.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Badge className={getStatusBadge(video.libraryStatus).className} variant="secondary">
                      {getStatusBadge(video.libraryStatus).text}
                    </Badge>
                    <div className="flex gap-1 mt-2">
                      <Button size="sm" variant="ghost" asChild className="h-8 px-2">
                        <Link href={`/admin/video-library/${video.id}/edit`}>
                          <Edit className="h-3 w-3" />
                        </Link>
                      </Button>
                      {video.vimeoId && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 px-2"
                          onClick={(e) => {
                            e.stopPropagation()
                            window.open(`https://vimeo.com/${video.vimeoId}`, '_blank')
                          }}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )

  // Categories tab content
  const renderCategories = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Video Categories</h2>
        <Button asChild>
          <Link href="/admin/video-library/categories">
            <Settings className="h-4 w-4 mr-2" />
            Manage Categories
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <Card key={category.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="truncate">{category.name}</span>
                <Badge variant="outline">{category.videoCount}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm mb-4">{category.description}</p>
              {category.subcategories && category.subcategories.length > 0 && (
                <div className="space-y-2">
                  <p className="font-medium text-sm">Subcategories:</p>
                  <div className="flex flex-wrap gap-1">
                    {category.subcategories.map((sub) => (
                      <Badge key={sub.id} variant="secondary" className="text-xs">
                        {sub.name} ({sub.videoCount})
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )

  // Video detail modal
  const renderVideoModal = () => (
    <Dialog open={showVideoModal} onOpenChange={setShowVideoModal}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {selectedVideo && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                {selectedVideo.title}
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/admin/video-library/${selectedVideo.id}/edit`}>
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Link>
                  </Button>
                  {selectedVideo.vimeoId && (
                    <Button size="sm" variant="outline" onClick={() => window.open(`https://vimeo.com/${selectedVideo.vimeoId}`, '_blank')}>
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Vimeo
                    </Button>
                  )}
                </div>
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Video Preview */}
              <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                <Image
                  src={selectedVideo.vimeoThumbnailUrl || ''}
                  alt={selectedVideo.title}
                  width={800}
                  height={450}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Video Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p className="text-gray-600 text-sm">{selectedVideo.description || 'No description available'}</p>
                  </div>
                  
                  {selectedVideo.summary && (
                    <div>
                      <h3 className="font-semibold mb-2">AI Summary</h3>
                      <p className="text-gray-600 text-sm">{selectedVideo.summary}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Organization</h3>
                    <div className="space-y-3">
                      {/* Category & Subcategory */}
                      <div className="flex items-center gap-2">
                        <FolderOpen className="h-4 w-4 text-gray-500" />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {selectedVideo.category?.name || 'Uncategorized'}
                          </span>
                          {selectedVideo.subcategory && (
                            <span className="text-xs text-gray-500">
                              → {selectedVideo.subcategory.name}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Tags */}
                      {selectedVideo.tags && selectedVideo.tags.length > 0 ? (
                        <div className="flex items-start gap-2">
                          <Tag className="h-4 w-4 text-gray-500 mt-0.5" />
                          <div className="flex flex-wrap gap-1">
                            {selectedVideo.tags.map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-400">No tags</span>
                        </div>
                      )}

                      {/* Permissions */}
                      <TooltipProvider>
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-gray-500" />
                          {selectedVideo.permissions && (
                            selectedVideo.permissions.roleTypes?.length > 0 ||
                            selectedVideo.permissions.teams?.length > 0 ||
                            selectedVideo.permissions.areas?.length > 0 ||
                            selectedVideo.permissions.regions?.length > 0
                          ) ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-1 cursor-help">
                                  <Badge variant="secondary" className="text-xs">
                                    <Users className="h-3 w-3 mr-1" />
                                    Restricted Access
                                  </Badge>
                                  <Info className="h-3 w-3 text-gray-400" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <div className="space-y-2">
                                  {selectedVideo.permissions.roleTypes?.length > 0 && (
                                    <div>
                                      <p className="font-medium text-xs">Roles:</p>
                                      <p className="text-xs">{selectedVideo.permissions.roleTypes.join(', ')}</p>
                                    </div>
                                  )}
                                  {selectedVideo.permissions.teams?.length > 0 && (
                                    <div>
                                      <p className="font-medium text-xs">Teams:</p>
                                      <p className="text-xs">{selectedVideo.permissions.teams.join(', ')}</p>
                                    </div>
                                  )}
                                  {selectedVideo.permissions.areas?.length > 0 && (
                                    <div>
                                      <p className="font-medium text-xs">Areas:</p>
                                      <p className="text-xs">{selectedVideo.permissions.areas.join(', ')}</p>
                                    </div>
                                  )}
                                  {selectedVideo.permissions.regions?.length > 0 && (
                                    <div>
                                      <p className="font-medium text-xs">Regions:</p>
                                      <p className="text-xs">{selectedVideo.permissions.regions.join(', ')}</p>
                                    </div>
                                  )}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <div className="flex items-center gap-1">
                              <Badge variant="outline" className="text-xs">
                                <Users className="h-3 w-3 mr-1" />
                                Public Access
                              </Badge>
                            </div>
                          )}
                        </div>
                      </TooltipProvider>

                      {/* Basic Details */}
                      <div className="pt-2 border-t border-gray-100 space-y-1 text-xs text-gray-500">
                        <div className="flex justify-between">
                          <span>Duration:</span>
                          <span>{formatDuration(selectedVideo.vimeoDuration || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Status:</span>
                          <Badge className={getStatusBadge(selectedVideo.libraryStatus).className} variant="secondary">
                            {getStatusBadge(selectedVideo.libraryStatus).text}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Created:</span>
                          <span>{new Date(selectedVideo.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              {(selectedVideo.transcriptStatus === 'pending' || selectedVideo.embeddingStatus === 'pending') && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button onClick={() => processVideo(selectedVideo.id)}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Process Video
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Library</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchVideos}>Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="videos" className="flex items-center gap-2">
            <PlayCircle className="h-4 w-4" />
            Videos
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            Categories
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-6">
          {renderOverview()}
        </TabsContent>
        
        <TabsContent value="videos" className="mt-6">
          {renderVideos()}
        </TabsContent>
        
        <TabsContent value="categories" className="mt-6">
          {renderCategories()}
        </TabsContent>
      </Tabs>

      {renderVideoModal()}
    </div>
  )
}