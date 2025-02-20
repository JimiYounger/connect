import { NextResponse } from 'next/server'
import { redis } from '@/lib/redis'

export async function DELETE() {
  try {
    if (!redis) {
      throw new Error('Redis client is not initialized')
    }

    // Get all error keys
    const keys = await redis.keys('error:*')
    
    // Delete each error
    if (keys.length > 0) {
      await Promise.all(keys.map(key => redis!.delete(key)))
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