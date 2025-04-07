// my-app/src/components/AppHeightHandler.tsx
'use client'

import { useEffect } from 'react'

export default function AppHeightHandler() {
  useEffect(() => {
    const setAppHeight = () => {
      const height = window.innerHeight
      document.documentElement.style.setProperty('--app-height', `${height}px`)
      
      // Check if in PWA mode and apply immediate height fix
      // @ts-ignore - standalone exists on iOS Safari navigator but not in TS types
      const isPwa = (window.navigator as any).standalone || 
                    window.matchMedia('(display-mode: standalone)').matches
      
      if (isPwa) {
        // Force multiple height recalculations for iOS
        setTimeout(() => {
          document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`)
        }, 50)
        
        setTimeout(() => {
          document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`)
        }, 500)
      }
    }
    
    // Robust event listeners for better PWA support
    window.addEventListener('resize', setAppHeight)
    window.addEventListener('orientationchange', () => {
      // On orientation change, recalculate multiple times
      setAppHeight()
      setTimeout(setAppHeight, 100)
      setTimeout(setAppHeight, 500)
    })
    
    // Handle visibility changes (app resume)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        setAppHeight()
        setTimeout(setAppHeight, 100)
        setTimeout(setAppHeight, 500)
      }
    })
    
    // Initial calls - staggered for better iOS support
    setAppHeight()
    setTimeout(setAppHeight, 100)
    
    return () => {
      window.removeEventListener('resize', setAppHeight)
      window.removeEventListener('orientationchange', setAppHeight)
      document.removeEventListener('visibilitychange', setAppHeight)
    }
  }, [])
  
  return null
}