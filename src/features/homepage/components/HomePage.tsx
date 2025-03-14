// src/features/homepage/components/HomePage.tsx
'use client'

import { Carousel } from './Carousel/Carousel'
import { Dashboard } from './Dashboard/Dashboard'
import { Navigation } from './Navigation/Navigation'
import Link from 'next/link'
import Image from 'next/image'
import { GRID_GAP } from '@/config/uiConfig'
import { useUserContent } from '@/features/content/hooks/useUserContent'
import { useAuth } from '@/features/auth/context/auth-context'
import { useProfile } from '@/features/users/hooks/useProfile'
import { useEffect } from 'react'

export function HomePage() {
  console.log('HomePage component - Rendering');
  
  const { session, isAuthenticated } = useAuth();
  console.log('HomePage - Auth state:', { isAuthenticated, hasSession: !!session });
  
  const { profile, isLoading: profileLoading } = useProfile(session);
  console.log('HomePage - Profile:', !!profile, 'Loading:', profileLoading);
  
  const content = useUserContent();
  
  useEffect(() => {
    console.log('HomePage - Content state:', { 
      hasCarousel: Array.isArray(content.carouselBanners) && content.carouselBanners.length > 0, 
      hasNavigation: Array.isArray(content.navigationItems) && content.navigationItems.length > 0, 
      hasDashboard: !!content.dashboard,
      loading: content.loading,
      errors: content.errors,
      isInitialized: content.isInitialized
    });
    
    if (content.errors.length > 0) {
      console.error('Content loading errors:', content.errors);
    }
  }, [content]);

  // Show loading state if profile is loading or content is not initialized
  if (profileLoading || (isAuthenticated && !content.isInitialized)) {
    return (
      <div className="flex flex-col min-h-screen bg-black text-white items-center justify-center">
        <div className="text-xl">Loading your personalized content...</div>
      </div>
    );
  }

  // Show error state if there are errors
  if (content.errors.length > 0) {
    return (
      <div className="flex flex-col min-h-screen bg-black text-white items-center justify-center">
        <div className="text-xl text-red-500">Error loading content</div>
        <div className="mt-4">
          {content.errors.map((error, index) => (
            <div key={index} className="text-sm text-red-400">
              {error.source}: {error.message}
            </div>
          ))}
        </div>
        <button 
          className="mt-6 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      <main className="flex-1 relative">
        {/* Navigation positioned at x42, y46 */}
        <div className="absolute" style={{ top: '46px', left: '42px' }}>
          <Navigation />
        </div>
        
        {/* Logo/Home button in top right corner */}
        <div className="absolute" style={{ top: '35px', right: '42px' }}>
          <Link href="/">
            <div className="cursor-pointer">
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
        
        <div className="container mx-auto px-4">
          {/* Add padding to the top to push content below the navigation */}
          <div style={{ paddingTop: '100px' }}>
            <Carousel autoplayInterval={7000} />
          </div>
          
          {/* Dashboard section with significantly reduced spacing (1/6 of GRID_GAP) */}
          <div style={{ marginTop: `${GRID_GAP / 6}px` }}>
            <Dashboard />
          </div>
        </div>
      </main>
    </div>
  )
}