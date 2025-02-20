// src/app/api/users/profile/route.ts

import { createServerSupabase } from '@/features/auth/utils/supabase-server'
import { NextResponse } from 'next/server'
import { syncService } from '@/features/users/services/sync-service'
import type { UserProfile } from '@/features/users/types'
import type { ProfileCache } from '@/features/users/types/profile'

// Add memory cache with types
const profileCache = new Map<string, {
  profile: UserProfile,
  timestamp: number
}>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes, shorter than your sync window

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

    // Check memory cache first
    const cacheKey = `${email}-${googleUserId}`
    const cached = profileCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('API Route - Serving cached profile for:', email)
      return NextResponse.json(cached.profile)
    }

    // First try to get existing profile
    const { data: existingProfile, error: fetchError } = await supabase
      .from('user_profiles')
      .select('*, last_airtable_sync')
      .eq('email', email)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Database fetch error:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch profile', details: fetchError },
        { status: 500 }
      )
    }

    // Check if we need to sync
    const needsSync = !existingProfile || 
      !existingProfile.last_airtable_sync || 
      isStale(existingProfile.last_airtable_sync)

    if (needsSync) {
      try {
        console.log('Profile needs sync, fetching from Airtable')
        const syncedProfile = await syncService.syncUserProfile(email, googleUserId)
        
        // Cache the synced profile
        profileCache.set(cacheKey, {
          profile: syncedProfile,
          timestamp: Date.now()
        })
        
        return NextResponse.json(syncedProfile)
      } catch (syncError) {
        console.error('Sync error:', syncError)
        // If sync fails but we have an existing profile, return it
        if (existingProfile) {
          console.log('Returning existing profile despite sync failure')
          // Cache the existing profile
          profileCache.set(cacheKey, {
            profile: existingProfile,
            timestamp: Date.now()
          })
          return NextResponse.json(existingProfile)
        }
        return NextResponse.json(
          { 
            error: 'Failed to sync profile with Airtable',
            details: syncError instanceof Error ? syncError.message : 'Unknown error'
          },
          { status: 500 }
        )
      }
    }

    // Cache the existing profile
    profileCache.set(cacheKey, {
      profile: existingProfile,
      timestamp: Date.now()
    })

    return NextResponse.json(existingProfile)
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

// Helper to check if the last sync is stale
function isStale(lastSync: string | null): boolean {
  if (!lastSync) return true
  
  const syncDate = new Date(lastSync)
  const now = new Date()
  const hoursSinceSync = (now.getTime() - syncDate.getTime()) / (1000 * 60 * 60)
  
  // Consider data stale after 24 hours
  return hoursSinceSync > 24
} 