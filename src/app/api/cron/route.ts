// my-app/src/app/api/cron/route.ts
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  // 1️⃣ Protect this endpoint
  const auth = req.headers.get('Authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 2️⃣ Call your existing sync route
    // Make sure to use full URL with https://
    let baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'https://www.plpconnect.com';
      
    // Remove any trailing slashes
    baseUrl = baseUrl.replace(/\/$/, '');
    
    const syncUrl = new URL('/api/sync/profiles', baseUrl);
    
    // Add secret as query parameter
    if (process.env.SYNC_SECRET) {
      syncUrl.searchParams.set('secret', process.env.SYNC_SECRET);
    }

    console.log('Attempting to fetch from URL:', syncUrl.toString());
    
    const res = await fetch(syncUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Add authorization header (belt and suspenders approach)
        'Authorization': process.env.SYNC_SECRET ? `Bearer ${process.env.SYNC_SECRET}` : '',
      },
      cache: 'no-store'
    });

    // Log response details for debugging
    console.log('Response status:', res.status);
    console.log('Response type:', res.headers.get('content-type'));
    
    // Check if we got a successful response
    if (!res.ok) {
      const text = await res.text();
      console.error('Error response body:', text.substring(0, 200) + '...');
      return NextResponse.json({ 
        error: `Sync request failed with status ${res.status}`,
        details: text.substring(0, 200) + '...'
      }, { status: 500 });
    }
    
    // Check content type to avoid JSON parse errors
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await res.text();
      console.error('Received non-JSON response:', text.substring(0, 200) + '...');
      return NextResponse.json({ 
        error: 'Received non-JSON response from sync endpoint',
        contentType,
        details: text.substring(0, 200) + '...'
      }, { status: 500 });
    }

    const body = await res.json();
    return NextResponse.json(
      { ok: true, syncResponse: body },
      { status: res.status }
    );

  } catch (err) {
    console.error('Cron error', err);
    return NextResponse.json({ 
      error: 'Cron failed', 
      message: err instanceof Error ? err.message : String(err)
    }, { status: 500 });
  }
}
