import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { Database } from '@/types/supabase'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // First get the thumbnail record
    const { data: thumbnail, error: dbError } = await supabase
      .from('thumbnails')
      .select('*')
      .eq('id', params.id)
      .single()

    if (dbError || !thumbnail) {
      return new NextResponse('Thumbnail not found', { status: 404 })
    }

    // Fetch the actual image from uploadcare
    const imageResponse = await fetch(thumbnail.uploadcare_url)
    if (!imageResponse.ok) {
      return new NextResponse('Failed to fetch image', { status: 502 })
    }

    // Get the image data and content type
    const imageData = await imageResponse.arrayBuffer()
    const contentType = imageResponse.headers.get('content-type')

    // Return the image with proper headers
    return new NextResponse(imageData, {
      headers: {
        'Content-Type': contentType || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('Error fetching thumbnail:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 