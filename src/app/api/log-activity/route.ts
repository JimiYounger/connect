// src/app/api/log-activity/route.ts

import { NextResponse } from 'next/server'
import { ActivityLogger } from '@/lib/logging/activity-logger'
import { ActivityType, ActivityStatus } from '@/lib/types/activity'
import { createServerSupabase } from '@/features/auth/utils/supabase-server'

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabase()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { type, action, status, details, metadata } = body

    if (!type || !action || !status || !details) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const activityId = await ActivityLogger.log(
      type as ActivityType,
      action,
      status as ActivityStatus,
      details,
      session.user.id,
      session.user.email,
      metadata
    )

    return NextResponse.json({ success: true, activityId })
  } catch (error) {
    console.error('Failed to log activity:', error)
    return NextResponse.json(
      { error: 'Failed to log activity' },
      { status: 500 }
    )
  }
}