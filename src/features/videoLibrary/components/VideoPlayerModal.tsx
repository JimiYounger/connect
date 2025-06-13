'use client'

import { useState, useRef, useEffect } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X, Play, Clock, SkipForward } from 'lucide-react'

interface VideoPlayerModalProps {
  isOpen: boolean
  onClose: () => void
  video: {
    id: string
    title: string
    description?: string
    vimeo_id?: string
    vimeo_duration?: number
    vimeo_thumbnail_url?: string
  }
  startTime?: number // Optional timestamp to start playback
  highlight?: string // Text to show what segment was matched
}

export function VideoPlayerModal({ 
  isOpen, 
  onClose, 
  video, 
  startTime, 
  highlight 
}: VideoPlayerModalProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [isLoading, setIsLoading] = useState(true)

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'Unknown'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatTimestamp = (seconds?: number) => {
    if (!seconds) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Build Vimeo embed URL with optional start time
  const embedUrl = video.vimeo_id 
    ? `https://player.vimeo.com/video/${video.vimeo_id}?autoplay=1&title=0&byline=0&portrait=0${
        startTime ? `&t=${Math.floor(startTime)}s` : ''
      }`
    : null

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true)
    }
  }, [isOpen])

  const handleIframeLoad = () => {
    setIsLoading(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] p-0 overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b">
            <div className="flex-1">
              <DialogTitle className="text-xl font-semibold line-clamp-2 mb-2">
                {video.title}
              </DialogTitle>
              
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{formatDuration(video.vimeo_duration)}</span>
                </div>
                
                {startTime && (
                  <div className="flex items-center gap-1">
                    <SkipForward className="h-4 w-4" />
                    <span>Starting at {formatTimestamp(startTime)}</span>
                  </div>
                )}
                
                {video.vimeo_id && (
                  <Badge variant="outline">
                    Vimeo ID: {video.vimeo_id}
                  </Badge>
                )}
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="flex-shrink-0 ml-4"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Video Player */}
          <div className="flex-1 bg-black relative">
            {embedUrl ? (
              <>
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                    <div className="text-center text-white">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                      <p>Loading video...</p>
                    </div>
                  </div>
                )}
                
                <iframe
                  ref={iframeRef}
                  src={embedUrl}
                  className="w-full h-full min-h-[400px]"
                  frameBorder="0"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                  onLoad={handleIframeLoad}
                  title={video.title}
                />
              </>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-400">
                <div className="text-center">
                  <Play className="h-12 w-12 mx-auto mb-4" />
                  <p>Video not available</p>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Info */}
          <div className="p-6 border-t bg-gray-50">
            {highlight && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm font-medium text-yellow-800 mb-1">Matched Content:</p>
                <p className="text-sm text-yellow-700 italic">&quot;{highlight}&quot;</p>
              </div>
            )}
            
            {video.description && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Description:</p>
                <p className="text-sm text-gray-600">{video.description}</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}