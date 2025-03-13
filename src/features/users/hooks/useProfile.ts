// src/features/users/hooks/useProfile.ts

'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import type { Session } from '@supabase/supabase-js'
import type { UserProfile } from '../types'
import type { UseProfileResult, ProfileCache } from '../types/profile'
import { ErrorLogger } from '@/lib/logging/error-logger'
import { ErrorSeverity, ErrorSource } from '@/lib/types/errors'

// Cache management with automatic cleanup
const profileCache = new Map<string, ProfileCache>()
const CACHE_DURATION = 15 * 60 * 1000 // 15 minutes
const CACHE_CLEANUP_INTERVAL = 30 * 60 * 1000 // 30 minutes
const pendingRequests = new Map<string, Promise<UserProfile | null>>()

// Cleanup old cache entries periodically
if (typeof window !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, value] of profileCache.entries()) {
      if (now - value.timestamp > CACHE_DURATION) {
        profileCache.delete(key)
      }
    }
    // Also clear pending requests map
    pendingRequests.clear()
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

  const fetchProfile = useCallback(async (email: string, userId: string): Promise<UserProfile> => {
    const requestKey = `${userId}-${email}`
    
    // Check for pending request
    const pendingRequest = pendingRequests.get(requestKey)
    if (pendingRequest) {
      const result = await pendingRequest
      if (!result) {
        throw new Error('Profile fetch failed')
      }
      return result
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    const fetchPromise = (async () => {
      try {
        const response = await fetch(
          `/api/users/profile?email=${encodeURIComponent(email)}&googleUserId=${userId}`,
          { signal: abortControllerRef.current?.signal }
        )
        
        if (!response.ok) {
          throw new Error(`Failed to fetch profile: ${response.statusText}`)
        }

        const data = await response.json()
        
        if (!data || typeof data !== 'object') {
          throw new Error('Invalid profile data received')
        }

        // Validate that the response matches UserProfile type
        const profile = data as UserProfile
        if (!profile.email || !profile.user_id) {
          throw new Error('Invalid profile data: missing required fields')
        }

        if (sessionKey && mountedRef.current) {
          profileCache.set(sessionKey, {
            data: profile,
            timestamp: Date.now()
          })
        }
        
        return profile
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
      } finally {
        pendingRequests.delete(requestKey)
      }
    })()

    pendingRequests.set(requestKey, fetchPromise)
    return fetchPromise
  }, [sessionKey])

  useEffect(() => {
    mountedRef.current = true
    
    const loadProfile = async () => {
      if (!session?.user?.email || !session?.user?.id) {
        if (mountedRef.current) {
          setState(prev => ({ 
            ...prev, 
            isLoading: false, 
            isInitialized: true,
            profile: null 
          }))
        }
        return
      }

      // Use cache if available
      if (sessionKey) {
        const cached = profileCache.get(sessionKey)
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
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
            profile: null,
            error: err instanceof Error ? err : new Error('Profile fetch failed'),
            isLoading: false,
            isInitialized: true
          }))
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