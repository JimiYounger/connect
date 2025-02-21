// src/features/auth/context/auth-context.tsx
'use client'

import { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react'
import type { Session } from '@supabase/supabase-js'
import { authService } from '../utils/supabase-client'
import { useProfile } from '@/features/users/hooks/useProfile'
import { useDebouncedCallback } from '@/hooks/use-debounced-callback'
import { ErrorLogger } from '@/lib/logging/error-logger'
import { ErrorSeverity, ErrorSource } from '@/lib/types/errors'
import { 
  initialAuthState,
  initialLoadingState
} from '../types/auth'
import type { 
  AuthState, 
  AuthContextType,
  AuthStateValidation,
} from '../types/auth'

// Validate state combinations
function validateAuthState(state: AuthState): AuthStateValidation {
  if (state.isAuthenticated && !state.session) {
    return {
      isValid: false,
      error: 'Invalid state: authenticated without session'
    }
  }

  if (state.loading.profile && !state.session) {
    return {
      isValid: false,
      error: 'Invalid state: loading profile without session'
    }
  }

  return { isValid: true }
}

const isSessionEqual = (prev: Session | null, next: Session | null): boolean => {
  if (!prev && !next) return true
  if (!prev || !next) return false
  return prev.user.id === next.user.id && 
         prev.user.email === next.user.email &&
         prev.access_token === next.access_token
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ 
  children, 
  initialSession 
}: { 
  children: React.ReactNode
  initialSession: Session | null 
}) {
  const [authState, setAuthState] = useState<AuthState>(() => ({
    ...initialAuthState,
    session: initialSession,
    isInitialized: !!initialSession,
    loading: initialSession 
      ? { ...initialLoadingState, initializing: false }
      : initialLoadingState,
    isAuthenticated: !!initialSession
  }))
  
  const initRef = useRef(false)
  const authChangeHandledRef = useRef(false)
  const initializingRef = useRef(false)
  const lastStateUpdateRef = useRef<string>('')
  
  const currentSession = useMemo(() => authState.session, [authState.session])
  
  const { refetch: refetchProfile } = useProfile(currentSession)

  const debouncedUpdateAuthState = useDebouncedCallback(
    (
      updates: Partial<AuthState> | ((prev: AuthState) => AuthState),
      action: string
    ) => {
      setAuthState(current => {
        if (action === lastStateUpdateRef.current) return current
        lastStateUpdateRef.current = action

        const newState = typeof updates === 'function' 
          ? updates(current)
          : { ...current, ...updates }

        const validation = validateAuthState(newState)
        if (!validation.isValid) {
          ErrorLogger.log(
            new Error(validation.error || 'Invalid auth state'),
            {
              severity: ErrorSeverity.HIGH,
              source: ErrorSource.CLIENT,
              context: {
                action,
                prevState: current,
                newState,
                userId: current.session?.user?.id ?? null
              }
            }
          )
          return current
        }

        return newState
      })
    },
    300
  )

  const updateAuthState = useCallback((
    updates: Partial<AuthState> | ((prev: AuthState) => AuthState),
    action: string
  ) => {
    debouncedUpdateAuthState(updates, action)
  }, [debouncedUpdateAuthState])

  const clearError = useCallback((type?: 'session' | 'profile') => {
    updateAuthState(prev => ({
      ...prev,
      errors: prev.errors.filter(error => type ? error.type !== type : false)
    }), 'Clear Error')
  }, [updateAuthState])

  const handleSignOut = useCallback(async () => {
    try {
      updateAuthState(current => ({
        ...current,
        loading: { ...current.loading, session: true }
      }), 'Sign Out Start')
      
      await authService.signOut()
    } catch (error) {
      console.error('Sign out error:', error)
      updateAuthState(current => ({
        ...current,
        loading: { ...current.loading, session: false }
      }), 'Sign Out Error')
      throw error
    }
  }, [updateAuthState])

  useEffect(() => {
    if (initRef.current || initializingRef.current || initialSession) return
    
    let mounted = true
    initializingRef.current = true

    const initializeAuth = async () => {
      try {
        const { data: { user }, error: userError } = await authService.client.auth.getUser()
        if (!mounted) return
        if (userError) throw userError

        const { data: { session }, error: sessionError } = await authService.client.auth.getSession()
        if (!mounted) return
        if (sessionError) throw sessionError

        if (session && user && session.user.id !== user.id) {
          throw new Error('User and session mismatch')
        }

        updateAuthState({
          session,
          isInitialized: true,
          loading: {
            session: false,
            profile: false,
            initializing: false
          },
          isAuthenticated: !!session && !!user
        }, 'Complete Initialize')
        
        initRef.current = true
      } catch (error) {
        await ErrorLogger.log(error, {
          severity: ErrorSeverity.HIGH,
          source: ErrorSource.CLIENT,
          context: { action: 'Initialize Auth' }
        })

        if (mounted) {
          updateAuthState({
            isInitialized: true,
            loading: { ...initialLoadingState, initializing: false }
          }, 'Initialize Error')
        }
      } finally {
        if (mounted) {
          initializingRef.current = false
        }
      }
    }

    initializeAuth()

    return () => {
      mounted = false
    }
  }, [updateAuthState, initialSession])

  useEffect(() => {
    if (initRef.current) return

    let lastEvent: string | null = null
    let lastUserId: string | null = null
    let subscription: { data: { subscription: { unsubscribe: () => void } } }

    const setupAuthListener = async () => {
      subscription = await authService.onAuthStateChange(async (event, session) => {
        const { data: { user } } = await authService.client.auth.getUser()
        
        if (
          lastEvent === event && 
          lastUserId === user?.id &&
          authChangeHandledRef.current
        ) {
          return
        }

        lastEvent = event
        lastUserId = user?.id || null
        authChangeHandledRef.current = true

        updateAuthState(current => {
          const loading = {
            ...current.loading,
            session: false,
            profile: false,
            initializing: false
          }

          if (isSessionEqual(current.session, session)) {
            return { ...current, loading, isInitialized: true }
          }

          return {
            ...current,
            session,
            loading,
            isInitialized: true,
            isAuthenticated: !!session && !!user
          }
        }, `Auth State Change: ${event}`)
      })
    }

    setupAuthListener()

    return () => {
      if (subscription) {
        subscription.data.subscription.unsubscribe()
      }
    }
  }, [updateAuthState])

  const contextValue = useMemo(() => {
    const hasSession = !!authState.session
    const isFullyInitialized = hasSession && authState.isInitialized && !authState.loading.initializing
    
    console.log('Auth Context Update:', {
      hasSession,
      isFullyInitialized,
      loading: authState.loading,
      sessionDetails: authState.session ? {
        id: authState.session.user.id,
        email: authState.session.user.email
      } : null
    });

    return {
      ...authState,
      session: authState.session,
      isAuthenticated: isFullyInitialized,
      loading: {
        ...authState.loading,
        any: authState.loading.session || authState.loading.initializing,
        session: authState.loading.session,
        profile: false,
        initializing: authState.loading.initializing
      },
      signIn: authService.signInWithGoogle,
      signOut: handleSignOut,
      clearError,
      retryProfile: refetchProfile
    }
  }, [
    authState,
    handleSignOut,
    clearError,
    refetchProfile
  ])

  if (authState.loading.initializing || !authState.isInitialized) {
    return null
  }

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}