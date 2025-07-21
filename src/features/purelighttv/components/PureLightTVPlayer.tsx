'use client'

import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Play, Calendar, Clock } from 'lucide-react'
import type { ProcessedPureLightTVVideo } from '../types'
import { PureLightTVService } from '../services/pureLightTVService'

// Video Information Component
interface VideoInfoSectionProps {
  video: ProcessedPureLightTVVideo
  isDesktop?: boolean
}

function VideoInfoSection({ video, isDesktop = false }: VideoInfoSectionProps) {
  return (
    <div className={isDesktop ? "bg-gray-800 rounded-xl p-6 shadow-lg" : ""}>
      {/* Title */}
      <div className="mb-4">
        <h1 className={`${isDesktop ? 'text-2xl' : 'text-xl'} font-bold text-white leading-tight mb-3`}>
          {video.title}
        </h1>
      </div>

      {/* Metadata */}
      <div className="space-y-4">
        {/* PureLightTV Badge */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3 py-1.5 bg-blue-900/30 text-blue-300 rounded-full text-sm font-medium">
            PureLightTV
          </span>
          {video.tags && video.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="px-3 py-1.5 bg-gray-700 text-gray-300 rounded-full text-sm font-medium">
              {tag}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{PureLightTVService.formatDate(video.createdAt)}</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{PureLightTVService.formatDuration(video.duration)}</span>
          </div>
          {video.playCount && (
            <>
              <span>•</span>
              <span>{video.playCount.toLocaleString()} views</span>
            </>
          )}
        </div>

        {/* Description */}
        {video.description && (
          <div className="border-t border-gray-700 pt-4">
            <h3 className="text-white font-semibold mb-3">Description</h3>
            <p className="text-gray-300 leading-relaxed">
              {video.description}
            </p>
          </div>
        )}

        {/* All Tags */}
        {video.tags && video.tags.length > 2 && (
          <div className="border-t border-gray-700 pt-4">
            <h3 className="text-white font-semibold mb-3">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {video.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-gray-300 transition-colors cursor-pointer"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Previous Videos Component
interface PreviousVideosProps {
  videos: ProcessedPureLightTVVideo[]
  onVideoSelect: (video: ProcessedPureLightTVVideo) => void
  isDesktop?: boolean
}

function PreviousVideos({ videos, onVideoSelect, isDesktop = false }: PreviousVideosProps) {
  if (videos.length === 0) return null

  return (
    <div className={isDesktop ? "bg-gray-800 rounded-xl p-6 shadow-lg" : "px-4"}>
      <h2 className="text-xl font-bold text-white mb-4">Previous Videos</h2>
      <div className="grid grid-cols-1 gap-4">
        {videos.map((video) => (
          <div
            key={video.id}
            onClick={() => onVideoSelect(video)}
            className="group cursor-pointer bg-gray-700/50 hover:bg-gray-700 rounded-lg p-4 transition-colors"
          >
            <div className="flex items-start gap-4">
              {/* Thumbnail */}
              <div className="relative w-32 h-18 bg-gray-600 rounded-lg overflow-hidden flex-shrink-0">
                {video.thumbnailUrl ? (
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Play className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                {/* Play overlay */}
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  <Play className="w-6 h-6 text-white opacity-80 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>

              {/* Video info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white text-base leading-tight mb-2 line-clamp-2">
                  {video.title}
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                  <span>{PureLightTVService.formatDate(video.createdAt)}</span>
                  <span>•</span>
                  <span>{PureLightTVService.formatDuration(video.duration)}</span>
                </div>
                {video.playCount && (
                  <div className="text-sm text-gray-500">
                    {video.playCount.toLocaleString()} views
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

interface PureLightTVPlayerProps {
  featuredVideo: ProcessedPureLightTVVideo
  previousVideos: ProcessedPureLightTVVideo[]
  onBack?: () => void
  onVideoChange?: (video: ProcessedPureLightTVVideo) => void
}

export function PureLightTVPlayer({ 
  featuredVideo, 
  previousVideos, 
  onBack, 
  onVideoChange 
}: PureLightTVPlayerProps) {
  const [currentVideo, setCurrentVideo] = useState(featuredVideo)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDesktop, setIsDesktop] = useState(false)
  
  const playerRef = useRef<HTMLIFrameElement>(null)

  // Check if desktop
  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024)
    }
    
    checkDesktop()
    window.addEventListener('resize', checkDesktop)
    
    return () => window.removeEventListener('resize', checkDesktop)
  }, [])

  // Handle video selection
  const handleVideoSelect = (video: ProcessedPureLightTVVideo) => {
    setCurrentVideo(video)
    setIsLoading(true)
    onVideoChange?.(video)
  }

  // Handle iframe load
  const handleIframeLoad = () => {
    setIsLoading(false)
    setError(null)
  }

  const handleIframeError = () => {
    setError('Failed to load video player')
    setIsLoading(false)
  }

  if (isDesktop) {
    return (
      <div className="min-h-screen bg-black">
        {/* Header */}
        <div className="bg-gray-900 border-b border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Videos</span>
            </button>
            <h1 className="text-xl font-bold text-white">PureLightTV</h1>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="flex max-w-screen-2xl mx-auto">
          {/* Main content */}
          <div className="flex-1 p-6">
            {/* Video Player */}
            <div className="relative aspect-video bg-black rounded-xl overflow-hidden mb-6">
              {isLoading && (
                <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                </div>
              )}
              {error && (
                <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                  <div className="text-center text-white">
                    <p className="text-lg font-semibold mb-2">Error Loading Video</p>
                    <p className="text-gray-400">{error}</p>
                  </div>
                </div>
              )}
              <iframe
                ref={playerRef}
                src={currentVideo.embedUrl}
                className="w-full h-full"
                frameBorder="0"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                onLoad={handleIframeLoad}
                onError={handleIframeError}
              />
            </div>

            {/* Video Info */}
            <VideoInfoSection video={currentVideo} isDesktop={true} />
          </div>

          {/* Sidebar */}
          <div className="w-96 p-6 border-l border-gray-700">
            <PreviousVideos
              videos={previousVideos}
              onVideoSelect={handleVideoSelect}
              isDesktop={true}
            />
          </div>
        </div>
      </div>
    )
  }

  // Mobile Layout
  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </button>
          <h1 className="text-lg font-bold text-white">PureLightTV</h1>
        </div>
      </div>

      {/* Video Player */}
      <div className="relative aspect-video bg-black">
        {isLoading && (
          <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
            <div className="text-center text-white p-4">
              <p className="font-semibold mb-2">Error Loading Video</p>
              <p className="text-gray-400 text-sm">{error}</p>
            </div>
          </div>
        )}
        <iframe
          ref={playerRef}
          src={currentVideo.embedUrl}
          className="w-full h-full"
          frameBorder="0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          onLoad={handleIframeLoad}
          onError={handleIframeError}
        />
      </div>

      {/* Video Info */}
      <div className="px-4 py-6">
        <VideoInfoSection video={currentVideo} />
      </div>

      {/* Previous Videos */}
      <div className="pb-6">
        <PreviousVideos
          videos={previousVideos}
          onVideoSelect={handleVideoSelect}
        />
      </div>
    </div>
  )
}