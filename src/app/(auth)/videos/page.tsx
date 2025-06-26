'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/features/auth/context/auth-context'
import { useProfile } from '@/features/users/hooks/useProfile'
import { useVideoPermissions } from '@/features/videoViewer/hooks/useVideoPermissions'
import { CategoryCarousel } from '@/features/videoViewer/components/CategoryCarousel'
import { SubcategoryModal } from '@/features/videoViewer/components/SubcategoryModal'
import { VideoSearchModal } from '@/features/videoViewer/components/VideoSearchModal'
import { VideoLibraryService, type VideoCategory, type VideoSubcategory } from '@/features/videoViewer/services/videoLibraryService'
import { Navigation } from '@/features/homepage/components/Navigation/Navigation'
import { Search } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function VideoLibraryPage() {
  const searchParams = useSearchParams()
  const { session } = useAuth()
  const { profile } = useProfile(session)
  const { userPermissions, isLoading: permissionsLoading } = useVideoPermissions(profile)
  
  // Hydration safety: ensure we're client-side before rendering dynamic content
  const [isHydrated, setIsHydrated] = useState(false)
  const [categories, setCategories] = useState<VideoCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSubcategory, setSelectedSubcategory] = useState<VideoSubcategory | null>(null)
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Hydration check - this only runs on client-side
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Load categories and handle URL parameters in one coordinated effect
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Step 1: Load categories first
        const realCategories = await VideoLibraryService.getCategoriesWithSubcategories()
        const filteredCategories = realCategories.filter(category => 
          category.subcategories.length > 0 && 
          category.subcategories.some(sub => sub.videoCount > 0)
        )
        
        setCategories(filteredCategories)
        
        // Step 2: Handle URL parameters now that we have categories
        const showSearch = searchParams.get('showSearch')
        const showSubcategoryId = searchParams.get('showSubcategory')
        
        if (showSearch === 'true') {
          setShowSearchModal(true)
        } else if (showSubcategoryId && filteredCategories.length > 0) {
          // Find the subcategory to show
          const subcategory = filteredCategories
            .flatMap(cat => cat.subcategories)
            .find(sub => sub.id === showSubcategoryId)
          
          if (subcategory) {
            setSelectedSubcategory(subcategory)
          }
        }
        
      } catch (err) {
        console.error('Error loading video library:', err)
        setError('Failed to load video library')
      } finally {
        setLoading(false)
      }
    }

    // Only run after hydration is complete
    if (isHydrated) {
      loadInitialData()
    }
  }, [searchParams, isHydrated]) // Depend on both URL params and hydration state

  const handleSubcategoryClick = (subcategory: VideoSubcategory) => {
    setSelectedSubcategory(subcategory)
  }

  const closeModal = () => {
    setSelectedSubcategory(null)
  }

  // Show loading until hydration is complete - prevents SSR/client mismatch
  if (!isHydrated || !session) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    )
  }

  if (permissionsLoading || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Error Loading Library</h1>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black mobile-video-page">
      {/* Navigation Header */}
      <div className="relative bg-black">
        <div className="relative">
          {/* Navigation Menu - Top Left */}
          <div className="absolute left-4 top-3">
            <Navigation />
          </div>
          
          {/* Logo - Top Right */}
          <div className="absolute right-0 -top-3">
            <Link href="/">
              <div className="cursor-pointer p-3">
                <Image 
                  src="/favicon.ico" 
                  alt="Home" 
                  width={48} 
                  height={48}
                  priority
                />
              </div>
            </Link>
          </div>
          
          {/* Header Content */}
          <div className="px-4 py-6 md:py-8 pt-16 md:pt-20">
            <div className="flex flex-col space-y-4">
              {/* Search Bar */}
              <button
                onClick={() => setShowSearchModal(true)}
                className="flex items-center gap-3 px-4 md:px-6 py-3 md:py-4 bg-gray-800/50 hover:bg-gray-700/50 active:bg-gray-700/70 rounded-xl transition-colors border border-gray-700 hover:border-gray-600 w-full max-w-2xl"
                style={{ 
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent'
                }}
              >
                <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <span className="text-gray-400 text-base md:text-lg text-left truncate">Search training videos and company content...</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Refactored Category Carousel */}
      <div 
        className="pb-8"
        style={{ 
          /* Optimize for mobile scrolling performance */
          WebkitOverflowScrolling: 'touch',
          transform: 'translateZ(0)',
          WebkitTransform: 'translateZ(0)'
        }}
      >
        <CategoryCarousel
          categories={categories}
          onSubcategoryClick={handleSubcategoryClick}
        />
      </div>

      {/* Subcategory Modal */}
      {selectedSubcategory && (
        <SubcategoryModal
          subcategory={selectedSubcategory}
          isOpen={!!selectedSubcategory}
          onClose={closeModal}
          userPermissions={userPermissions}
        />
      )}
      
      {/* Search Modal */}
      {showSearchModal && (
        <VideoSearchModal
          isOpen={showSearchModal}
          onClose={() => setShowSearchModal(false)}
          userPermissions={userPermissions}
        />
      )}
    </div>
  )
}