// src/features/homepage/components/Carousel/CarouselItem.tsx
'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { Play } from 'lucide-react'
import { Dialog, DialogContent, DialogClose, DialogTrigger } from '@/components/ui/dialog'
import { X } from 'lucide-react'
import type { CarouselBanner } from '@/features/content/types'
import { useMediaQuery } from '@/hooks/use-media-query'

interface CarouselItemProps {
  banner: CarouselBanner
  isActive: boolean
  hideOverlay?: boolean
}

export function CarouselItem({ banner, isActive, hideOverlay = false }: CarouselItemProps) {
  const [loaded, setLoaded] = useState(false)
  const isMobile = useMediaQuery('(max-width: 768px)')
  
  useEffect(() => {
    // Reset loaded state when banner changes
    setLoaded(false)
  }, [banner.id])

  const handleBannerClick = () => {
    if (banner.click_behavior === 'link' && banner.url) {
      if (banner.open_in_iframe) {
        // Handle iframe opening (if needed)
        console.log('Opening in iframe:', banner.url)
      } else {
        window.open(banner.url, '_blank')
      }
    }
  }

  // Video banner content
  if (banner.click_behavior === 'video' && banner.vimeo_video_id) {
    return (
      <div className={`${isActive ? '' : 'hidden'}`}>
        <Dialog>
          <DialogTrigger asChild>
            <div 
              className={`relative w-full h-[300px] md:h-[400px] overflow-hidden ${!isMobile && 'rounded-lg'} cursor-pointer group`}
              style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.5s ease-in-out' }}
            >
              {banner.banner_url && (
                <Image
                  src={banner.banner_url}
                  alt={banner.title || 'Video banner'}
                  fill
                  sizes="100vw"
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
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogClose className="absolute right-4 top-4 z-50">
              <div className="rounded-full bg-black/75 p-2 hover:bg-black/90 transition-colors">
                <X className="h-6 w-6 text-white" />
              </div>
            </DialogClose>
            <iframe
              src={`https://player.vimeo.com/video/${banner.vimeo_video_id}?autoplay=1`}
              className="w-full aspect-video"
              allow="autoplay; fullscreen"
              title={banner.title || 'Video content'}
            />
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // Regular banner content (link or no action)
  const content = (
    <div 
      className={`relative w-full h-[300px] md:h-[400px] overflow-hidden ${!isMobile && 'rounded-lg'}`}
      style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.5s ease-in-out' }}
      onClick={handleBannerClick}
    >
      {banner.banner_url && (
        <Image
          src={banner.banner_url}
          alt={banner.title || 'Banner'}
          fill
          sizes="100vw"
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
  
  return <div className={isActive ? '' : 'hidden'}>{content}</div>
}