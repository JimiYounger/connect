'use client'

import { useRef } from 'react'
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

export function CategoryCarousel({ category, onSubcategoryClick }: CategoryCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const isDraggingRef = useRef(false)
  const startPositionRef = useRef({ x: 0, y: 0 })

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return
    
    const scrollAmount = 320 // Width of one card plus gap
    const newScrollLeft = scrollRef.current.scrollLeft + (direction === 'right' ? scrollAmount : -scrollAmount)
    
    scrollRef.current.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth'
    })
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    isDraggingRef.current = false
    startPositionRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentX = e.touches[0].clientX
    const currentY = e.touches[0].clientY
    const deltaX = Math.abs(currentX - startPositionRef.current.x)
    const deltaY = Math.abs(currentY - startPositionRef.current.y)
    
    // If user moved more than 10px horizontally, consider it a drag
    if (deltaX > 10 || deltaY > 10) {
      isDraggingRef.current = true
    }
  }

  const handleCardClick = (subcategory: VideoSubcategory, e: React.MouseEvent) => {
    // Only register click if it wasn't a drag gesture
    if (isDraggingRef.current) {
      e.preventDefault()
      return
    }
    
    onSubcategoryClick(subcategory)
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
          className="flex gap-3 overflow-x-auto overflow-y-hidden scroll-smooth [&::-webkit-scrollbar]:hidden"
          style={{ 
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none',
            touchAction: 'pan-x pinch-zoom',
            WebkitOverflowScrolling: 'touch',
            scrollBehavior: 'smooth',
            overscrollBehaviorX: 'contain',
            overscrollBehaviorY: 'none',
            scrollSnapType: 'x proximity',
            willChange: 'scroll-position'
          }}
        >
          {category.subcategories.map((subcategory) => (
            <div
              key={subcategory.id}
              onClick={(e) => handleCardClick(subcategory, e)}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              className="flex-none w-48 cursor-pointer group/card select-none transform transition-transform duration-300 md:hover:scale-105"
              style={{ 
                touchAction: 'pan-x',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                WebkitTouchCallout: 'none',
                scrollSnapAlign: 'start'
              }}
            >
              {/* Thumbnail Container - 2:3 aspect ratio like Netflix */}
              <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-gray-800 mb-2">
                {subcategory.thumbnailUrl ? (
                  <Image
                    src={subcategory.thumbnailUrl}
                    alt={subcategory.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 384px, (max-width: 1024px) 512px, 768px"
                    quality={95}
                    priority={false}
                  />
                ) : (
                  // Placeholder with custom color or gradient
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
                )}
                
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