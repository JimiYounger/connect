// src/features/carousel/components/CarouselDisplay.tsx

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { ChevronLeft, ChevronRight, Play } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useRouter } from 'next/navigation'
import type { Tables } from '@/types/supabase'
import Image from "next/image"
import { BannerDateIndicator } from './BannerDateIndicator'
import { BannerRoleIndicator } from './BannerRoleIndicator'

type Banner = Tables<'carousel_banners_detailed'>

interface CarouselDisplayProps {
  banners: Banner[]
  activeRole: string | null
}

export function CarouselDisplay({ banners }: CarouselDisplayProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'center' })
  const [prevBtnEnabled, setPrevBtnEnabled] = useState(false)
  const [nextBtnEnabled, setNextBtnEnabled] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const autoScrollIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const router = useRouter()

  const resetAutoScroll = useCallback(() => {
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current)
    }
    
    autoScrollIntervalRef.current = setInterval(() => {
      emblaApi?.scrollNext()
    }, 6500) // Changed to 6.5 seconds
  }, [emblaApi])

  const scrollPrev = useCallback(() => {
    if (emblaApi) {
      emblaApi.scrollPrev()
      resetAutoScroll()
    }
  }, [emblaApi, resetAutoScroll])

  const scrollNext = useCallback(() => {
    if (emblaApi) {
      emblaApi.scrollNext()
      resetAutoScroll()
    }
  }, [emblaApi, resetAutoScroll])

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
    setPrevBtnEnabled(emblaApi.canScrollPrev())
    setNextBtnEnabled(emblaApi.canScrollNext())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', onSelect)

    return () => {
      emblaApi.off('select', onSelect)
      emblaApi.off('reInit', onSelect)
    }
  }, [emblaApi, onSelect])

  useEffect(() => {
    if (!emblaApi) return
    
    resetAutoScroll()

    return () => {
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current)
      }
    }
  }, [emblaApi, resetAutoScroll])

  const handleBannerClick = async (banner: Banner) => {
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
        // Handle iframe opening
        console.log('Opening in iframe:', banner.url)
      } else {
        window.open(banner.url, '_blank')
      }
    }
  }

  return (
    <div className="relative group">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {banners.map((banner, index) => (
            <div key={banner.id} className="relative flex-[0_0_100%]">
              {banner.click_behavior === 'video' && (banner.video_id || banner.vimeo_video_id) ? (
                <div
                  onClick={() => handleBannerClick(banner)}
                  className="cursor-pointer relative aspect-video group"
                >
                  <Image
                    src={banner.banner_url || `/api/placeholder/1920/1080`}
                    alt={banner.title || ''}
                    width={1920}
                    height={1080}
                    className="w-full h-full object-cover"
                    priority={index === 0}
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="w-16 h-16 text-white" />
                  </div>
                  {/* Add role indicator */}
                  <BannerRoleIndicator banner={banner} />
                  {/* Add date indicator */}
                  <BannerDateIndicator banner={banner} />
                </div>
              ) : (
                <div
                  onClick={() => handleBannerClick(banner)}
                  className="cursor-pointer relative"
                >
                  <Image
                    src={banner.banner_url || `/api/placeholder/1920/1080`}
                    alt={banner.title || ''}
                    width={1920}
                    height={1080}
                    className="w-full aspect-video object-cover"
                    priority={index === 0}
                  />
                  {/* Add role indicator */}
                  <BannerRoleIndicator banner={banner} />
                  {/* Add date indicator */}
                  <BannerDateIndicator banner={banner} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "absolute left-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity",
          !prevBtnEnabled && "hidden"
        )}
        onClick={scrollPrev}
      >
        <ChevronLeft className="h-8 w-8" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity",
          !nextBtnEnabled && "hidden"
        )}
        onClick={scrollNext}
      >
        <ChevronRight className="h-8 w-8" />
      </Button>

      {/* Dot indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {banners.map((_, index) => (
          <button
            key={index}
            className={cn(
              "w-2 h-2 rounded-full transition-all",
              index === selectedIndex 
                ? "bg-white scale-125" 
                : "bg-white/50 hover:bg-white/75"
            )}
            onClick={() => {
              emblaApi?.scrollTo(index)
              resetAutoScroll()
            }}
          />
        ))}
      </div>
    </div>
  )
}