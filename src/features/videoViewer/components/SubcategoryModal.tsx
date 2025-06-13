'use client'

import { useState, useEffect } from 'react'
import { X, Play, Clock, Calendar, CheckCircle } from 'lucide-react'
import { VideoLibraryService } from '@/features/videoViewer/services/videoLibraryService'
import { WatchTrackingService } from '@/features/videoViewer/services/watchTrackingService'
import type { VideoForViewing, VideoWatchProgress } from '@/features/videoViewer/types'
import type { UserPermissions } from '@/features/permissions/types'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/features/auth/context/auth-context'
import { useProfile } from '@/features/users/hooks/useProfile'
import Image from 'next/image'

interface VideoSubcategory {
  id: string
  name: string
  thumbnailUrl?: string
  thumbnailColor?: string
  videoCount: number
}

interface SubcategoryModalProps {
  subcategory: VideoSubcategory
  isOpen: boolean
  onClose: () => void
  userPermissions: UserPermissions | null
}

export function SubcategoryModal({ subcategory, isOpen, onClose, userPermissions }: SubcategoryModalProps) {
  const router = useRouter()
  const { session } = useAuth()
  const { profile } = useProfile(session)
  const [videos, setVideos] = useState<VideoForViewing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [watchProgress, setWatchProgress] = useState<Map<string, VideoWatchProgress>>(new Map())

  // Load videos for this subcategory
  useEffect(() => {
    const loadVideos = async () => {
      if (!isOpen || !userPermissions) return

      try {
        setLoading(true)
        setError(null)
        
        const realVideos = await VideoLibraryService.getVideosForSubcategory(
          subcategory.id,
          userPermissions
        )
        
        setVideos(realVideos)
        
        // Load watch progress for these videos
        if (profile?.id && realVideos.length > 0) {
          try {
            const videoFileIds = realVideos.map(v => v.id)
            const progressData = await WatchTrackingService.getUserWatchHistory(profile.id, videoFileIds)
            
            const progressMap = new Map<string, VideoWatchProgress>()
            progressData.forEach(progress => {
              progressMap.set(progress.videoFileId, progress)
            })
            setWatchProgress(progressMap)
          } catch (progressErr) {
            console.error('Error loading watch progress:', progressErr)
          }
        }
      } catch (err) {
        console.error('Error loading videos:', err)
        setError('Failed to load videos')
      } finally {
        setLoading(false)
      }
    }

    loadVideos()
  }, [isOpen, subcategory.id, userPermissions, profile?.id])

  const handleVideoClick = (video: VideoForViewing) => {
    router.push(`/videos/${video.id}`)
  }

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end md:items-center justify-center">
      {/* Modal Container */}
      <div className="bg-gray-900 w-full max-w-4xl max-h-[90vh] md:rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-white">{subcategory.name}</h2>
            <p className="text-gray-400 mt-1">
              {subcategory.videoCount} video{subcategory.videoCount !== 1 ? 's' : ''} available
              {watchProgress.size > 0 && (
                <span className="ml-2">
                  • {Array.from(watchProgress.values()).filter(p => p.completed).length} completed
                </span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-400">{error}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {videos.map((video) => {
                const progress = watchProgress.get(video.id)
                const isCompleted = progress?.completed || false
                const percentComplete = progress?.percentComplete || 0
                
                return (
                  <div
                    key={video.id}
                    onClick={() => handleVideoClick(video)}
                    className="flex gap-4 p-4 rounded-xl bg-gray-800 hover:bg-gray-750 cursor-pointer transition-colors group"
                  >
                  {/* Video Thumbnail */}
                  <div className="relative flex-none w-32 md:w-40 aspect-video rounded-lg overflow-hidden bg-gray-700">
                    {video.vimeoThumbnailUrl ? (
                      <Image
                        src={video.vimeoThumbnailUrl}
                        alt={video.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 128px, 160px"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                        <Play className="w-8 h-8 text-white opacity-80" />
                      </div>
                    )}
                    
                    {/* Play Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                        <Play className="w-5 h-5 text-white ml-0.5" />
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {percentComplete > 0 && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/60">
                        <div 
                          className="h-full bg-blue-500 transition-all duration-300"
                          style={{ width: `${percentComplete}%` }}
                        />
                      </div>
                    )}

                    {/* Completion Badge */}
                    {isCompleted && (
                      <div className="absolute top-2 left-2 bg-green-600 rounded-full p-1">
                        <CheckCircle className="w-3 h-3 text-white" />
                      </div>
                    )}

                    {/* Duration Badge */}
                    {video.vimeoDuration && (
                      <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm rounded px-2 py-1">
                        <span className="text-white text-xs font-medium">
                          {formatDuration(video.vimeoDuration)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Video Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold text-lg leading-tight mb-2 line-clamp-2">
                      {video.title}
                    </h3>
                    
                    {video.description && (
                      <p className="text-gray-400 text-sm leading-relaxed mb-3 line-clamp-3">
                        {video.description}
                      </p>
                    )}

                    {/* Metadata */}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      {video.vimeoDuration && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatDuration(video.vimeoDuration)}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(video.createdAt).toLocaleDateString()}</span>
                      </div>
                      
                      {/* Progress Status */}
                      {isCompleted ? (
                        <div className="flex items-center gap-1 text-green-400">
                          <CheckCircle className="w-3 h-3" />
                          <span>Completed</span>
                        </div>
                      ) : percentComplete > 0 ? (
                        <div className="flex items-center gap-1 text-blue-400">
                          <Play className="w-3 h-3" />
                          <span>{Math.round(percentComplete)}% watched</span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}