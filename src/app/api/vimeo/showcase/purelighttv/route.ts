import { NextResponse } from 'next/server';

const VIMEO_API_URL = 'https://api.vimeo.com';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const perPage = searchParams.get('per_page') || '10';

    const params = new URLSearchParams({
      page,
      per_page: perPage,
      sort: 'date',
      direction: 'desc'
    });

    const response = await fetch(
      `${VIMEO_API_URL}/albums/11373641/videos?${params.toString()}`,
      {
        headers: {
          'Authorization': `bearer ${process.env.VIMEO_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.vimeo.*+json;version=3.4'
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Vimeo API error:', {
        status: response.status,
        statusText: response.statusText,
        url: `${VIMEO_API_URL}/albums/11373641/videos?${params.toString()}`,
        errorBody: errorText
      });
      return NextResponse.json(
        { 
          error: 'Failed to fetch PureLightTV videos',
          details: `${response.status}: ${response.statusText}`,
          vimeoError: errorText
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('PureLightTV fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch PureLightTV videos' },
      { status: 500 }
    );
  }
}