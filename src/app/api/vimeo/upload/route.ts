import { NextResponse } from 'next/server';

const VIMEO_API_URL = 'https://api.vimeo.com';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const filename = formData.get('filename') as string;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Step 1: Create the video with proper headers as per documentation
    const response = await fetch(`${VIMEO_API_URL}/me/videos`, {
      method: 'POST',
      headers: {
        'Authorization': `bearer ${process.env.VIMEO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.vimeo.*+json;version=3.4',
      },
      body: JSON.stringify({
        upload: {
          approach: 'tus',
          size: file.size
        },
        name: filename,
        description: 'Uploaded via Connect App',
        privacy: {
          view: 'anybody',
          embed: 'public',
          download: false
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Vimeo API Error:', errorText);
      return NextResponse.json(
        { error: 'Failed to create upload ticket', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Verify we got a tus upload approach back
    if (data.upload?.approach !== 'tus') {
      return NextResponse.json(
        { error: 'Invalid upload approach returned from Vimeo' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      upload_link: data.upload.upload_link,
      uri: data.uri
    });

  } catch (error) {
    console.error('Vimeo upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process upload' },
      { status: 500 }
    );
  }
} 