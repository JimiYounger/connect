// src/features/carousel/components/CarouselDisplay.tsx

'use client'

import { useState, useEffect, useCallback } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { ChevronLeft, ChevronRight, Play, X } from 'lucide-react'
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import type { Tables } from '@/types/supabase'

type Banner = Tables<'carousel_banners_detailed'>

// TODO: Implement role-based display logic using activeRole prop
interface CarouselDisplayProps {
  banners: Banner[]
  activeRole: string | null
}

export function CarouselDisplay({ banners, activeRole }: CarouselDisplayProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'center' })
  const [prevBtnEnabled, setPrevBtnEnabled] = useState(false)
  const [nextBtnEnabled, setNextBtnEnabled] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi])

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

  // Auto-scroll functionality
  useEffect(() => {
    if (!emblaApi) return

    const interval = setInterval(() => {
      emblaApi.scrollNext()
    }, 5000) // Scroll every 5 seconds

    return () => clearInterval(interval)
  }, [emblaApi])

  const handleBannerClick = (banner: Banner) => {
    if (banner.click_behavior === 'url' && banner.url) {
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
              {banner.click_behavior === 'video' ? (
                <Dialog>
                  <DialogTrigger asChild>
                    <div className="relative aspect-video cursor-pointer group">
                      <img
                        src={banner.banner_url || `/api/placeholder/1920/1080`}
                        alt={banner.title || ''}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="w-16 h-16 text-white" />
                      </div>
                    </div>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl">
                    <DialogTitle className="sr-only">
                      {banner.title || 'Video Content'}
                    </DialogTitle>
                    <DialogClose className="absolute right-4 top-4 z-50">
                      <div className="rounded-full bg-black/75 p-2 hover:bg-black/90 transition-colors">
                        <X className="h-6 w-6 text-white" />
                      </div>
                    </DialogClose>
                    {banner.vimeo_video_id && (
                      <iframe
                        src={`https://player.vimeo.com/video/${banner.vimeo_video_id}?autoplay=1`}
                        className="w-full aspect-video"
                        allow="autoplay; fullscreen"
                        title={banner.title || 'Video content'}
                      />
                    )}
                  </DialogContent>
                </Dialog>
              ) : (
                <div
                  onClick={() => handleBannerClick(banner)}
                  className="cursor-pointer"
                >
                  <img
                    src={banner.banner_url || `/api/placeholder/1920/1080`}
                    alt={banner.title || ''}
                    className="w-full aspect-video object-cover"
                  />
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
            onClick={() => emblaApi?.scrollTo(index)}
          />
        ))}
      </div>
    </div>
  )
}