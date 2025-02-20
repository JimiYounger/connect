// src/app/api/view-activities/route.ts

import { createServerSupabase } from '@/features/auth/utils/supabase-server'
import { NextResponse } from 'next/server'
import { ActivityType, ActivityStatus } from '@/lib/types/activity'
import type { ActivityLog } from '@/lib/types/activity'

// Type representing the raw database row
type ActivityRow = {
  id: string
  type: string
  action: string
  user_id: string | null
  user_email: string | null
  status: string
  details: unknown
  metadata: unknown
  timestamp: number
  created_at: string | null
  synced_at: string | null
  redis_id: string | null
}

export const dynamic = 'force-dynamic' // Ensure the route is not cached

export async function GET() {
  try {
    console.log('Fetching activities...')
    const supabase = await createServerSupabase()

    const { data: activities, error } = await supabase
      .from('activity_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(100)

    console.log('Raw activities data:', activities)
    console.log('Query error:', error)

    if (error) {
      console.error('Database fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch activities', details: error },
        { status: 500 }
      )
    }

    // Validate and transform the activities
    const validatedActivities = activities.map((row: ActivityRow): ActivityLog => ({
      id: row.id || crypto.randomUUID(),
      type: (row.type as ActivityType) || ActivityType.SYSTEM_EVENT,
      action: row.action || 'Unknown Action',
      userId: row.user_id ?? undefined,
      userEmail: row.user_email ?? undefined,
      status: (row.status as ActivityStatus) || ActivityStatus.INFO,
      details: row.details as Record<string, unknown> || {},
      metadata: row.metadata as Record<string, unknown> || {},
      timestamp: row.timestamp || Date.now()
    }))

    console.log('Validated activities:', validatedActivities)

    return NextResponse.json({ activities: validatedActivities })
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