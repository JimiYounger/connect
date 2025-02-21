import { NextResponse } from 'next/server'
import { getRedis } from '@/lib/redis'

export async function DELETE() {
  try {
    const redis = getRedis()

    // Get all error keys using the keys method from RedisService
    const errorKeys = await redis.keys('error:*')
    
    // Delete each error if keys exist
    if (errorKeys.length > 0) {
      for (const key of errorKeys) {
        await redis.delete(key)
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'All errors cleared successfully' 
    })
  } catch (error) {
    console.error('Failed to clear errors:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to clear errors' }, 
      { status: 500 }
    )
  }
} 