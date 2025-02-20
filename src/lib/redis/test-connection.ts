import { redis } from './index'

export async function testRedisConnection() {
  try {
    if (!redis) {
      console.error('❌ Redis connection failed: Redis client not initialized')
      return false
    }

    // Test basic set/get operations
    await redis.set('test:connection', { status: 'ok', timestamp: Date.now() })
    const result = await redis.get('test:connection')
    
    if (result) {
      console.log('✅ Redis connection successful:', result)
      return true
    }
    
    console.error('❌ Redis connection failed: No data retrieved')
    return false
  } catch (error) {
    console.error('❌ Redis connection failed:', error)
    return false
  }
} 