'use client'

import { useState, useEffect } from 'react'
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
  const { session } = useAuth()
  const { profile } = useProfile(session)
  const { userPermissions, isLoading: permissionsLoading } = useVideoPermissions(profile)
  
  const [categories, setCategories] = useState<VideoCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSubcategory, setSelectedSubcategory] = useState<VideoSubcategory | null>(null)
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load categories and subcategories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true)
        
        const realCategories = await VideoLibraryService.getCategoriesWithSubcategories()
        
        // Filter out categories with no subcategories or no videos
        const filteredCategories = realCategories.filter(category => 
          category.subcategories.length > 0 && 
          category.subcategories.some(sub => sub.videoCount > 0)
        )
        
        setCategories(filteredCategories)
        setError(null)
      } catch (err) {
        console.error('Error loading video categories:', err)
        setError('Failed to load video library')
      } finally {
        setLoading(false)
      }
    }

    loadCategories()
  }, [])

  const handleSubcategoryClick = (subcategory: VideoSubcategory) => {
    setSelectedSubcategory(subcategory)
  }

  const closeModal = () => {
    setSelectedSubcategory(null)
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p className="text-gray-600">Please sign in to access the video library.</p>
        </div>
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
    <div className="min-h-screen bg-black">
      {/* Navigation Header */}
      <div className="sticky top-0 z-50 bg-black/90 backdrop-blur-sm">
        <div className="relative">
          {/* Navigation Menu - Top Left */}
          <div className="absolute left-4 top-3">
            <Navigation />
          </div>
          
          {/* Logo - Top Right */}
          <div className="absolute right-4 top-0">
            <Link href="/">
              <div className="cursor-pointer p-4">
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
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white">Video Library</h1>
              
              {/* Search Bar */}
              <button
                onClick={() => setShowSearchModal(true)}
                className="flex items-center gap-3 px-4 md:px-6 py-3 md:py-4 bg-gray-800/50 hover:bg-gray-700/50 active:bg-gray-700/70 rounded-xl transition-colors border border-gray-700 hover:border-gray-600 w-full max-w-2xl touch-manipulation"
              >
                <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <span className="text-gray-400 text-base md:text-lg text-left truncate">Search training videos and company content...</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Category Carousels */}
      <div className="pb-8 space-y-8">
        {categories.map((category) => (
          <CategoryCarousel
            key={category.id}
            category={category}
            onSubcategoryClick={handleSubcategoryClick}
          />
        ))}
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