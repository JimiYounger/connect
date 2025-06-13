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
        {/* Left Arrow */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-black/80"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>

        {/* Right Arrow */}
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-black/80"
        >
          <ChevronRight className="w-5 h-5 text-white" />
        </button>

        {/* Scrollable Container */}
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {category.subcategories.map((subcategory) => (
            <div
              key={subcategory.id}
              onClick={() => onSubcategoryClick(subcategory)}
              className="flex-none w-48 cursor-pointer group/card transform transition-transform duration-300 hover:scale-105"
            >
              {/* Thumbnail Container - 2:3 aspect ratio like Netflix */}
              <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-gray-800 mb-2">
                {subcategory.thumbnailUrl ? (
                  <Image
                    src={subcategory.thumbnailUrl}
                    alt={subcategory.name}
                    fill
                    className="object-cover"
                    sizes="192px"
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
                
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 flex items-center justify-center">
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