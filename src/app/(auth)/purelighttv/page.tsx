'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/features/auth/context/auth-context'
import { useProfile } from '@/features/users/hooks/useProfile'
import { PureLightTVPlayer } from '@/features/purelighttv/components/PureLightTVPlayer'
import { PureLightTVService } from '@/features/purelighttv/services/pureLightTVService'
import type { ProcessedPureLightTVVideo, PureLightTVPageState } from '@/features/purelighttv/types'

export default function PureLightTVPage() {
  const router = useRouter()
  const { session } = useAuth()
  const { profile } = useProfile(session)
  
  // Hydration safety: ensure we're client-side before rendering dynamic content
  const [isHydrated, setIsHydrated] = useState(false)
  const [state, setState] = useState<PureLightTVPageState>({
    featuredVideo: null,
    previousVideos: [],
    loading: true,
    error: null,
    isHydrated: false
  })

  // Hydration check - this only runs on client-side
  useEffect(() => {
    setIsHydrated(true)
    setState(prev => ({ ...prev, isHydrated: true }))
  }, [])

  // Load PureLightTV videos
  useEffect(() => {
    const loadVideos = async () => {
      if (!isHydrated) return

      try {
        setState(prev => ({ ...prev, loading: true, error: null }))
        
        console.log('Loading PureLightTV videos...')
        const { featuredVideo, previousVideos } = await PureLightTVService.getFeaturedAndPreviousVideos()
        
        console.log('PureLightTV videos loaded:', { 
          featuredVideo: featuredVideo?.title, 
          previousCount: previousVideos.length 
        })
        
        if (!featuredVideo) {
          setState(prev => ({ 
            ...prev, 
            error: 'No videos found in PureLightTV showcase',
            loading: false
          }))
          return
        }
        
        setState(prev => ({
          ...prev,
          featuredVideo,
          previousVideos,
          loading: false
        }))
      } catch (err) {
        console.error('Error loading PureLightTV videos:', err)
        setState(prev => ({
          ...prev,
          error: 'Failed to load PureLightTV videos',
          loading: false
        }))
      }
    }

    loadVideos()
  }, [isHydrated])

  const handleBack = () => {
    router.push('/videos')
  }

  const handleVideoChange = (video: ProcessedPureLightTVVideo) => {
    console.log('Video changed to:', video.title)
    // You could add analytics tracking here
  }

  // Show loading until hydration is complete - prevents SSR/client mismatch
  if (!isHydrated || !session) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading PureLightTV...</p>
        </div>
      </div>
    )
  }

  if (state.loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading PureLightTV content...</p>
        </div>
      </div>
    )
  }

  if (state.error || !state.featuredVideo) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">PureLightTV Unavailable</h1>
          <p className="text-gray-400 mb-6">
            {state.error || 'No content available at this time.'}
          </p>
          <button
            onClick={handleBack}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Video Library
          </button>
        </div>
      </div>
    )
  }

  console.log('Rendering PureLightTV page:', { 
    featuredVideo: state.featuredVideo?.title,
    previousVideosCount: state.previousVideos.length,
    hasProfile: !!profile 
  })

  return (
    <PureLightTVPlayer
      featuredVideo={state.featuredVideo}
      previousVideos={state.previousVideos}
      onBack={handleBack}
      onVideoChange={handleVideoChange}
    />
  )
}