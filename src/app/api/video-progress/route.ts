import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { action, videoId, userId, position, duration } = await request.json()
    
    if (!videoId || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createClient()

    if (action === 'get') {
      // Get current progress
      const { data, error } = await supabase
        .from('video_watches')
        .select('last_position')
        .eq('video_file_id', videoId)
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error getting progress:', error)
        return NextResponse.json({ position: 0 })
      }

      return NextResponse.json({ position: data?.last_position || 0 })
    }

    if (action === 'save') {
      // Save progress
      if (!position || !duration) {
        return NextResponse.json({ error: 'Missing position or duration' }, { status: 400 })
      }

      const percentComplete = (position / duration) * 100
      const completed = percentComplete >= 90

      const { error } = await supabase
        .from('video_watches')
        .upsert({
          video_file_id: videoId,
          user_id: userId,
          last_position: position,
          watched_seconds: Math.max(position, 0),
          total_duration: duration,
          percent_complete: percentComplete,
          completed,
          completed_at: completed ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'video_file_id,user_id'
        })

      if (error) {
        console.error('Error saving progress:', error)
        return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 })
      }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Video progress API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}