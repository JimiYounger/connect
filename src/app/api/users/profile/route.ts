// src/app/api/users/profile/route.ts

import { createServerSupabase } from '@/features/auth/utils/supabase-server'
import { NextResponse } from 'next/server'
import { syncService } from '@/features/users/services/sync-service'
import type { UserProfile } from '@/features/users/types'

// Add memory cache with types
const profileCache = new Map<string, {
  profile: UserProfile,
  timestamp: number
}>()

// Optimize cache duration based on sync window
const CACHE_DURATION = 15 * 60 * 1000 // 15 minutes
const STALE_WHILE_REVALIDATE = 30 * 60 * 1000 // 30 minutes

// Add request deduplication
const pendingRequests = new Map<string, Promise<Response>>()

export const dynamic = 'force-dynamic' // Ensure the route is not cached

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const googleUserId = searchParams.get('googleUserId')

    console.log('API Route - Received request for:', { email, googleUserId })

    if (!email || !googleUserId) {
      return NextResponse.json(
        { error: 'Email and googleUserId are required' },
        { status: 400 }
      )
    }

    const cacheKey = `${email}-${googleUserId}`

    // Check for pending request
    const pendingRequest = pendingRequests.get(cacheKey)
    if (pendingRequest) {
      return pendingRequest
    }

    // Create new request promise
    const requestPromise = handleProfileRequest(email, googleUserId, cacheKey)
    pendingRequests.set(cacheKey, requestPromise)

    // Cleanup after request completes
    requestPromise.finally(() => {
      pendingRequests.delete(cacheKey)
    })

    return requestPromise
  } catch (error) {
    console.error('API Route - Unexpected error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

async function handleProfileRequest(email: string, googleUserId: string, cacheKey: string): Promise<Response> {
  try {
    const supabase = await createServerSupabase()

    // Validate the user session first
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized access' },
        { status: 401 }
      )
    }

    // Verify that the requested profile matches the authenticated user
    if (user.email !== email || user.id !== googleUserId) {
      return NextResponse.json(
        { error: 'Unauthorized: Profile access mismatch' },
        { status: 403 }
      )
    }

    // Check memory cache
    const cached = profileCache.get(cacheKey)
    const now = Date.now()
    
    // Return cache if fresh
    if (cached && (now - cached.timestamp < CACHE_DURATION)) {
      return NextResponse.json(cached.profile)
    }

    // Return stale cache while revalidating in background
    if (cached && (now - cached.timestamp < STALE_WHILE_REVALIDATE)) {
      // Revalidate in background
      revalidateProfile(email, googleUserId, cacheKey, supabase).catch(console.error)
      // Return stale data
      return NextResponse.json(cached.profile)
    }

    // No cache or cache too old, fetch fresh data
    const profile = await getFreshProfile(email, googleUserId, supabase)
    
    // Cache the fresh profile
    profileCache.set(cacheKey, {
      profile,
      timestamp: now
    })

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Profile request error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch profile',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

async function getFreshProfile(email: string, googleUserId: string, supabase: any) {
  // First try to get existing profile
  const { data: existingProfile, error: fetchError } = await supabase
    .from('user_profiles')
    .select('*, last_airtable_sync')
    .eq('email', email)
    .single()

  if (fetchError && fetchError.code !== 'PGRST116') {
    throw fetchError
  }

  // Check if we need to sync
  const needsSync = !existingProfile || 
    !existingProfile.last_airtable_sync || 
    isStale(existingProfile.last_airtable_sync)

  if (needsSync) {
    try {
      return await syncService.syncUserProfile(email, googleUserId)
    } catch (syncError) {
      console.error('Sync error:', syncError)
      if (existingProfile) {
        return existingProfile
      }
      throw syncError
    }
  }

  return existingProfile
}

async function revalidateProfile(email: string, googleUserId: string, cacheKey: string, supabase: any) {
  try {
    const profile = await getFreshProfile(email, googleUserId, supabase)
    profileCache.set(cacheKey, {
      profile,
      timestamp: Date.now()
    })
  } catch (error) {
    console.error('Background revalidation failed:', error)
  }
}

// Helper to check if the last sync is stale
function isStale(lastSync: string | null): boolean {
  if (!lastSync) return true
  
  const syncDate = new Date(lastSync)
  const now = new Date()
  const hoursSinceSync = (now.getTime() - syncDate.getTime()) / (1000 * 60 * 60)
  
  // Consider data stale after 24 hours
  return hoursSinceSync > 24
} 