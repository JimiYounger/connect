'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import type { Session } from '@supabase/supabase-js'
import type { UserProfile } from '../types'
import type { UseProfileResult, ProfileCache } from '../types/profile'
import { ErrorLogger } from '@/lib/logging/error-logger'
import { ErrorSeverity, ErrorSource } from '@/lib/types/errors'

// Cache management with automatic cleanup
const profileCache = new Map<string, ProfileCache>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
const CACHE_CLEANUP_INTERVAL = 10 * 60 * 1000 // 10 minutes

// Cleanup old cache entries periodically
if (typeof window !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, value] of profileCache.entries()) {
      if (now - value.timestamp > CACHE_DURATION) {
        profileCache.delete(key)
      }
    }
  }, CACHE_CLEANUP_INTERVAL)
}

export function useProfile(session: Session | null): UseProfileResult {
  const sessionKey = useMemo(() => 
    session ? `${session.user.id}-${session.user.email}` : null,
    [session]
  )

  // Check cache immediately for initial state
  const cachedData = useMemo(() => {
    if (!sessionKey) return null
    const cached = profileCache.get(sessionKey)
    return cached && Date.now() - cached.timestamp < CACHE_DURATION ? cached.data : null
  }, [sessionKey])

  const [state, setState] = useState<{
    profile: UserProfile | null
    isLoading: boolean
    error: Error | null
    isInitialized: boolean
    lastFetchTimestamp: number | null
  }>({
    profile: cachedData,
    isLoading: !!session && !cachedData,
    error: null,
    isInitialized: !!cachedData,
    lastFetchTimestamp: cachedData ? Date.now() : null
  })

  const mountedRef = useRef(true)
  const abortControllerRef = useRef<AbortController | null>(null)

  const fetchProfile = useCallback(async (email: string, userId: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    try {
      console.log('Fetching profile for:', email)
      const response = await fetch(
        `/api/users/profile?email=${encodeURIComponent(email)}&googleUserId=${userId}`,
        { signal: abortControllerRef.current?.signal }
      )
      
      if (!response.ok) {
        throw new Error(`Failed to fetch profile: ${response.statusText}`)
      }

      const data: UserProfile = await response.json()
      console.log('Received profile data:', data)
      
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid profile data received')
      }

      if (sessionKey && mountedRef.current) {
        console.log('Updating cache for:', sessionKey)
        profileCache.set(sessionKey, {
          data,
          timestamp: Date.now()
        })
      }
      
      return data
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        ErrorLogger.log(error, {
          severity: ErrorSeverity.MEDIUM,
          source: ErrorSource.CLIENT,
          context: {
            userId,
            email,
            action: 'Fetch Profile'
          }
        })
      }
      throw error
    }
  }, [sessionKey])

  useEffect(() => {
    mountedRef.current = true
    
    const loadProfile = async () => {
      if (!session?.user?.email || !session?.user?.id) {
        if (mountedRef.current) {
          setState(prev => ({ 
            ...prev, 
            isLoading: false, 
            isInitialized: true 
          }))
        }
        return
      }

      // Use cache if available
      if (sessionKey) {
        const cached = profileCache.get(sessionKey)
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
          console.log('Using cached profile for:', sessionKey)
          if (mountedRef.current) {
            setState({
              profile: cached.data,
              isLoading: false,
              error: null,
              isInitialized: true,
              lastFetchTimestamp: cached.timestamp
            })
          }
          return
        }
      }

      try {
        const data = await fetchProfile(session.user.email, session.user.id)
        if (mountedRef.current) {
          console.log('Setting profile data:', data)
          setState({
            profile: data,
            isLoading: false,
            error: null,
            isInitialized: true,
            lastFetchTimestamp: Date.now()
          })
        }
      } catch (err) {
        if (mountedRef.current && !(err instanceof DOMException && err.name === 'AbortError')) {
          setState({
            profile: null,
            isLoading: false,
            error: err instanceof Error ? err : new Error('Profile fetch failed'),
            isInitialized: true,
            lastFetchTimestamp: null
          })
        }
      }
    }

    loadProfile()

    return () => {
      mountedRef.current = false
      abortControllerRef.current?.abort()
    }
  }, [session, fetchProfile, sessionKey])

  return {
    profile: state.profile,
    isLoading: state.isLoading,
    error: state.error,
    isInitialized: state.isInitialized,
    refetch: useCallback(async () => {
      if (!session?.user?.email || !session?.user?.id) {
        throw new Error('Cannot refetch without session')
      }

      setState(prev => ({ ...prev, isLoading: true, error: null }))

      try {
        const data = await fetchProfile(session.user.email, session.user.id)
        if (mountedRef.current) {
          setState({
            profile: data,
            isLoading: false,
            error: null,
            isInitialized: true,
            lastFetchTimestamp: Date.now()
          })
        }
      } catch (err) {
        if (mountedRef.current && !(err instanceof DOMException && err.name === 'AbortError')) {
          setState(prev => ({
            ...prev,
            error: err instanceof Error ? err : new Error('Profile fetch failed'),
            isLoading: false
          }))
          throw err
        }
      }
    }, [session, fetchProfile])
  }
}