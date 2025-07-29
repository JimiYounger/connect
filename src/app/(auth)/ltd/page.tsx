'use client'

import { useAuth } from "@/features/auth/context/auth-context"
import { useProfile } from "@/features/users/hooks/useProfile"
import { LeadershipTrainingDecks } from "./components/LeadershipTrainingDecks"
import { Navigation } from '@/features/homepage/components/Navigation/Navigation'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

export default function LTDPage() {
  const { session, loading } = useAuth()
  const { profile, isLoading: profileLoading } = useProfile(session)
  const [scrolled, setScrolled] = useState(false)

  // Add scroll listener
  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      if (offset > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Loading states
  if (loading.initializing || profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    )
  }

  // Auth check
  if (!session || !profile) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p>Please log in to access this page</p>
        </div>
      </div>
    )
  }

  // Profile validation - ensure required fields are present
  if (!profile.id || !profile.first_name || !profile.last_name) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Profile Error</h2>
          <p>Unable to load complete user profile data</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white text-black">
      {/* Preload the connect.png image */}
      <div className="hidden">
        <Image 
          src="/connect.png" 
          alt="Connect logo preload" 
          width={216} 
          height={61} 
          priority
        />
      </div>
      
      {/* Navigation wrapper with enhanced PWA compatibility */}
      <div 
        className={cn(
          "navigation-wrapper sticky top-0 z-50 transition-colors duration-200",
          "bg-white text-black",
          scrolled ? 'bg-opacity-90 backdrop-blur-sm' : 'bg-opacity-100'
        )} 
        id="navigation-wrapper" 
        style={{ marginBottom: '-2px' }}
      >
        {/* Menu positioned with consistent class and enhanced accessibility */}
        <div 
          className="absolute nav-menu-positioner" 
          style={{ 
            left: '18px',
            top: '12px'
          }}
          id="nav-menu-container"
          data-testid="nav-menu-container"
        >
          <Navigation className="black-bars" />
        </div>
        
        
      </div>
      
      {/* Main Content */}
      <div className="container mx-auto px-4">
        <div className="p-4 sm:p-6">
          <div className="max-w-[1400px] mx-auto">
            <div className="mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-black mb-2">
                Leadership Training Decks
              </h1>
              <p className="text-gray-600">
                Access and manage presentation materials for leadership training sessions
              </p>
            </div>

            <LeadershipTrainingDecks 
              profile={{
                id: profile.id,
                first_name: profile.first_name,
                last_name: profile.last_name,
                role_type: profile.role_type || undefined
              }} 
            />
          </div>
        </div>
      </div>
    </div>
  )
}