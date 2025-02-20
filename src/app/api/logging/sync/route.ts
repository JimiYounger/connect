// app/api/logging/sync/route.ts
import { createServerSupabase } from '@/features/auth/utils/supabase-server'
import { NextResponse } from 'next/server'
import { getRedis } from '@/lib/redis'
import { ActivityLog } from '@/lib/types/activity'
import { ErrorLog } from '@/lib/types/errors'
import type { Database } from '@/types/supabase'
import type { Json } from '@/types/supabase'
import { verifySignatureEdge } from '@upstash/qstash/dist/nextjs'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const BATCH_SIZE = 100

function ensureJson(value: Record<string, unknown> | undefined): Json | undefined {
  if (!value) return undefined
  return value as Json
}

async function handler() {
  try {
    const redis = getRedis()
    const supabase = await createServerSupabase()
    
    // Rest of your handler code remains the same...
    // 1. Get unsynced activity logs from Redis
    const activityKeys = await redis.keys('activity:*')
    const activityLogs: ActivityLog[] = []
    
    for (const key of activityKeys.slice(0, BATCH_SIZE)) {
      const log = await redis.get<ActivityLog>(key)
      if (log) activityLogs.push(log)
    }

    // 2. Get unsynced error logs from Redis
    const errorKeys = await redis.keys('error:*')
    const errorLogs: ErrorLog[] = []
    
    for (const key of errorKeys.slice(0, BATCH_SIZE)) {
      const log = await redis.get<ErrorLog>(key)
      if (log) errorLogs.push(log)
    }

    // 3. Sync activity logs to Supabase
    if (activityLogs.length > 0) {
      type ActivityLogInsert = Database['public']['Tables']['activity_logs']['Insert']
      
      const { error: activityError } = await supabase
        .from('activity_logs')
        .upsert(
          activityLogs.map(log => ({
            id: log.id,
            redis_id: `activity:${log.id}`,
            type: log.type,
            action: log.action,
            user_id: log.userId,
            user_email: log.userEmail,
            status: log.status,
            details: log.details as Json,
            metadata: log.metadata as Json | null,
            timestamp: log.timestamp,
            created_at: new Date().toISOString()
          } satisfies ActivityLogInsert))
        )

      if (activityError) throw activityError
    }

    // 4. Sync error logs to Supabase
    if (errorLogs.length > 0) {
      type ErrorLogInsert = Database['public']['Tables']['error_logs']['Insert']
      
      const { error: errorLogsError } = await supabase
        .from('error_logs')
        .upsert(
          errorLogs.map(log => ({
            id: log.id,
            redis_id: `error:${log.id}`,
            message: log.message,
            stack: log.stack,
            severity: log.severity,
            source: log.source,
            user_id: log.userId,
            path: log.path,
            context: ensureJson(log.context),
            timestamp: log.timestamp,
            created_at: new Date().toISOString()
          } satisfies ErrorLogInsert))
        )

      if (errorLogsError) throw errorLogsError
    }

    // 5. Delete synced logs from Redis
    for (const log of activityLogs) {
      await redis.delete(`activity:${log.id}`)
    }

    for (const log of errorLogs) {
      await redis.delete(`error:${log.id}`)
    }

    return NextResponse.json({
      success: true,
      synced: {
        activities: activityLogs.length,
        errors: errorLogs.length
      }
    })

  } catch (error) {
    console.error('Sync failed:', error)
    return NextResponse.json(
      { error: 'Failed to sync logs' },
      { status: 500 }
    )
  }
}

// Use verifySignatureEdge instead of verifySignature
export const POST = verifySignatureEdge(handler)