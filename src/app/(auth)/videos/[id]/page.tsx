'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/features/auth/context/auth-context'
import { useProfile } from '@/features/users/hooks/useProfile'
import { useVideoPermissions } from '@/features/videoViewer/hooks/useVideoPermissions'
import { VideoPlayer } from '@/features/videoViewer/components/VideoPlayer'
import { VideoPermissionGate } from '@/features/videoViewer/components/VideoPermissionGate'
import { VideoLibraryService } from '@/features/videoViewer/services/videoLibraryService'
import type { VideoForViewing } from '@/features/videoViewer/types'

export default function VideoWatchPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const videoId = params.id as string
  
  console.log('VideoWatchPage - Rendered with videoId:', videoId)
  
  const { session } = useAuth()
  const { profile } = useProfile(session)
  const { userPermissions, isLoading: permissionsLoading } = useVideoPermissions(profile)
  
  const [video, setVideo] = useState<VideoForViewing | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
    const from = searchParams.get('from')
    
    if (from === 'search') {
      // User came from search modal, restore search modal with query
      const query = searchParams.get('query') || ''
      router.push(`/videos?showSearch=true&query=${encodeURIComponent(query)}`)
    } else if (from === 'subcategory') {
      // User came from subcategory modal, restore subcategory modal
      const subcategoryId = searchParams.get('subcategoryId')
      const subcategoryName = searchParams.get('subcategoryName') || ''
      if (subcategoryId) {
        router.push(`/videos?showSubcategory=${subcategoryId}&subcategoryName=${encodeURIComponent(subcategoryName)}`)
      } else {
        router.push('/videos')
      }
    } else {
      // No specific source, go to main video library
      router.push('/videos')
    }
  }

  if (!session) {
    console.log('Mobile debug - No session, showing auth required')
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
    console.log('Mobile debug - Still loading:', { permissionsLoading, loading, videoId })
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    )
  }

  if (error || !video) {
    console.log('Mobile debug - Error or no video:', { error, hasVideo: !!video, videoId })
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

  console.log('Mobile debug - Rendering video page:', { 
    videoId, 
    videoTitle: video?.title, 
    hasVideo: !!video,
    hasProfile: !!profile 
  })

  return (
    <VideoPermissionGate
      video={video}
      profile={profile}
      showDebugInfo={false}
    >
      <VideoPlayer
        video={video}
        onBack={handleBack}
        profile={profile}
      />
    </VideoPermissionGate>
  )
}