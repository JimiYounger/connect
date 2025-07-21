import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/features/auth/utils/supabase-server'
import { z } from 'zod'

const SyncVideoSchema = z.object({
  vimeoId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  duration: z.number(),
  createdAt: z.string(),
  thumbnailUrl: z.string().optional(),
  tags: z.array(z.string()).optional()
})

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabase()
    
    // Check authentication and admin access
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role_type')
      .eq('user_id', user.id)
      .single()

    if (!userProfile || userProfile.role_type?.toLowerCase() !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = SyncVideoSchema.parse(body)

    // Get or create PureLightTV category
    let { data: category } = await supabase
      .from('video_categories')
      .select('id')
      .eq('name', 'PureLightTV')
      .single()

    if (!category) {
      const { data: newCategory, error: categoryError } = await supabase
        .from('video_categories')
        .insert({
          name: 'PureLightTV',
          description: 'Videos from the PureLightTV showcase',
          created_by: user.id
        })
        .select('id')
        .single()

      if (categoryError) {
        console.error('Error creating PureLightTV category:', categoryError)
        return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
      }
      category = newCategory
    }

    // Check if video already exists
    const { data: existingVideo } = await supabase
      .from('video_files')
      .select('id, title, description, updated_at')
      .eq('vimeo_id', validatedData.vimeoId)
      .single()

    if (existingVideo) {
      // Update existing video if content has changed
      const hasChanges = 
        existingVideo.title !== validatedData.title ||
        existingVideo.description !== validatedData.description

      if (hasChanges) {
        const { error: updateError } = await supabase
          .from('video_files')
          .update({
            title: validatedData.title,
            description: validatedData.description,
            vimeo_duration: validatedData.duration,
            custom_thumbnail_url: validatedData.thumbnailUrl,
            tags: validatedData.tags,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingVideo.id)

        if (updateError) {
          console.error('Error updating video:', updateError)
          return NextResponse.json({ error: 'Failed to update video' }, { status: 500 })
        }

        return NextResponse.json({ 
          action: 'updated', 
          videoFileId: existingVideo.id 
        })
      }

      return NextResponse.json({ 
        action: 'skipped', 
        videoFileId: existingVideo.id 
      })
    }

    // Create new video file entry
    const { data: newVideo, error: insertError } = await supabase
      .from('video_files')
      .insert({
        title: validatedData.title,
        description: validatedData.description,
        vimeo_id: validatedData.vimeoId,
        vimeo_duration: validatedData.duration,
        custom_thumbnail_url: validatedData.thumbnailUrl,
        video_category_id: category.id,
        tags: validatedData.tags,
        library_status: 'approved', // Auto-approve PureLightTV videos
        created_by: user.id,
        public_sharing_enabled: false,
        // Set visibility to all authenticated users
        visibility_conditions: {
          roleTypes: ['setter', 'closer', 'manager', 'admin', 'executive'],
          teams: [],
          areas: [],
          regions: []
        }
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('Error creating video:', insertError)
      return NextResponse.json({ error: 'Failed to create video' }, { status: 500 })
    }

    return NextResponse.json({ 
      action: 'added', 
      videoFileId: newVideo.id 
    })

  } catch (error) {
    console.error('Sync PureLightTV video error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to sync video' },
      { status: 500 }
    )
  }
}