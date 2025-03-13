// src/features/auth/context/auth-context.tsx
'use client'

import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react'
import type { Session } from '@supabase/supabase-js'
import { authService } from '../utils/supabase-client'
import { useProfile } from '@/features/users/hooks/useProfile'
import type { UserProfile } from '@/features/users/types'
import type { 
  AuthState, 
  AuthContextType, 
  LoadingState,
  AuthStateValidation 
} from '../types/auth'
import { initialAuthState } from '../types/auth'
import { ErrorLogger } from '@/lib/logging/error-logger'
import { ErrorSeverity, ErrorSource } from '@/lib/types/errors'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: React.ReactNode
  initialSession: Session | null
  initialLoading?: LoadingState
  initialProfile?: UserProfile
}

export function AuthProvider({ 
  children, 
  initialSession,
  initialLoading,
  initialProfile 
}: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>(() => ({
    ...initialAuthState,
    session: initialSession,
    profile: initialProfile || null,
    loading: initialLoading || {
      session: false,
      profile: false,
      initializing: false
    },
    isInitialized: true,
    isAuthenticated: !!initialSession
  }))

  const { refetch: refetchProfile } = useProfile(authState.session)

  const updateAuthState = useCallback((
    updates: Partial<AuthState> | ((prev: AuthState) => Partial<AuthState>),
    action: string
  ) => {
    setAuthState(current => {
      const newState = typeof updates === 'function' 
        ? { ...current, ...updates(current) }
        : { ...current, ...updates }

      const validation = validateAuthState(newState)
      if (!validation.isValid) {
        ErrorLogger.log(
          new Error(validation.error || 'Invalid auth state'),
          {
            severity: ErrorSeverity.HIGH,
            source: ErrorSource.CLIENT,
            context: { action }
          }
        )
        return current
      }

      return newState
    })
  }, [])

  const handleSignOut = useCallback(async () => {
    try {
      await authService.signOut()
      updateAuthState({
        session: null,
        profile: null,
        isAuthenticated: false,
        errors: []
      }, 'signOut')
    } catch (error) {
      ErrorLogger.log(error, {
        severity: ErrorSeverity.HIGH,
        source: ErrorSource.CLIENT,
        context: { action: 'signOut' }
      })
    }
  }, [updateAuthState])

  // Debounced profile refetch
  const debouncedRefetch = useMemo(() => {
    let timeout: NodeJS.Timeout
    return () => {
      clearTimeout(timeout)
      timeout = setTimeout(() => {
        if (authState.session) {
          refetchProfile()
        }
      }, 100)
    }
  }, [authState.session, refetchProfile])

  useEffect(() => {
    if (authState.session) {
      debouncedRefetch()
    }
  }, [authState.session, debouncedRefetch])

  const contextValue = useMemo(() => ({
    ...authState,
    loading: {
      ...authState.loading,
      any: authState.loading.session || 
           authState.loading.profile || 
           authState.loading.initializing
    },
    signIn: authService.signInWithGoogle,
    signOut: handleSignOut,
    clearError: () => updateAuthState(
      state => ({ errors: state.errors.slice(1) }),
      'clearError'
    ),
    retryProfile: refetchProfile
  }), [
    authState,
    handleSignOut,
    updateAuthState,
    refetchProfile
  ])

  if (!authState.isInitialized || authState.loading.initializing) {
    return null
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

function validateAuthState(state: AuthState): AuthStateValidation {
  if (!state) {
    return { isValid: false, error: 'State is null' }
  }

  if (state.isAuthenticated && !state.session) {
    return { 
      isValid: false, 
      error: 'Authenticated state requires session' 
    }
  }

  if (state.session && !state.isAuthenticated) {
    return { 
      isValid: false, 
      error: 'Session present but not authenticated' 
    }
  }

  return { isValid: true }
}