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
    const syncUrl = new URL('/api/sync/profiles', process.env.NEXT_PUBLIC_VERCEL_URL || 'https://www.plpconnect.com')
    syncUrl.searchParams.set('secret', process.env.SYNC_SECRET!)

    const res = await fetch(syncUrl.toString(), {
      // since this is server→server, you don't need extra headers
      // next: { revalidate: 0 }  // optional: disable Next.js cache
    })

    const body = await res.json()
    return NextResponse.json(
      { ok: true, syncResponse: body },
      { status: res.status }
    )

  } catch (err) {
    console.error('Cron error', err)
    return NextResponse.json({ error: 'Cron failed' }, { status: 500 })
  }
}
