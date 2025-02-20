// src/app/api/view-activities/route.ts

import { createServerSupabase } from '@/features/auth/utils/supabase-server'
import { NextResponse } from 'next/server'
import { ActivityType, ActivityStatus } from '@/lib/types/activity'
import type { ActivityLog } from '@/lib/types/activity'

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
    const validatedActivities = activities.map((activity: any): ActivityLog => ({
      id: activity.id || crypto.randomUUID(),
      type: activity.type || ActivityType.SYSTEM_EVENT,
      action: activity.action || 'Unknown Action',
      userId: activity.user_id,
      userEmail: activity.user_email,
      status: activity.status || ActivityStatus.INFO,
      details: activity.details || {},
      metadata: activity.metadata || {},
      timestamp: activity.timestamp || Date.now()
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