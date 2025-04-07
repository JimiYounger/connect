// my-app/src/components/AppHeightHandler.tsx
'use client'

import { useEffect } from 'react'

export default function AppHeightHandler() {
  useEffect(() => {
    const setAppHeight = () => {
      const height = window.innerHeight
      document.documentElement.style.setProperty('--app-height', `${height}px`)
    }
    
    window.addEventListener('resize', setAppHeight)
    window.addEventListener('orientationchange', setAppHeight)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        setTimeout(setAppHeight, 100)
      }
    })
    
    // Initial call
    setAppHeight()
    
    return () => {
      window.removeEventListener('resize', setAppHeight)
      window.removeEventListener('orientationchange', setAppHeight)
    }
  }, [])
  
  return null
}