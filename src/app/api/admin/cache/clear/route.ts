// src/app/api/admin/cache/clear/route.ts

import { createClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { memoryCache } from '@/lib/memory-cache'

/**
 * Admin endpoint to clear memory cache
 * Useful when categories/videos are updated and need immediate reflection
 */
export async function POST() {
  try {
    const supabase = await createClient()
    
    // Get the authenticated user
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user has admin permissions
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role_type')
      .eq('user_id', user.id)
      .single()

    if (!userProfile || userProfile.role_type !== 'Admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Get cache stats before clearing
    const statsBefore = memoryCache.getStats()
    
    // Clear all cache
    memoryCache.clear()
    
    // Get stats after (should be empty)
    const statsAfter = memoryCache.getStats()
    
    console.log('Cache cleared by admin user:', user.id)
    console.log('Items cleared:', statsBefore.total)

    return NextResponse.json({
      success: true,
      message: 'Cache cleared successfully',
      statsBefore,
      statsAfter,
      clearedBy: user.id,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error clearing cache:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    )
  }
}

/**
 * Get cache statistics (for debugging)
 */
export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get the authenticated user
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user has admin permissions
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role_type')
      .eq('user_id', user.id)
      .single()

    if (!userProfile || userProfile.role_type !== 'Admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const stats = memoryCache.getStats()

    return NextResponse.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error getting cache stats:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    )
  }
}