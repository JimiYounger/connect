'use client'

import { useRef, useState } from 'react'
import { Play } from 'lucide-react'
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
  thumbnailUrl?: string
  thumbnailColor?: string
  subcategories: VideoSubcategory[]
}

interface CategoryCarouselProps {
  categories: VideoCategory[]
  onSubcategoryClick: (subcategory: VideoSubcategory) => void
}

function LazyThumbnail({ 
  item, 
  type 
}: { 
  item: VideoCategory | VideoSubcategory
  type: 'category' | 'subcategory'
}) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  if (!item.thumbnailUrl || hasError) {
    return (
      <div 
        className="w-full h-full flex items-center justify-center"
        style={{
          backgroundColor: item.thumbnailColor || '#6366f1',
          backgroundImage: item.thumbnailColor ? 'none' : `linear-gradient(135deg, ${item.thumbnailColor || '#6366f1'}, ${item.thumbnailColor || '#3b82f6'})`
        }}
      >
        <div className="text-center text-white">
          <Play className={`${type === 'category' ? 'w-16 h-16' : 'w-12 h-12'} mx-auto mb-2 opacity-80`} />
          <p className={`${type === 'category' ? 'text-base' : 'text-sm'} font-medium px-2 leading-tight`}>
            {item.name}
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-800 animate-pulse flex items-center justify-center">
          <div className={`${type === 'category' ? 'w-16 h-16' : 'w-12 h-12'} bg-gray-700 rounded-full opacity-50`}></div>
        </div>
      )}
      
      <Image
        src={item.thumbnailUrl}
        alt={item.name}
        fill
        className={`object-cover transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        sizes="(max-width: 768px) 384px, (max-width: 1024px) 512px, 768px"
        quality={85}
        priority={false}
        loading="lazy"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setHasError(true)
          setIsLoading(false)
        }}
      />
    </>
  )
}

export function CategoryCarousel({ 
  categories, 
  onSubcategoryClick 
}: CategoryCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const subcategoryScrollRef = useRef<HTMLDivElement>(null)
  const [selectedCategory, setSelectedCategory] = useState<VideoCategory | null>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const handleCategoryClick = (category: VideoCategory) => {
    if (selectedCategory?.id === category.id && isDropdownOpen) {
      // Close if clicking the same category
      setIsDropdownOpen(false)
      setSelectedCategory(null)
    } else {
      // Open new category dropdown
      setSelectedCategory(category)
      setIsDropdownOpen(true)
    }
  }

  const handleSubcategoryClick = (subcategory: VideoSubcategory) => {
    setIsDropdownOpen(false)
    setSelectedCategory(null)
    onSubcategoryClick(subcategory)
  }

  return (
    <div className="px-4">
      {/* Main Title */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Video Library</h1>
      </div>

      {/* Main Category Carousel */}
      <div className="relative group mb-4">
        {/* Scrollable Container */}
        <div
          ref={scrollRef}
          className="flex gap-3 sm:gap-4 overflow-x-auto overflow-y-visible scrollbar-hide scroll-smooth-mobile carousel-scroll carousel-container py-2 pl-2"
          style={{ 
            touchAction: 'manipulation',
            WebkitOverflowScrolling: 'touch',
            overscrollBehaviorX: 'contain',
            overscrollBehaviorY: 'auto'
          }}
        >
          {categories.map((category) => {
            return (
              <div
                key={category.id}
                onClick={() => handleCategoryClick(category)}
                className="flex-none w-44 sm:w-48 md:w-52 lg:w-56 cursor-pointer group/card transition-transform duration-300 md:hover:scale-105 carousel-item"
                style={{ 
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  userSelect: 'text',
                  WebkitUserSelect: 'text',
                  WebkitTouchCallout: 'none'
                }}
              >
                {/* Category Thumbnail Container - Slightly taller for categories */}
                <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-gray-800 mb-3">
                  <LazyThumbnail item={category} type="category" />
                  

                </div>

                {/* Category Info */}
                <div className="px-1">
                  <h3 className="text-white font-semibold text-sm sm:text-base leading-tight mb-1 line-clamp-2">
                    {category.name}
                  </h3>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Dropdown Tray for Subcategories */}
      {isDropdownOpen && selectedCategory && (
        <div className="absolute left-0 right-0 bg-black py-4 mb-6 animate-in fade-in slide-in-from-top-4 duration-300" style={{ marginLeft: '-1rem', marginRight: '-1rem' }}>
          <div className="px-4">

          {/* Subcategory Carousel */}
          <div className="relative group/sub">
            {/* Subcategory Scrollable Container */}
            <div
              ref={subcategoryScrollRef}
              className="flex gap-2 sm:gap-3 overflow-x-auto overflow-y-visible scrollbar-hide scroll-smooth-mobile py-2 pl-6"
              style={{ 
                touchAction: 'manipulation',
                WebkitOverflowScrolling: 'touch',
                overscrollBehaviorX: 'contain',
                overscrollBehaviorY: 'auto'
              }}
            >
              {selectedCategory.subcategories.map((subcategory) => (
                <div
                  key={subcategory.id}
                  onClick={() => handleSubcategoryClick(subcategory)}
                  className="flex-none w-32 sm:w-36 md:w-40 cursor-pointer group/subcard transition-transform duration-300 md:hover:scale-105"
                  style={{ 
                    touchAction: 'manipulation',
                    WebkitTapHighlightColor: 'transparent',
                    userSelect: 'text',
                    WebkitUserSelect: 'text',
                    WebkitTouchCallout: 'none'
                  }}
                >
                  {/* Subcategory Thumbnail Container */}
                  <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-800 mb-2">
                    <LazyThumbnail item={subcategory} type="subcategory" />
                    

                  </div>

                  {/* Subcategory Info */}
                  <div className="px-1">
                    <h4 className="text-white font-medium text-xs sm:text-sm leading-tight mb-1 line-clamp-2">
                      {subcategory.name}
                    </h4>
                  </div>
                </div>
              ))}
            </div>
          </div>
          </div>
        </div>
      )}
    </div>
  )
}