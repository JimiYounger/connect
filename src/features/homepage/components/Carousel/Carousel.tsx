// src/features/homepage/components/Carousel/Carousel.tsx
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useUserBanners } from '@/features/content/hooks/useUserContent'
import { CarouselItem } from './CarouselItem'
import { useMediaQuery } from '@/hooks/use-media-query'

interface CarouselProps {
  autoplayInterval?: number // in milliseconds
}

export function Carousel({ autoplayInterval = 5000 }: CarouselProps) {
  const { data: banners = [], isLoading, error } = useUserBanners()
  const [activeIndex, setActiveIndex] = useState(0)
  const [showControls, setShowControls] = useState(false)
  const autoScrollIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const isMobile = useMediaQuery('(max-width: 768px)')
  
  // Filter out inactive banners
  const activeBanners = banners.filter(banner => banner.is_currently_active)
  
  const goToNext = useCallback(() => {
    if (activeBanners.length <= 1) return
    setActiveIndex(current => (current + 1) % activeBanners.length)
  }, [activeBanners.length])
  
  const goToPrevious = useCallback(() => {
    if (activeBanners.length <= 1) return
    setActiveIndex(current => (current - 1 + activeBanners.length) % activeBanners.length)
  }, [activeBanners.length])
  
  const resetAutoScroll = useCallback(() => {
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current)
    }
    
    autoScrollIntervalRef.current = setInterval(goToNext, autoplayInterval)
  }, [goToNext, autoplayInterval])
  
  // Set up autoplay
  useEffect(() => {
    if (autoplayInterval <= 0 || activeBanners.length <= 1) return
    
    resetAutoScroll()
    return () => {
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current)
      }
    }
  }, [autoplayInterval, resetAutoScroll, activeBanners.length])

  if (isLoading) {
    return (
      <div className="w-full h-[300px] md:h-[400px] bg-accent/10 animate-pulse rounded-lg flex items-center justify-center">
        <p className="text-muted-foreground">Loading banners...</p>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="w-full h-[300px] md:h-[400px] bg-destructive/10 rounded-lg flex items-center justify-center">
        <p className="text-destructive">Error loading banners</p>
      </div>
    )
  }
  
  if (activeBanners.length === 0) {
    return null // Don't show anything if there are no active banners
  }
  
  return (
    <div 
      className={`relative w-full group ${isMobile ? '-mx-4 sm:mx-0' : ''}`}
      onMouseEnter={() => setShowControls(true)} 
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Carousel items */}
      <div className={`relative overflow-hidden ${!isMobile && 'rounded-lg'}`}>
        {activeBanners.map((banner, index) => (
          <CarouselItem 
            key={banner.id} 
            banner={banner} 
            isActive={index === activeIndex}
            hideOverlay={true}
          />
        ))}
      </div>
      
      {/* Navigation buttons - only show if more than one banner */}
      {activeBanners.length > 1 && (
        <>
          <button
            onClick={() => {
              goToPrevious();
              resetAutoScroll();
            }}
            className={`absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full 
                      bg-black/30 text-white flex items-center justify-center 
                      hover:bg-black/50 focus:outline-none transition-opacity duration-300 
                      ${showControls ? 'opacity-70' : 'opacity-0'}`}
            aria-label="Previous banner"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          
          <button
            onClick={() => {
              goToNext();
              resetAutoScroll();
            }}
            className={`absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full 
                      bg-black/30 text-white flex items-center justify-center 
                      hover:bg-black/50 focus:outline-none transition-opacity duration-300
                      ${showControls ? 'opacity-70' : 'opacity-0'}`}
            aria-label="Next banner"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
          
          {/* Pagination dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-[23px]">
            {activeBanners.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setActiveIndex(index);
                  resetAutoScroll();
                }}
                className={`w-[13px] h-[13px] rounded-full transition-colors`}
                style={{
                  backgroundColor: index === activeIndex ? '#C6FC36' : '#666666',
                }}
                aria-label={`Go to banner ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}