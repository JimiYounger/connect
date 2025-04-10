// ✅ app/(test)/upload-test/page.tsx
'use client'

import { UploadForm } from '@/features/documentLibrary/upload/UploadForm'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

// The useRoleFilters hook now has built-in mock data support for test environments

// Use proper UUIDs for category IDs to match database schema requirements
const mockCategories = [
  { id: '584600b9-7254-4a5c-b2db-db9dd84e9d0e', name: 'Guides' },
  { id: '9fd14318-31b5-45c6-95d8-329915f009fb', name: 'Reports' },
]

const mockTags = ['solar', 'pricing', 'contract', 'installation']

// This is a mock user ID that may not exist in user_profiles
const mockUserId = '048ccf06-50f0-47ff-9877-deffde376067'

export default function UploadTestPage() {
  const [validUserIds, setValidUserIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  
  // Fetch some valid user IDs from the database to use
  useEffect(() => {
    async function fetchValidUsers() {
      try {
        const supabase = createClient()
        console.log('🔍 Checking for valid user IDs in the database...')
        
        const { data: users, error } = await supabase
          .from('user_profiles')
          .select('id, email, first_name, last_name')
          .limit(5)
        
        if (error) {
          console.error('Error fetching user profiles:', error)
          return
        }
        
        if (users && users.length > 0) {
          console.log('✅ Found valid users:', users)
          setValidUserIds(users.map(user => user.id))
        } else {
          console.warn('⚠️ No user profiles found in the database')
        }
      } catch (e) {
        console.error('Exception fetching users:', e)
      } finally {
        setLoading(false)
      }
    }
    
    fetchValidUsers()
  }, [])
  
  // Check if our mock ID exists in valid IDs
  const mockIdExists = validUserIds.includes(mockUserId)
  
  // Use the first valid ID if available, otherwise fall back to mock
  const userId = validUserIds.length > 0 ? validUserIds[0] : mockUserId
  
  console.log('🧪 Test page using userId:', userId)
  console.log('🧪 Mock ID exists in database?', mockIdExists)
  
  if (loading) {
    return <div className="p-10">Loading user data...</div>
  }
  
  return (
    <main className="p-10">
      <div className="mb-5 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <h3 className="font-bold">Debug Info:</h3>
        <p>Using user ID: {userId}</p>
        <p>Valid user IDs found: {validUserIds.length}</p>
        {validUserIds.length === 0 && (
          <p className="text-red-500 font-bold">
            Warning: No valid user IDs found in database!
          </p>
        )}
        <p className="mt-2">Note: Using mock role filters for the visibility selector.</p>
      </div>
      
      <UploadForm 
        categories={mockCategories} 
        allTags={mockTags} 
        userId={userId} 
      />
    </main>
  )
}
