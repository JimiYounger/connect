// src/app/api/log-error/route.ts

import { NextResponse } from 'next/server'
import { getRedis } from '@/lib/redis'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: Request) {
  try {
    const redis = getRedis()
    if (!redis) {
      throw new Error('Redis client is not initialized')
    }

    const errorData = await request.json()
    console.log('Received error data:', errorData)
    
    const errorId = uuidv4()
    const errorToStore = {
      id: errorId,
      ...errorData,
      source: errorData.source?.toLowerCase()
    }
    
    console.log('Storing error:', errorToStore)
    
    await redis.set(`error:${errorId}`, errorToStore, { ex: 60 * 60 * 24 * 30 }) // 30 days

    return NextResponse.json({ 
      success: true, 
      errorId 
    })
  } catch (error) {
    console.error('Failed to log error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to log error' }, 
      { status: 500 }
    )
  }
} 