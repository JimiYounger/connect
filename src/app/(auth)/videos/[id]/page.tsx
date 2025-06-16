'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Share, Bookmark, MoreVertical } from 'lucide-react'
import { useAuth } from '@/features/auth/context/auth-context'
import { useProfile } from '@/features/users/hooks/useProfile'
import { useVideoPermissions } from '@/features/videoViewer/hooks/useVideoPermissions'
import { VideoPlayer } from '@/features/videoViewer/components/VideoPlayer'
import { VideoPermissionGate } from '@/features/videoViewer/components/VideoPermissionGate'
import { VideoLibraryService } from '@/features/videoViewer/services/videoLibraryService'
import { motion } from 'framer-motion'
import type { VideoForViewing } from '@/features/videoViewer/types'

export default function VideoWatchPage() {
  const params = useParams()
  const router = useRouter()
  const videoId = params.id as string
  
  const { session } = useAuth()
  const { profile } = useProfile(session)
  const { userPermissions, isLoading: permissionsLoading } = useVideoPermissions(profile)
  
  const [video, setVideo] = useState<VideoForViewing | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showActions, setShowActions] = useState(false)

  // Load video data
  useEffect(() => {
    const loadVideo = async () => {
      if (!userPermissions || !videoId) return

      try {
        setLoading(true)
        setError(null)
        
        console.log('Mobile debug - Loading video:', { videoId, userPermissions })
        const realVideo = await VideoLibraryService.getVideoById(videoId, userPermissions)
        
        console.log('Mobile debug - Video loaded:', realVideo)
        
        if (!realVideo) {
          console.log('Mobile debug - Video not found or no permission')
          setError('Video not found or you do not have permission to view it')
          return
        }
        
        setVideo(realVideo)
      } catch (err) {
        console.error('Error loading video:', err)
        setError('Failed to load video')
      } finally {
        setLoading(false)
      }
    }

    loadVideo()
  }, [userPermissions, videoId])

  const handleBack = () => {
    router.back()
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: video?.title,
        text: video?.description,
        url: window.location.href
      })
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
      // You could show a toast notification here
    }
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Authentication Required</h1>
          <p className="text-gray-400">Please sign in to watch videos.</p>
        </div>
      </div>
    )
  }

  if (permissionsLoading || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    )
  }

  if (error || !video) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Video Not Found</h1>
          <p className="text-gray-400 mb-6">{error || 'The requested video could not be found.'}</p>
          <button
            onClick={handleBack}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <motion.div 
      className="min-h-screen bg-black"
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0 }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 30,
        duration: 0.4
      }}
    >
      {/* Mobile Header */}
      <motion.div 
        className="sticky top-0 z-40 bg-black/90 backdrop-blur-sm"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={handleBack}
            className="w-8 h-8 rounded-full bg-gray-800/60 hover:bg-gray-700/80 flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleShare}
              className="w-8 h-8 rounded-full bg-gray-800/60 hover:bg-gray-700/80 flex items-center justify-center transition-colors"
            >
              <Share className="w-4 h-4 text-white" />
            </button>
            
            <button
              onClick={() => setShowActions(!showActions)}
              className="w-8 h-8 rounded-full bg-gray-800/60 hover:bg-gray-700/80 flex items-center justify-center transition-colors"
            >
              <MoreVertical className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Video Player Section */}
      <motion.div 
        className="px-2 pb-4"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4, type: "spring", stiffness: 300, damping: 30 }}
      >
        <VideoPermissionGate
          video={video}
          profile={profile}
          showDebugInfo={false}
        >
          <VideoPlayer
            video={video}
            autoplay={false}
            onComplete={() => console.log('Video completed!')}
            onProgress={(time) => console.log('Progress:', time)}
            hideVideoInfo={true}
            profile={profile}
          />
        </VideoPermissionGate>
      </motion.div>

      {/* Video Information */}
      <div className="px-4 pb-8">
        {/* Title */}
        <div className="mb-4">
          <h1 className="text-xl font-bold text-white leading-tight mb-3">
            {video.title}
          </h1>
        </div>

        {/* Metadata */}
        <div className="space-y-3">
          {/* Category & Date - Compact Layout */}
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {video.category && (
              <span className="px-2 py-1 bg-blue-600 rounded-full text-white text-xs font-medium">
                {video.category.name}
              </span>
            )}
            {video.subcategory && (
              <span className="px-2 py-1 bg-gray-700 rounded-full text-gray-300 text-xs">
                {video.subcategory.name}
              </span>
            )}
            <span className="text-gray-400 text-xs ml-1">
              {formatDate(video.createdAt)}
            </span>
          </div>

          {/* Description - Expandable */}
          {video.description && (
            <div className="mt-4">
              <p className="text-gray-300 leading-relaxed text-sm">
                {video.description}
              </p>
            </div>
          )}

          {/* Tags - Compact */}
          {video.tags && video.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {video.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-gray-800 rounded-full text-xs text-gray-400"
                >
                  #{tag}
                </span>
              ))}
              {video.tags.length > 3 && (
                <span className="px-2 py-1 text-xs text-gray-500">
                  +{video.tags.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action Menu Overlay */}
      {showActions && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end" onClick={() => setShowActions(false)}>
          <div className="bg-gray-900 w-full rounded-t-3xl p-6 space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 bg-gray-600 rounded-full mx-auto mb-4"></div>
            
            <button className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-gray-800 transition-colors">
              <Bookmark className="w-5 h-5 text-white" />
              <span className="text-white font-medium">Save to Watch Later</span>
            </button>
            
            <button 
              onClick={handleShare}
              className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-gray-800 transition-colors"
            >
              <Share className="w-5 h-5 text-white" />
              <span className="text-white font-medium">Share Video</span>
            </button>
            
            <button 
              onClick={() => setShowActions(false)}
              className="w-full p-4 mt-6 text-gray-400 text-center font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </motion.div>
  )
}