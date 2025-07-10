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
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

// Sleek, high-end animation styles
const premiumAnimationStyles = `
  @keyframes progressLine {
    0% { width: 0%; opacity: 0.8; }
    100% { width: 100%; opacity: 1; }
  }
  
  @keyframes fadeUp {
    0% { transform: translateY(10px); opacity: 0; }
    100% { transform: translateY(0); opacity: 1; }
  }
  
  @keyframes subtlePulse {
    0% { opacity: 0.85; }
    50% { opacity: 1; }
    100% { opacity: 0.85; }
  }
  
  @keyframes dashOffset {
    0% { stroke-dashoffset: 250; }
    100% { stroke-dashoffset: 0; }
  }
  
  .progress-line {
    animation: progressLine 2.5s cubic-bezier(0.19, 1, 0.22, 1) forwards;
  }
  
  .fade-up {
    opacity: 0;
    animation: fadeUp 0.8s cubic-bezier(0.19, 1, 0.22, 1) forwards;
  }
  
  .delay-100 { animation-delay: 100ms; }
  .delay-200 { animation-delay: 200ms; }
  .delay-300 { animation-delay: 300ms; }
  
  .subtle-pulse {
    animation: subtlePulse 2s ease-in-out infinite;
  }
  
  .dash-offset {
    animation: dashOffset 2.5s cubic-bezier(0.19, 1, 0.22, 1) infinite;
  }
`;

export function HomePage({ theme = 'dark' }: { theme?: 'dark' | 'light' }) {
  console.log('HomePage component - Rendering');
  
  const { session, isAuthenticated } = useAuth();
  console.log('HomePage - Auth state:', { isAuthenticated, hasSession: !!session });
  
  const { profile, isLoading: profileLoading } = useProfile(session);
  console.log('HomePage - Profile:', !!profile, 'Loading:', profileLoading);
  
  const content = useUserContent();
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  // Set a timeout to prevent infinite loading screen
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoadingTimeout(true);
    }, 5000); // 5 seconds timeout
    
    return () => clearTimeout(timer);
  }, []);
  
  // Simulate loading progress with deterministic values
  useEffect(() => {
    if (isAuthenticated && 
      (content.loading.carousel || content.loading.navigation || content.loading.dashboard)) {
      const interval = setInterval(() => {
        setLoadingProgress(prev => {
          // Use deterministic increment instead of Math.random() to prevent hydration issues
          const increment = 12; // Fixed increment value
          return Math.min(prev + increment, 90);
        });
      }, 500);
      
      return () => clearInterval(interval);
    } else {
      // Set to 100 when done loading
      setLoadingProgress(100);
    }
  }, [isAuthenticated, content.loading]);
  
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

  // Only show loading state if profile is loading or content is actively loading
  // AND we haven't hit the timeout
  const isLoading = (profileLoading || 
    (isAuthenticated && 
     (content.loading.carousel || content.loading.navigation || content.loading.dashboard))) && 
    !loadingTimeout;

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

  // Loading State
  if (isLoading) {
    return (
      <>
        <style jsx global>{premiumAnimationStyles}</style>
        <div className="flex flex-col min-h-screen bg-black text-white items-center justify-center overflow-hidden">
          {/* Minimal, high-end loading UI */}
          <div className="relative w-full max-w-md px-8">
            {/* Brand mark - simple, bold, minimal */}
            <div className="flex items-center justify-center mb-16">
              <div className="w-12 h-12 bg-white rounded-full subtle-pulse"></div>
            </div>
            
            {/* Premium loading bar */}
            <div className="mb-12">
              <div className="h-0.5 w-full bg-gray-800 relative overflow-hidden">
                <div 
                  className="h-full bg-white progress-line"
                  style={{ 
                    animationDuration: '3s',
                    animationIterationCount: 'infinite'
                  }}
                ></div>
              </div>
              
              {/* Minimalist loading indicator */}
              <div className="mt-10 flex items-center">
                <div className="relative mr-6 mt-1">
                  <svg width="22" height="22" viewBox="0 0 22 22" className="opacity-90">
                    <circle 
                      cx="11" 
                      cy="11" 
                      r="9" 
                      stroke="white" 
                      strokeWidth="1.5" 
                      fill="none" 
                      strokeDasharray="56.5" 
                      strokeDashoffset="0" 
                      className="dash-offset" 
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                
                <div className="text-xs uppercase tracking-widest opacity-80 font-medium fade-up">
                  LOADING
                </div>
                
                <div className="ml-auto tracking-wide text-sm opacity-80 font-light fade-up delay-100" suppressHydrationWarning>
                  {Math.round(loadingProgress)}%
                </div>
              </div>
            </div>
            
            {/* Dynamic messaging - athletic/performant */}
            <div className="text-2xl font-extralight tracking-tight fade-up delay-200"
                style={{ fontFamily: "'Helvetica Neue', sans-serif" }}
                suppressHydrationWarning>
              {loadingProgress < 40 ? "Preparing your experience" :
               loadingProgress < 75 ? "Loading performance data" :
               "Optimizing your view"}
            </div>
            
            {/* Line separator */}
            <div className="h-px w-12 bg-white opacity-20 my-4"></div>
            
            {/* Minimal sporting theme text */}
            <p className="text-sm font-light opacity-60 fade-up delay-300" suppressHydrationWarning>
              {loadingProgress < 30 ? "Personalized content loading..." :
               loadingProgress < 70 ? "Almost there..." :
               "Setting up your experience..."}
            </p>
          </div>
        </div>
      </>
    );
  }

  // Show error state if there are errors
  if (content.errors.length > 0) {
    return (
      <div className="flex flex-col h-full bg-black text-white items-center justify-center">
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
    <div className={cn(
      "flex flex-col h-full", 
      theme === 'dark' ? 'bg-black text-white' : 'bg-white text-black'
    )}>
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
      
      <>
        {/* Navigation wrapper with enhanced PWA compatibility */}
        <div 
          className={cn(
            "navigation-wrapper sticky top-0 z-50 transition-colors duration-200",
            theme === 'dark' ? 'bg-black text-white' : 'bg-white text-black',
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
            <Navigation className={theme === 'light' ? 'invert' : ''} />
          </div>
          
          {/* Logo positioned with consistent class and enhanced touch handling */}
          <div 
            className="absolute nav-logo-positioner" 
            style={{ 
              right: '18px',
              top: '0px'
            }}
            id="nav-logo-container"
            data-testid="nav-logo-container"
          >
            <Link href="/" prefetch={false}>
              <div 
                className="cursor-pointer touch-manipulation"
                style={{ 
                  padding: '15px', // Increased touch target
                  margin: '-15px', // Offset the padding to keep visual size
                  zIndex: 1050,
                  WebkitTapHighlightColor: 'transparent' // Remove tap highlight
                }}
              >
                <Image 
                  src="/favicon.ico" 
                  alt="Home" 
                  width={48} 
                  height={48}
                  priority
                  style={{
                    pointerEvents: 'none' // Prevent image from interfering with touch
                  }}
                />
              </div>
            </Link>
          </div>
        </div>
        
        <div className="container mx-auto px-4">
          <div style={{ marginTop: '-5px' }}> {/* Negative margin to reduce gap by 5px */}
            <Carousel autoplayInterval={4000} />
          </div>
          
          {/* Dashboard section with reduced spacing */}
          <div style={{ marginTop: `${GRID_GAP / 6}px` }}>
            <div className="w-full">
              <Dashboard />
            </div>
          </div>
        </div>
      </>
    </div>
  )
}