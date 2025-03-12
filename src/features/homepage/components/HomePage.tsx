// src/features/homepage/components/HomePage.tsx
'use client'

import { Carousel } from './Carousel/Carousel'
import { Dashboard } from './Dashboard/Dashboard'
import { Navigation } from './Navigation/Navigation'
import Link from 'next/link'
import Image from 'next/image'
import { GRID_GAP } from '@/config/uiConfig'

export function HomePage() {
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