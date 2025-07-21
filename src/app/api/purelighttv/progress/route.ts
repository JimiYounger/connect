import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/features/auth/utils/supabase-server'
import { z } from 'zod'

const SaveProgressSchema = z.object({
  action: z.literal('save'),
  vimeoId: z.string(),
  videoTitle: z.string(),
  videoDuration: z.number(),
  currentPosition: z.number(),
  events: z.array(z.any()).optional(),
  deviceType: z.string().optional(),
  userAgent: z.string().optional()
})

const GetProgressSchema = z.object({
  action: z.literal('get'),
  vimeoId: z.string()
})

const RequestSchema = z.union([SaveProgressSchema, GetProgressSchema])

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabase()
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = RequestSchema.parse(body)

    if (validatedData.action === 'get') {
      // Get watch progress
      const { data: progress } = await supabase
        .from('video_watches')
        .select('watched_seconds, total_duration, percent_complete, completed, last_position')
        .eq('video_file_id', validatedData.vimeoId)
        .eq('user_id', user.id)
        .single()

      if (!progress) {
        return NextResponse.json({
          position: 0,
          percentComplete: 0,
          completed: false
        })
      }

      return NextResponse.json({
        position: progress.last_position || 0,
        percentComplete: progress.percent_complete || 0,
        completed: progress.completed || false
      })
    }

    if (validatedData.action === 'save') {
      // Calculate metrics
      const watchedSeconds = Math.max(validatedData.currentPosition, 0)
      const totalDuration = validatedData.videoDuration
      const percentComplete = totalDuration > 0 ? (watchedSeconds / totalDuration) * 100 : 0
      const completed = percentComplete >= 90

      // Upsert watch progress
      const { error } = await supabase
        .from('video_watches')
        .upsert({
          video_file_id: validatedData.vimeoId,
          user_id: user.id,
          watched_seconds: watchedSeconds,
          total_duration: totalDuration,
          percent_complete: percentComplete,
          last_position: validatedData.currentPosition,
          completed,
          completed_at: completed ? new Date().toISOString() : null,
          events: validatedData.events || [],
          device_type: validatedData.deviceType,
          user_agent: validatedData.userAgent,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'video_file_id,user_id'
        })

      if (error) {
        console.error('Error saving PureLightTV progress:', error)
        return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 })
      }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('PureLightTV progress API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}