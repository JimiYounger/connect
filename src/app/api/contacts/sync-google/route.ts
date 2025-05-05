// my-app/src/app/api/contacts/sync-google/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

// This is a mock API endpoint to simulate Google sync
export async function POST(request: NextRequest) {
  try {
    const { first_name, last_name } = await request.json()

    if (!first_name || !last_name) {
      return NextResponse.json({ error: 'Missing first_name or last_name' }, { status: 400 })
    }
    
    // Initialize Supabase client for departments lookup
    const supabase = await createClient()
    
    // Call the Make.com webhook
    const makeWebhookUrl = process.env.MAKE_GOOGLE_SYNC_WEBHOOK_URL
    if (!makeWebhookUrl) {
      console.error('Missing MAKE_GOOGLE_SYNC_WEBHOOK_URL environment variable')
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    console.log(`[SYNC_GOOGLE] Calling Make.com webhook with data:`, { first_name, last_name })
    
    const response = await fetch(makeWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ first_name, last_name }),
    })

    if (!response.ok) {
      console.error(`Make webhook responded with ${response.status}: ${response.statusText}`)
      return NextResponse.json({ error: 'Failed to fetch data from directory' }, { status: 502 })
    }

    // Parse the response safely
    const data = await response.json()
    console.log('[SYNC_GOOGLE] Raw response from Make.com:', JSON.stringify(data, null, 2))
    
    // Check if we have any users and take the first one
    const users = data?.Body?.users || []
    console.log('[SYNC_GOOGLE] Found users:', users.length)
    
    if (users.length === 0) {
      return NextResponse.json({ error: 'No user found in directory' }, { status: 404 })
    }
    
    const user = users[0]
    console.log('[SYNC_GOOGLE] First user:', JSON.stringify(user, null, 2))
    
    // Handle department_id lookup if department exists in response
    let department_id = null
    if (user.department) {
      try {
        console.log('[SYNC_GOOGLE] Looking up department:', user.department)
        department_id = await findOrCreateDepartment(user.department, supabase)
        console.log('[SYNC_GOOGLE] Found/created department ID:', department_id)
      } catch (error) {
        console.error('Error handling department:', error)
        // Continue without department_id if there's an error
      }
    }

    // Build the response object with the actual fields from Make.com
    const responseObj = {
      email: user.email || null,
      phone: null, // Not returned from Make
      job_title: user.job_title || null,
      department_id,
      google_user_id: user.google_user_id || null,
      work_id: user.work_id || null,
      profile_image_url: user.profile_image_url || null,
      location: user.location || null,
      timezone: null, // Not available yet
    }
    
    console.log('[SYNC_GOOGLE] Final response object:', JSON.stringify(responseObj, null, 2))

    // Return clean response object with all required fields
    return NextResponse.json(responseObj)
  } catch (error) {
    console.error('[SYNC_GOOGLE_ERROR]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// Helper function to find or create a department
async function findOrCreateDepartment(departmentName: string, supabase: any) {
  if (!departmentName) return null
  
  try {
    // Normalize department name: trim whitespace and convert to lowercase
    const normalized = departmentName.trim()
    
    // Try to find the department by name (case insensitive)
    const { data: existingDepartment, error: searchError } = await supabase
      .from('departments')
      .select('id, name')
      .ilike('name', normalized)
      .maybeSingle()
    
    if (searchError) throw searchError
    
    // If department found, return its ID
    if (existingDepartment) {
      console.info(`Department matched: "${existingDepartment.name}" (ID: ${existingDepartment.id})`)
      return existingDepartment.id
    }
    
    // Otherwise create a new department
    const { data: newDepartment, error: insertError } = await supabase
      .from('departments')
      .insert({ name: normalized })  // Store the normalized name
      .select('id, name')
      .single()
    
    if (insertError) throw insertError
    
    console.info(`Department created: "${newDepartment.name}" (ID: ${newDepartment.id})`)
    return newDepartment.id
  } catch (error) {
    console.error('Error handling department:', error)
    throw error
  }
}
