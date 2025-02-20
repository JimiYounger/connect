// src/features/auth/types/auth.ts

import type { Session } from '@supabase/supabase-js'

export interface AuthError {
  type: 'session' | 'profile'
  error: Error
  timestamp: number
  context?: string
}

export interface LoadingState {
  session: boolean
  profile: boolean
  initializing: boolean
}

export interface AuthState {
  session: Session | null
  isInitialized: boolean
  loading: LoadingState
  errors: AuthError[]
  isAuthenticated: boolean
}

export interface AuthContextType extends Omit<AuthState, 'loading'> {
  loading: LoadingState & {
    any: boolean
  }
  signIn: (redirectTo?: string) => Promise<void>
  signOut: () => Promise<void>
  clearError: (type?: 'session' | 'profile') => void
  retryProfile: () => void
}

export interface AuthStateValidation {
  isValid: boolean
  error?: string
}

export type AuthStateUpdate = Partial<AuthState> | ((prev: AuthState) => Partial<AuthState>)

// Initial states
export const initialLoadingState: LoadingState = {
  session: true,
  profile: false,
  initializing: true
}

export const initialAuthState: AuthState = {
  session: null,
  isInitialized: false,
  loading: initialLoadingState,
  errors: [],
  isAuthenticated: false
} 