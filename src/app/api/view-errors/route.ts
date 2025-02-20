// src/app/api/view-errors/route.ts

import { ErrorLogger } from '@/lib/logging/error-logger'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const recentErrors = await ErrorLogger.getRecentErrors(5)
    return NextResponse.json({ errors: recentErrors })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch errors' }, { status: 500 })
  }
} 