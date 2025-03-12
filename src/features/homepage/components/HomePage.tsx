// src/features/homepage/components/HomePage.tsx
'use client'

import { Carousel } from './Carousel/Carousel'
import { Dashboard } from './Dashboard/Dashboard'
import { Navigation } from './Navigation/Navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useMediaQuery } from '@/hooks/use-media-query'

export function HomePage() {
  const isMobile = useMediaQuery('(max-width: 768px)')

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
        
        <div className={`container mx-auto ${!isMobile ? 'px-4' : ''} space-y-8`}>
          {/* Add padding to the top to push content below the navigation */}
          <div style={{ paddingTop: '100px' }}>
            <Carousel autoplayInterval={7000} />
          </div>
          
          {/* Dashboard section */}
          <div className={isMobile ? 'px-4' : ''}>
            <Dashboard />
          </div>
        </div>
      </main>
    </div>
  )
}