// src/features/users/types/profile.ts

import type { UserProfile } from '../types'
import type { Session } from '@supabase/supabase-js'

export interface UseProfileResult {
  profile: UserProfile | null
  isLoading: boolean
  error: Error | null
  isInitialized: boolean
  refetch: () => Promise<void>
}

export interface ProfileCache {
  data: UserProfile
  timestamp: number
} 