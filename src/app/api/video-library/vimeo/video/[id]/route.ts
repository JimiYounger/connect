import { NextResponse } from 'next/server'

interface VimeoVideoResponse {
  uri: string
  name: string
  description: string
  duration: number
  pictures?: {
    sizes: Array<{
      width: number
      height: number
      link: string
    }>
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!process.env.VIMEO_ACCESS_TOKEN) {
      return NextResponse.json(
        { success: false, error: 'Vimeo access token not configured' },
        { status: 500 }
      )
    }

    const response = await fetch(`https://api.vimeo.com/videos/${id}`, {
      headers: {
        'Authorization': `bearer ${process.env.VIMEO_ACCESS_TOKEN}`,
        'Accept': 'application/vnd.vimeo.*+json;version=3.4'
      }
    })

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { success: false, error: 'Video not found' },
          { status: 404 }
        )
      }
      throw new Error(`Vimeo API error: ${response.status}`)
    }

    const vimeoData: VimeoVideoResponse = await response.json()

    // Extract video ID from URI
    const videoId = vimeoData.uri.split('/').pop() || id

    // Get the best thumbnail
    let thumbnailUrl = ''
    if (vimeoData.pictures?.sizes && vimeoData.pictures.sizes.length > 0) {
      // Find a good medium size thumbnail (around 640px width)
      const thumbnail = vimeoData.pictures.sizes.find(size => size.width >= 640) ||
                       vimeoData.pictures.sizes[vimeoData.pictures.sizes.length - 1]
      thumbnailUrl = thumbnail.link
    }

    const video = {
      id: videoId,
      title: vimeoData.name || 'Untitled Video',
      description: vimeoData.description || '',
      thumbnail_url: thumbnailUrl,
      duration: vimeoData.duration || 0,
      uri: vimeoData.uri
    }

    return NextResponse.json({
      success: true,
      video
    })

  } catch (error) {
    console.error('Error fetching Vimeo video:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch video' 
      },
      { status: 500 }
    )
  }
}