import { NextResponse } from 'next/server';

const VIMEO_API_URL = 'https://api.vimeo.com';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const page = searchParams.get('page') || '1';
    const perPage = searchParams.get('per_page') || '10';
    const sort = searchParams.get('sort') || 'date';
    const direction = searchParams.get('direction') || 'desc';

    const params = new URLSearchParams({
      page,
      per_page: perPage,
      sort,
      direction
    });

    if (query) {
      params.append('query', query);
    }

    const response = await fetch(
      `${VIMEO_API_URL}/me/videos?${params.toString()}`,
      {
        headers: {
          'Authorization': `bearer ${process.env.VIMEO_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.vimeo.*+json;version=3.4'
        }
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch videos' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Vimeo fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch videos' },
      { status: 500 }
    );
  }
} 