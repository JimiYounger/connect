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
  Users,
  TrendingUp,
  Activity,
  Play,
  PlayCircle,
  RefreshCw,
  Archive,
  Edit,
  Shield,
  Info,
  Trash2,
  Loader2,
  Save,
  FolderPlus,
  Upload
} from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { getVideoThumbnailUrl, type ThumbnailSource } from '../utils/thumbnailUtils'
import { ThumbnailUpload } from './ThumbnailUpload'

interface VideoFile {
  id: string
  title: string
  description?: string
  summary?: string
  vimeoId?: string
  vimeoUri?: string
  vimeoDuration?: number
  vimeoThumbnailUrl?: string
  customThumbnailUrl?: string
  thumbnailSource?: ThumbnailSource
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
  thumbnail_url?: string
  thumbnail_source?: 'vimeo' | 'upload' | 'url' | 'default'
  thumbnail_color?: string
  videoCount: number
  video_count: number
  created_at: string
  updated_at: string
  subcategories?: Subcategory[]
}

interface Subcategory {
  id: string
  name: string
  description?: string
  thumbnail_url?: string
  thumbnail_source?: 'vimeo' | 'upload' | 'url' | 'default'
  thumbnail_color?: string
  category_id: string
  videoCount: number
  video_count: number
  created_at: string
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
  const [activeTab, setActiveTab] = useState('videos')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [_sortBy, _setSortBy] = useState<string>('updated_at')
  
  // Modal states
  const [selectedVideo, setSelectedVideo] = useState<VideoFile | null>(null)
  const [showVideoModal, setShowVideoModal] = useState(false)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  
  // Grid view video playing state
  const [playingVideos, setPlayingVideos] = useState<Set<string>>(new Set())

  // Category management states
  const [showCreateCategory, setShowCreateCategory] = useState(false)
  const [showCreateSubcategory, setShowCreateSubcategory] = useState(false)
  const [showEditCategory, setShowEditCategory] = useState(false)
  const [showEditSubcategory, setShowEditSubcategory] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  // Reassignment modal states  
  const [showReassignDialog, setShowReassignDialog] = useState(false)
  const [reassignmentData, setReassignmentData] = useState<{
    type: 'category' | 'subcategory'
    id: string
    name: string
    videoCount: number
  } | null>(null)
  const [reassignForm, setReassignForm] = useState({
    newCategoryId: '',
    newSubcategoryId: ''
  })

  // Form states
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    thumbnail_url: '',
    thumbnail_source: 'default' as 'vimeo' | 'upload' | 'url' | 'default',
    thumbnail_color: '#3b82f6'
  })
  
  const [subcategoryForm, setSubcategoryForm] = useState({
    name: '',
    description: '',
    category_id: '',
    thumbnail_url: '',
    thumbnail_source: 'default' as 'vimeo' | 'upload' | 'url' | 'default',
    thumbnail_color: '#6366f1'
  })

  // Edit form states
  const [editCategoryForm, setEditCategoryForm] = useState({
    name: '',
    description: '',
    thumbnail_url: '',
    thumbnail_source: 'default' as 'vimeo' | 'upload' | 'url' | 'default',
    thumbnail_color: '#3b82f6'
  })
  
  const [editSubcategoryForm, setEditSubcategoryForm] = useState({
    name: '',
    description: '',
    category_id: '',
    thumbnail_url: '',
    thumbnail_source: 'default' as 'vimeo' | 'upload' | 'url' | 'default',
    thumbnail_color: '#6366f1'
  })

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

  // Handle modal close - reset video state
  const handleModalClose = () => {
    setShowVideoModal(false)
    setIsVideoPlaying(false)
    setSelectedVideo(null)
  }

  // Handle play video in modal
  const handlePlayVideo = () => {
    setIsVideoPlaying(true)
  }

  // Handle grid view video play/pause
  const toggleGridVideoPlay = (videoId: string) => {
    setPlayingVideos(prev => {
      const newSet = new Set(prev)
      if (newSet.has(videoId)) {
        newSet.delete(videoId)
      } else {
        newSet.add(videoId)
      }
      return newSet
    })
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

  // Category management functions
  const resetCategoryForm = () => {
    setCategoryForm({
      name: '',
      description: '',
      thumbnail_url: '',
      thumbnail_source: 'default',
      thumbnail_color: '#3b82f6'
    })
  }

  const resetSubcategoryForm = () => {
    setSubcategoryForm({
      name: '',
      description: '',
      category_id: '',
      thumbnail_url: '',
      thumbnail_source: 'default',
      thumbnail_color: '#6366f1'
    })
  }

  const createCategory = async () => {
    if (!categoryForm.name.trim() || saving) return

    setSaving(true)
    try {
      const response = await fetch('/api/video-library/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: categoryForm.name,
          description: categoryForm.description,
          thumbnail_url: categoryForm.thumbnail_url,
          thumbnail_source: categoryForm.thumbnail_source,
          thumbnail_color: categoryForm.thumbnail_color
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          await fetchCategories()
          setShowCreateCategory(false)
          resetCategoryForm()
        } else {
          setError(data.error || 'Failed to create category')
        }
      } else {
        setError('Failed to create category')
      }
    } catch (err) {
      console.error('Error creating category:', err)
      setError('Failed to create category')
    } finally {
      setSaving(false)
    }
  }

  const createSubcategory = async () => {
    if (!subcategoryForm.name.trim() || !subcategoryForm.category_id || saving) return

    setSaving(true)
    try {
      const response = await fetch('/api/video-library/subcategories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: subcategoryForm.name,
          description: subcategoryForm.description,
          category_id: subcategoryForm.category_id,
          thumbnail_url: subcategoryForm.thumbnail_url,
          thumbnail_source: subcategoryForm.thumbnail_source,
          thumbnail_color: subcategoryForm.thumbnail_color
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          await fetchCategories()
          setShowCreateSubcategory(false)
          resetSubcategoryForm()
        } else {
          setError(data.error || 'Failed to create subcategory')
        }
      } else {
        setError('Failed to create subcategory')
      }
    } catch (err) {
      console.error('Error creating subcategory:', err)
      setError('Failed to create subcategory')
    } finally {
      setSaving(false)
    }
  }

  const editCategory = (category: Category) => {
    setEditingCategory(category)
    setEditCategoryForm({
      name: category.name,
      description: category.description || '',
      thumbnail_url: category.thumbnail_url || '',
      thumbnail_source: category.thumbnail_source || 'default',
      thumbnail_color: category.thumbnail_color || '#3b82f6'
    })
    setShowEditCategory(true)
  }

  const editSubcategory = (subcategory: Subcategory) => {
    setEditingSubcategory(subcategory)
    setEditSubcategoryForm({
      name: subcategory.name,
      description: subcategory.description || '',
      category_id: subcategory.category_id,
      thumbnail_url: subcategory.thumbnail_url || '',
      thumbnail_source: subcategory.thumbnail_source || 'default',
      thumbnail_color: subcategory.thumbnail_color || '#6366f1'
    })
    setShowEditSubcategory(true)
  }

  const updateCategory = async () => {
    if (!editingCategory || !editCategoryForm.name.trim() || saving) return

    setSaving(true)
    try {
      const response = await fetch('/api/video-library/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingCategory.id,
          name: editCategoryForm.name,
          description: editCategoryForm.description,
          thumbnail_url: editCategoryForm.thumbnail_url,
          thumbnail_source: editCategoryForm.thumbnail_source,
          thumbnail_color: editCategoryForm.thumbnail_color
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          await fetchCategories()
          setShowEditCategory(false)
          setEditingCategory(null)
        } else {
          setError(data.error || 'Failed to update category')
        }
      } else {
        setError('Failed to update category')
      }
    } catch (err) {
      console.error('Error updating category:', err)
      setError('Failed to update category')
    } finally {
      setSaving(false)
    }
  }

  const updateSubcategory = async () => {
    if (!editingSubcategory || !editSubcategoryForm.name.trim() || !editSubcategoryForm.category_id || saving) return

    setSaving(true)
    try {
      const response = await fetch('/api/video-library/subcategories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingSubcategory.id,
          name: editSubcategoryForm.name,
          description: editSubcategoryForm.description,
          category_id: editSubcategoryForm.category_id,
          thumbnail_url: editSubcategoryForm.thumbnail_url,
          thumbnail_source: editSubcategoryForm.thumbnail_source,
          thumbnail_color: editSubcategoryForm.thumbnail_color
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          await fetchCategories()
          setShowEditSubcategory(false)
          setEditingSubcategory(null)
        } else {
          setError(data.error || 'Failed to update subcategory')
        }
      } else {
        setError('Failed to update subcategory')
      }
    } catch (err) {
      console.error('Error updating subcategory:', err)
      setError('Failed to update subcategory')
    } finally {
      setSaving(false)
    }
  }

  const deleteCategory = async (categoryId: string, categoryName: string) => {
    const category = categories.find(c => c.id === categoryId)
    if (!category) return

    // If category has videos, show reassignment dialog
    if (category.video_count > 0) {
      setReassignmentData({
        type: 'category',
        id: categoryId,
        name: categoryName,
        videoCount: category.video_count
      })
      setReassignForm({ newCategoryId: '', newSubcategoryId: '' })
      setShowReassignDialog(true)
      return
    }

    // No videos, proceed with simple deletion
    if (!confirm(`Are you sure you want to delete "${categoryName}"? This will also delete all its subcategories.`)) {
      return
    }

    setDeleting(categoryId)
    try {
      const response = await fetch('/api/video-library/categories', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          await fetchCategories()
        } else {
          setError(data.error || 'Failed to delete category')
        }
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to delete category')
      }
    } catch (err) {
      console.error('Error deleting category:', err)
      setError('Failed to delete category')
    } finally {
      setDeleting(null)
    }
  }

  const deleteSubcategory = async (subcategoryId: string, subcategoryName: string) => {
    const subcategory = categories
      .flatMap(c => c.subcategories || [])
      .find(s => s.id === subcategoryId)
    
    if (!subcategory) return

    // If subcategory has videos, show reassignment dialog
    if (subcategory.video_count > 0) {
      setReassignmentData({
        type: 'subcategory',
        id: subcategoryId,
        name: subcategoryName,
        videoCount: subcategory.video_count
      })
      setReassignForm({ newCategoryId: '', newSubcategoryId: '' })
      setShowReassignDialog(true)
      return
    }

    // No videos, proceed with simple deletion
    if (!confirm(`Are you sure you want to delete "${subcategoryName}"?`)) {
      return
    }

    setDeleting(subcategoryId)
    try {
      const response = await fetch('/api/video-library/subcategories', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subcategoryId })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          await fetchCategories()
        } else {
          setError(data.error || 'Failed to delete subcategory')
        }
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to delete subcategory')
      }
    } catch (err) {
      console.error('Error deleting subcategory:', err)
      setError('Failed to delete subcategory')
    } finally {
      setDeleting(null)
    }
  }

  // Handle reassignment and deletion
  const handleReassignAndDelete = async () => {
    if (!reassignmentData || !reassignForm.newCategoryId) {
      setError('Please select a category to reassign videos to')
      return
    }

    setDeleting(reassignmentData.id)
    try {
      const endpoint = reassignmentData.type === 'category' 
        ? '/api/video-library/categories'
        : '/api/video-library/subcategories'
      
      const body = reassignmentData.type === 'category'
        ? {
            categoryId: reassignmentData.id,
            newCategoryId: reassignForm.newCategoryId,
            newSubcategoryId: reassignForm.newSubcategoryId
          }
        : {
            subcategoryId: reassignmentData.id,
            newCategoryId: reassignForm.newCategoryId,
            newSubcategoryId: reassignForm.newSubcategoryId
          }

      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          await fetchCategories()
          setShowReassignDialog(false)
          setReassignmentData(null)
          setReassignForm({ newCategoryId: '', newSubcategoryId: '' })
        } else {
          setError(data.error || 'Failed to delete and reassign')
        }
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to delete and reassign')
      }
    } catch (err) {
      console.error('Error during reassignment:', err)
      setError('Failed to delete and reassign')
    } finally {
      setDeleting(null)
    }
  }

  // Get thumbnail display
  const getThumbnailDisplay = (item: Category | Subcategory, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = {
      sm: 'w-12 h-9',      // 4:3 aspect ratio, small
      md: 'w-16 h-12',     // 4:3 aspect ratio, medium  
      lg: 'w-24 h-18'      // 4:3 aspect ratio, large
    }
    
    const dimensions = {
      sm: { width: 96, height: 72 },    // Higher resolution for crisp display
      md: { width: 128, height: 96 },   // Higher resolution for crisp display
      lg: { width: 192, height: 144 }   // Higher resolution for crisp display
    }
    
    const iconSizes = {
      sm: 'h-4 w-4',
      md: 'h-6 w-6',
      lg: 'h-10 w-10'
    }

    if (item.thumbnail_url && item.thumbnail_source !== 'default') {
      return (
        <Image
          src={item.thumbnail_url}
          alt={item.name}
          width={dimensions[size].width}
          height={dimensions[size].height}
          className={`${sizeClasses[size]} object-cover rounded-lg`}
        />
      )
    } else {
      return (
        <div 
          className={`${sizeClasses[size]} rounded-lg flex items-center justify-center`}
          style={{ backgroundColor: item.thumbnail_color || '#3b82f6' }}
        >
          <FolderOpen className={`${iconSizes[size]} text-white`} />
        </div>
      )
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
                    src={getVideoThumbnailUrl({
                      thumbnailSource: video.thumbnailSource,
                      customThumbnailUrl: video.customThumbnailUrl,
                      vimeoThumbnailUrl: video.vimeoThumbnailUrl
                    }) || ''} 
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
          <Button asChild variant="outline">
            <Link href="/admin/video-library/bulk-import">
              <Upload className="h-4 w-4 mr-2" />
              Bulk Import
            </Link>
          </Button>
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
          {videos.map((video) => {
            const isPlaying = playingVideos.has(video.id)
            
            return (
              <Card key={video.id} className="overflow-hidden hover:shadow-lg transition-all">
                <CardHeader className="p-0">
                  <div className="relative">
                    {isPlaying && video.vimeoId ? (
                      // Vimeo Player
                      <div className="aspect-[4/3] w-full">
                        <iframe
                          src={`https://player.vimeo.com/video/${video.vimeoId}?autoplay=1&title=0&byline=0&portrait=0`}
                          width="100%"
                          height="100%"
                          frameBorder="0"
                          allow="autoplay; fullscreen; picture-in-picture"
                          allowFullScreen
                          className="w-full h-full"
                        />
                      </div>
                    ) : (
                      // Thumbnail with play overlay
                      <div className="relative group">
                        <Image
                          src={getVideoThumbnailUrl({
                            thumbnailSource: video.thumbnailSource,
                            customThumbnailUrl: video.customThumbnailUrl,
                            vimeoThumbnailUrl: video.vimeoThumbnailUrl
                          }) || ''}
                          alt={video.title}
                          width={400}
                          height={192}
                          className="w-full h-48 object-cover cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (video.vimeoId) {
                              toggleGridVideoPlay(video.id)
                            }
                          }}
                        />
                        {/* Play button overlay */}
                        {video.vimeoId && (
                          <div 
                            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleGridVideoPlay(video.id)
                            }}
                          >
                            <div className="bg-white bg-opacity-90 group-hover:bg-opacity-100 rounded-full p-3 transform group-hover:scale-110 transition-all shadow-lg">
                              <Play className="h-6 w-6 text-gray-800 ml-0.5" />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Status badge */}
                    <div className="absolute top-2 right-2">
                      <Badge className={getStatusBadge(video.libraryStatus).className} variant="secondary">
                        {getStatusBadge(video.libraryStatus).text}
                      </Badge>
                    </div>
                    
                    {/* Duration badge - only show when not playing */}
                    {!isPlaying && (
                      <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs">
                        {formatDuration(video.vimeoDuration || 0)}
                      </div>
                    )}
                  </div>
                </CardHeader>
              <CardContent 
                className="p-4 cursor-pointer"
                onClick={() => { setSelectedVideo(video); setShowVideoModal(true) }}
              >
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
            )
          })}
        </div>
      ) : (
        <div className="space-y-4">
          {videos.map((video) => (
            <Card key={video.id} className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => { setSelectedVideo(video); setShowVideoModal(true) }}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Image
                    src={getVideoThumbnailUrl({
                      thumbnailSource: video.thumbnailSource,
                      customThumbnailUrl: video.customThumbnailUrl,
                      vimeoThumbnailUrl: video.vimeoThumbnailUrl
                    }) || ''}
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
      {/* Header with action buttons */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Video Categories</h2>
          <p className="text-gray-600">Organize your video library with categories and subcategories</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowCreateCategory(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
          <Button variant="outline" onClick={() => setShowCreateSubcategory(true)}>
            <FolderPlus className="h-4 w-4 mr-2" />
            Add Subcategory
          </Button>
        </div>
      </div>

      {/* Categories List */}
      {categories.length === 0 ? (
        <div className="text-center py-12">
          <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Categories</h3>
          <p className="text-gray-600 mb-4">Create your first category to start organizing videos</p>
          <Button onClick={() => setShowCreateCategory(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Category
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {categories.map((category) => (
            <Card key={category.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getThumbnailDisplay(category)}
                    <div className="flex-1">
                      <CardTitle className="text-lg">{category.name}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{category.video_count} videos</Badge>
                    <Button size="sm" variant="ghost" onClick={() => editCategory(category)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => deleteCategory(category.id, category.name)}
                      disabled={deleting === category.id}
                    >
                      {deleting === category.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-red-600" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              {category.subcategories && category.subcategories.length > 0 && (
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">Subcategories</h4>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => {
                          setSubcategoryForm(prev => ({ ...prev, category_id: category.id }))
                          setShowCreateSubcategory(true)
                        }}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {category.subcategories.map((subcategory) => (
                        <div key={subcategory.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            {getThumbnailDisplay(subcategory, 'sm')}
                            <div className="flex-1">
                              <p className="font-medium text-sm">{subcategory.name}</p>
                              <p className="text-xs text-gray-500">{subcategory.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {subcategory.video_count} videos
                            </Badge>
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => editSubcategory(subcategory)}>
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-6 w-6 p-0"
                              onClick={() => deleteSubcategory(subcategory.id, subcategory.name)}
                              disabled={deleting === subcategory.id}
                            >
                              {deleting === subcategory.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Trash2 className="h-3 w-3 text-red-600" />
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              )}
              
              {(!category.subcategories || category.subcategories.length === 0) && (
                <CardContent className="pt-0">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => {
                      setSubcategoryForm(prev => ({ ...prev, category_id: category.id }))
                      setShowCreateSubcategory(true)
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Subcategory
                  </Button>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )

  // Video detail modal
  const renderVideoModal = () => (
    <Dialog open={showVideoModal} onOpenChange={handleModalClose}>
      <DialogContent className="max-w-6xl w-[95vw] max-h-[90vh] overflow-y-auto">
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
              <div className="relative">
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden max-w-2xl mx-auto">
                  {isVideoPlaying && selectedVideo.vimeoId ? (
                    // Vimeo Player
                    <iframe
                      src={`https://player.vimeo.com/video/${selectedVideo.vimeoId}?autoplay=1&title=0&byline=0&portrait=0`}
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      allow="autoplay; fullscreen; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    />
                  ) : (
                    // Thumbnail with play overlay
                    <div className="relative group h-full">
                      <Image
                        src={getVideoThumbnailUrl({
                          thumbnailSource: selectedVideo.thumbnailSource,
                          customThumbnailUrl: selectedVideo.customThumbnailUrl,
                          vimeoThumbnailUrl: selectedVideo.vimeoThumbnailUrl
                        }) || ''}
                        alt={selectedVideo.title}
                        width={640}
                        height={360}
                        className="w-full h-full object-cover cursor-pointer transition-opacity group-hover:opacity-90"
                        onClick={handlePlayVideo}
                      />
                      {/* Play button overlay */}
                      {selectedVideo.vimeoId && (
                        <div 
                          className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all cursor-pointer"
                          onClick={handlePlayVideo}
                        >
                          <div className="bg-white bg-opacity-90 group-hover:bg-opacity-100 rounded-full p-4 transform group-hover:scale-110 transition-all shadow-lg">
                            <Play className="h-8 w-8 text-gray-800 ml-1" />
                          </div>
                        </div>
                      )}
                      {/* Duration badge */}
                      {selectedVideo.vimeoDuration && !isVideoPlaying && (
                        <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm">
                          {formatDuration(selectedVideo.vimeoDuration)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {!isVideoPlaying && selectedVideo.vimeoId && (
                  <p className="text-center text-sm text-gray-500 mt-2">Click to play video</p>
                )}
              </div>

              {/* Video Info */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

      {/* Category Management Modals */}
      
      {/* Create Category Dialog */}
      <Dialog open={showCreateCategory} onOpenChange={setShowCreateCategory}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="category-name">Name</Label>
              <Input
                id="category-name"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Category name..."
              />
            </div>
            <div>
              <Label htmlFor="category-description">Description</Label>
              <Textarea
                id="category-description"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Category description..."
                rows={3}
              />
            </div>
            <div>
              <Label>Thumbnail</Label>
              <div className="mt-2">
                {/* Preview */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-sm text-gray-600">Preview:</div>
                  {getThumbnailDisplay({
                    thumbnail_url: categoryForm.thumbnail_url,
                    thumbnail_source: categoryForm.thumbnail_source,
                    thumbnail_color: categoryForm.thumbnail_color,
                    name: categoryForm.name || 'New Category'
                  } as Category, 'lg')}
                </div>
                <ThumbnailUpload
                  currentThumbnailUrl={categoryForm.thumbnail_url}
                  thumbnailSource={categoryForm.thumbnail_source}
                  onThumbnailChange={(url, source) => setCategoryForm(prev => ({
                    ...prev,
                    thumbnail_url: url,
                    thumbnail_source: source
                  }))}
                  hideVimeoOption={true}
                />
              </div>
            </div>
            {categoryForm.thumbnail_source === 'default' && (
              <div>
                <Label htmlFor="category-color">Color</Label>
                <Input
                  id="category-color"
                  type="color"
                  value={categoryForm.thumbnail_color}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, thumbnail_color: e.target.value }))}
                  className="w-full h-10"
                />
              </div>
            )}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => {
                setShowCreateCategory(false)
                resetCategoryForm()
              }}>
                Cancel
              </Button>
              <Button onClick={createCategory} disabled={!categoryForm.name.trim() || saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Create Category
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Subcategory Dialog */}
      <Dialog open={showCreateSubcategory} onOpenChange={setShowCreateSubcategory}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Subcategory</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="subcategory-category">Parent Category</Label>
              <Select
                value={subcategoryForm.category_id}
                onValueChange={(value) => setSubcategoryForm(prev => ({ ...prev, category_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select parent category..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="subcategory-name">Name</Label>
              <Input
                id="subcategory-name"
                value={subcategoryForm.name}
                onChange={(e) => setSubcategoryForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Subcategory name..."
              />
            </div>
            <div>
              <Label htmlFor="subcategory-description">Description</Label>
              <Textarea
                id="subcategory-description"
                value={subcategoryForm.description}
                onChange={(e) => setSubcategoryForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Subcategory description..."
                rows={3}
              />
            </div>
            <div>
              <Label>Thumbnail</Label>
              <div className="mt-2">
                {/* Preview */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-sm text-gray-600">Preview:</div>
                  {getThumbnailDisplay({
                    thumbnail_url: subcategoryForm.thumbnail_url,
                    thumbnail_source: subcategoryForm.thumbnail_source,
                    thumbnail_color: subcategoryForm.thumbnail_color,
                    name: subcategoryForm.name || 'New Subcategory'
                  } as Subcategory, 'lg')}
                </div>
                <ThumbnailUpload
                  currentThumbnailUrl={subcategoryForm.thumbnail_url}
                  thumbnailSource={subcategoryForm.thumbnail_source}
                  onThumbnailChange={(url, source) => setSubcategoryForm(prev => ({
                    ...prev,
                    thumbnail_url: url,
                    thumbnail_source: source
                  }))}
                  hideVimeoOption={true}
                />
              </div>
            </div>
            {subcategoryForm.thumbnail_source === 'default' && (
              <div>
                <Label htmlFor="subcategory-color">Color</Label>
                <Input
                  id="subcategory-color"
                  type="color"
                  value={subcategoryForm.thumbnail_color}
                  onChange={(e) => setSubcategoryForm(prev => ({ ...prev, thumbnail_color: e.target.value }))}
                  className="w-full h-10"
                />
              </div>
            )}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => {
                setShowCreateSubcategory(false)
                resetSubcategoryForm()
              }}>
                Cancel
              </Button>
              <Button 
                onClick={createSubcategory} 
                disabled={!subcategoryForm.name.trim() || !subcategoryForm.category_id || saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Create Subcategory
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={showEditCategory} onOpenChange={setShowEditCategory}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-category-name">Name</Label>
              <Input
                id="edit-category-name"
                value={editCategoryForm.name}
                onChange={(e) => setEditCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Category name..."
              />
            </div>
            <div>
              <Label htmlFor="edit-category-description">Description</Label>
              <Textarea
                id="edit-category-description"
                value={editCategoryForm.description}
                onChange={(e) => setEditCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Category description..."
                rows={3}
              />
            </div>
            <div>
              <Label>Thumbnail</Label>
              <div className="mt-2">
                {/* Preview */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-sm text-gray-600">Preview:</div>
                  {getThumbnailDisplay({
                    thumbnail_url: editCategoryForm.thumbnail_url,
                    thumbnail_source: editCategoryForm.thumbnail_source,
                    thumbnail_color: editCategoryForm.thumbnail_color,
                    name: editCategoryForm.name || 'Category'
                  } as Category, 'lg')}
                </div>
                <ThumbnailUpload
                  currentThumbnailUrl={editCategoryForm.thumbnail_url}
                  thumbnailSource={editCategoryForm.thumbnail_source}
                  onThumbnailChange={(url, source) => setEditCategoryForm(prev => ({
                    ...prev,
                    thumbnail_url: url,
                    thumbnail_source: source
                  }))}
                  hideVimeoOption={true}
                />
              </div>
            </div>
            {editCategoryForm.thumbnail_source === 'default' && (
              <div>
                <Label htmlFor="edit-category-color">Color</Label>
                <Input
                  id="edit-category-color"
                  type="color"
                  value={editCategoryForm.thumbnail_color}
                  onChange={(e) => setEditCategoryForm(prev => ({ ...prev, thumbnail_color: e.target.value }))}
                  className="w-full h-10"
                />
              </div>
            )}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowEditCategory(false)}>
                Cancel
              </Button>
              <Button onClick={updateCategory} disabled={!editCategoryForm.name.trim() || saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Update Category
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Subcategory Dialog */}
      <Dialog open={showEditSubcategory} onOpenChange={setShowEditSubcategory}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Subcategory</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-subcategory-category">Parent Category</Label>
              <Select
                value={editSubcategoryForm.category_id}
                onValueChange={(value) => setEditSubcategoryForm(prev => ({ ...prev, category_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select parent category..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-subcategory-name">Name</Label>
              <Input
                id="edit-subcategory-name"
                value={editSubcategoryForm.name}
                onChange={(e) => setEditSubcategoryForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Subcategory name..."
              />
            </div>
            <div>
              <Label htmlFor="edit-subcategory-description">Description</Label>
              <Textarea
                id="edit-subcategory-description"
                value={editSubcategoryForm.description}
                onChange={(e) => setEditSubcategoryForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Subcategory description..."
                rows={3}
              />
            </div>
            <div>
              <Label>Thumbnail</Label>
              <div className="mt-2">
                {/* Preview */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-sm text-gray-600">Preview:</div>
                  {getThumbnailDisplay({
                    thumbnail_url: editSubcategoryForm.thumbnail_url,
                    thumbnail_source: editSubcategoryForm.thumbnail_source,
                    thumbnail_color: editSubcategoryForm.thumbnail_color,
                    name: editSubcategoryForm.name || 'Subcategory'
                  } as Subcategory, 'lg')}
                </div>
                <ThumbnailUpload
                  currentThumbnailUrl={editSubcategoryForm.thumbnail_url}
                  thumbnailSource={editSubcategoryForm.thumbnail_source}
                  onThumbnailChange={(url, source) => setEditSubcategoryForm(prev => ({
                    ...prev,
                    thumbnail_url: url,
                    thumbnail_source: source
                  }))}
                  hideVimeoOption={true}
                />
              </div>
            </div>
            {editSubcategoryForm.thumbnail_source === 'default' && (
              <div>
                <Label htmlFor="edit-subcategory-color">Color</Label>
                <Input
                  id="edit-subcategory-color"
                  type="color"
                  value={editSubcategoryForm.thumbnail_color}
                  onChange={(e) => setEditSubcategoryForm(prev => ({ ...prev, thumbnail_color: e.target.value }))}
                  className="w-full h-10"
                />
              </div>
            )}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowEditSubcategory(false)}>
                Cancel
              </Button>
              <Button 
                onClick={updateSubcategory} 
                disabled={!editSubcategoryForm.name.trim() || !editSubcategoryForm.category_id || saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Update Subcategory
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reassignment Dialog */}
      <Dialog open={showReassignDialog} onOpenChange={(open) => {
        if (!open) {
          setShowReassignDialog(false)
          setReassignmentData(null)
          setReassignForm({ newCategoryId: '', newSubcategoryId: '' })
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Reassign Videos
            </DialogTitle>
          </DialogHeader>
          {reassignmentData && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  <strong>&quot;{reassignmentData.name}&quot;</strong> contains <strong>{reassignmentData.videoCount}</strong> video{reassignmentData.videoCount === 1 ? '' : 's'}.
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  Please choose where to move {reassignmentData.videoCount === 1 ? 'it' : 'them'} before deletion.
                </p>
              </div>

              <div>
                <Label htmlFor="reassign-category">Move videos to category</Label>
                <Select
                  value={reassignForm.newCategoryId}
                  onValueChange={(value) => setReassignForm(prev => ({ 
                    ...prev, 
                    newCategoryId: value,
                    newSubcategoryId: '' // Reset subcategory when category changes
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select destination category..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categories
                      .filter(cat => cat.id !== reassignmentData.id) // Don't show the category being deleted
                      .map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {reassignForm.newCategoryId && (
                <div>
                  <Label htmlFor="reassign-subcategory">Move to subcategory (optional)</Label>
                  <Select
                    value={reassignForm.newSubcategoryId}
                    onValueChange={(value) => setReassignForm(prev => ({ 
                      ...prev, 
                      newSubcategoryId: value 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select destination subcategory..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No subcategory</SelectItem>
                      {categories
                        .find(cat => cat.id === reassignForm.newCategoryId)
                        ?.subcategories
                        ?.filter(sub => sub.id !== reassignmentData.id) // Don't show the subcategory being deleted
                        ?.map((subcategory) => (
                          <SelectItem key={subcategory.id} value={subcategory.id}>
                            {subcategory.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowReassignDialog(false)
                    setReassignmentData(null)
                    setReassignForm({ newCategoryId: '', newSubcategoryId: '' })
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleReassignAndDelete}
                  disabled={!reassignForm.newCategoryId || deleting === reassignmentData.id}
                >
                  {deleting === reassignmentData.id ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Moving & Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Move Videos & Delete {reassignmentData.type === 'category' ? 'Category' : 'Subcategory'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}