// src/features/auth/types/auth.ts

import type { Session } from '@supabase/supabase-js'
import type { UserProfile } from '@/features/users/types'

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
  profile: UserProfile | null
}

export interface AuthContextType extends AuthState {
  signIn: (redirectTo?: string) => Promise<void>
  signOut: () => Promise<void>
  clearError: () => void
  retryProfile: () => Promise<void>
  loading: LoadingState & {
    any: boolean
  }
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
  isAuthenticated: false,
  profile: null
} 