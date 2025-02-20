import { testRedisConnection } from '@/lib/redis/test-connection'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const isConnected = await testRedisConnection()
    
    if (isConnected) {
      return NextResponse.json({ 
        status: 'success', 
        message: 'Redis connection successful' 
      })
    } else {
      return NextResponse.json({ 
        status: 'error', 
        message: 'Redis connection failed' 
      }, { status: 500 })
    }
  } catch (error) {
    return NextResponse.json({ 
      status: 'error', 
      message: 'Redis test failed', 
      error: String(error) 
    }, { status: 500 })
  }
} 