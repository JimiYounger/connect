'use client'

import { useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Play } from 'lucide-react'
import Image from 'next/image'

interface VideoSubcategory {
  id: string
  name: string
  thumbnailUrl?: string
  thumbnailColor?: string
  videoCount: number
}

interface VideoCategory {
  id: string
  name: string
  subcategories: VideoSubcategory[]
}

interface CategoryCarouselProps {
  category: VideoCategory
  onSubcategoryClick: (subcategory: VideoSubcategory) => void
}

// Optimized thumbnail component with lazy loading and skeleton states
function LazyThumbnail({ subcategory }: { subcategory: VideoSubcategory }) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  if (!subcategory.thumbnailUrl || hasError) {
    // Fallback placeholder with custom color or gradient
    return (
      <div 
        className="w-full h-full flex items-center justify-center"
        style={{
          backgroundColor: subcategory.thumbnailColor || '#6366f1',
          backgroundImage: subcategory.thumbnailColor ? 'none' : `linear-gradient(135deg, ${subcategory.thumbnailColor || '#6366f1'}, ${subcategory.thumbnailColor || '#3b82f6'})`
        }}
      >
        <div className="text-center text-white">
          <Play className="w-12 h-12 mx-auto mb-2 opacity-80" />
          <p className="text-sm font-medium px-2 leading-tight">
            {subcategory.name}
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Loading skeleton - shows while image loads */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-800 animate-pulse flex items-center justify-center">
          <div className="w-12 h-12 bg-gray-700 rounded-full opacity-50"></div>
        </div>
      )}
      
      {/* Actual image */}
      <Image
        src={subcategory.thumbnailUrl}
        alt={subcategory.name}
        fill
        className={`object-cover transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        sizes="(max-width: 768px) 384px, (max-width: 1024px) 512px, 768px"
        quality={85} // Reduced from 95 for faster loading
        priority={false}
        loading="lazy" // Explicit lazy loading
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setHasError(true)
          setIsLoading(false)
        }}
      />
    </>
  )
}

export function CategoryCarousel({ category, onSubcategoryClick }: CategoryCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return
    
    const scrollAmount = 320 // Width of one card plus gap
    const newScrollLeft = scrollRef.current.scrollLeft + (direction === 'right' ? scrollAmount : -scrollAmount)
    
    scrollRef.current.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth'
    })
  }


  return (
    <div className="px-4">
      {/* Category Title */}
      <h2 className="text-xl md:text-2xl font-semibold text-white mb-4">
        {category.name}
      </h2>

      {/* Carousel Container */}
      <div className="relative group">
        {/* Left Arrow - Desktop only */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-black/60 rounded-full items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-black/80 hidden md:flex"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>

        {/* Right Arrow - Desktop only */}
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-black/60 rounded-full items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-black/80 hidden md:flex"
        >
          <ChevronRight className="w-5 h-5 text-white" />
        </button>

        {/* Scrollable Container */}
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto overflow-y-hidden scrollbar-hide scroll-smooth-mobile carousel-scroll carousel-container"
          style={{ 
            /* Allow both horizontal and vertical touch, prioritize vertical */
            touchAction: 'manipulation',
            WebkitOverflowScrolling: 'touch',
            /* Let vertical scrolling work naturally on mobile */
            overscrollBehaviorX: 'contain',
            overscrollBehaviorY: 'auto'
          }}
        >
          {category.subcategories.map((subcategory) => (
            <div
              key={subcategory.id}
              onClick={() => onSubcategoryClick(subcategory)}
              className="flex-none w-48 cursor-pointer group/card transition-transform duration-300 md:hover:scale-105 carousel-item"
              style={{ 
                /* Mobile-friendly touch handling */
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                /* Allow natural text selection on mobile */
                userSelect: 'text',
                WebkitUserSelect: 'text',
                WebkitTouchCallout: 'none'
              }}
            >
              {/* Thumbnail Container - 2:3 aspect ratio like Netflix */}
              <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-gray-800 mb-2">
                {/* Optimized lazy-loaded thumbnail */}
                <LazyThumbnail subcategory={subcategory} />
                
                {/* Hover Overlay - Desktop only */}
                <div className="absolute inset-0 bg-black/40 opacity-0 md:group-hover/card:opacity-100 transition-opacity duration-300 items-center justify-center hidden md:flex">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <Play className="w-6 h-6 text-white ml-0.5" />
                  </div>
                </div>

                {/* Video Count Badge */}
                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm rounded-full px-2 py-1">
                  <span className="text-white text-xs font-medium">
                    {subcategory.videoCount} videos
                  </span>
                </div>
              </div>

              {/* Subcategory Info */}
              <div className="px-1">
                <h3 className="text-white font-medium text-sm leading-tight mb-1 line-clamp-2">
                  {subcategory.name}
                </h3>
                <p className="text-gray-400 text-xs">
                  {subcategory.videoCount} video{subcategory.videoCount !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}