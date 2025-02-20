// src/features/users/types/profile.ts

import type { UserProfile } from '../types'

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