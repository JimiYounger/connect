// src/hooks/use-media-query.ts
'use client'

import { useState, useEffect } from 'react'

export function useMediaQuery(query: string): boolean {
  // Default to false on server to avoid hydration mismatch
  const [matches, setMatches] = useState(false)
  
  useEffect(() => {
    // Now we're on the client, we can safely check the media query
    const media = window.matchMedia(query)
    
    // Set initial value
    setMatches(media.matches)
    
    // Create listener function
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }
    
    // Add listener
    media.addEventListener('change', listener)
    
    // Clean up
    return () => {
      media.removeEventListener('change', listener)
    }
  }, [query])
  
  return matches
}