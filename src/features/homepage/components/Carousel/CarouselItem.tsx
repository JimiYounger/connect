// src/features/homepage/components/Carousel/CarouselItem.tsx
'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { Play } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { CarouselBannerDetailed } from '@/features/content/types'

interface CarouselItemProps {
  banner: CarouselBannerDetailed
  isActive: boolean
  hideOverlay?: boolean
}

export function CarouselItem({ banner, isActive, hideOverlay = false }: CarouselItemProps) {
  const [loaded, setLoaded] = useState(false)
  const router = useRouter()
  
  useEffect(() => {
    // Reset loaded state when banner changes
    setLoaded(false)
  }, [banner.id])

  const handleBannerClick = async () => {
    if (banner.click_behavior === 'video' && (banner.video_id || banner.vimeo_video_id)) {
      let videoId = banner.video_id
      
      // If we have a vimeo_video_id but no video_id, look up the video by vimeo_id
      if (!videoId && banner.vimeo_video_id) {
        try {
          const response = await fetch(`/api/video-library/by-vimeo-id/${banner.vimeo_video_id}`)
          if (response.ok) {
            const video = await response.json()
            videoId = video.id
          }
        } catch (error) {
          console.error('Failed to look up video by Vimeo ID:', error)
          return
        }
      }
      
      if (videoId) {
        router.push(`/videos/${videoId}`)
      }
    } else if (banner.click_behavior === 'url' && banner.url) {
      if (banner.open_in_iframe) {
        // Handle iframe opening (if needed)
        console.log('Opening in iframe:', banner.url)
      } else {
        window.open(banner.url, '_blank')
      }
    }
  }

  // Video banner content
  if (banner.click_behavior === 'video' && (banner.video_id || banner.vimeo_video_id)) {
    return (
      <div className={`${isActive ? '' : 'hidden'} absolute inset-0`}>
        <div 
          className="relative w-full h-full overflow-hidden rounded-lg cursor-pointer group"
          style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.5s ease-in-out' }}
          onClick={handleBannerClick}
        >
          {banner.banner_url && (
            <Image
              src={banner.banner_url}
              alt={banner.title || 'Video banner'}
              fill
              sizes="(max-width: 1023px) 100vw, 992px"
              quality={95}
              priority
              className="object-cover"
              onLoad={() => setLoaded(true)}
            />
          )}
          
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
            <Play className="w-16 h-16 text-white" />
          </div>
          
          {!hideOverlay && (
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              {banner.title && (
                <h2 className="text-2xl md:text-4xl font-bold mb-2">{banner.title}</h2>
              )}
              {banner.description && (
                <p className="text-sm md:text-base opacity-90">{banner.description}</p>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Regular banner content (link or no action)
  const content = (
    <div 
      className="relative w-full h-full overflow-hidden rounded-lg"
      style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.5s ease-in-out' }}
      onClick={handleBannerClick}
    >
      {banner.banner_url && (
        <Image
          src={banner.banner_url}
          alt={banner.title || 'Banner'}
          fill
          sizes="(max-width: 1023px) 100vw, 992px"
          quality={95}
          priority
          className="object-cover"
          onLoad={() => setLoaded(true)}
        />
      )}
      
      {!hideOverlay && (
        <>
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            {banner.title && (
              <h2 className="text-2xl md:text-4xl font-bold mb-2">{banner.title}</h2>
            )}
            {banner.description && (
              <p className="text-sm md:text-base opacity-90">{banner.description}</p>
            )}
          </div>
        </>
      )}
    </div>
  )
  
  return <div className={`${isActive ? '' : 'hidden'} absolute inset-0`}>{content}</div>
}
