// my-app/src/app/api/contacts/sync-google/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
const { v4: uuidv4 } = require('uuid')

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

    // Handle profile image if it's from Google
    let profile_image_url = user.profile_image_url || null
    if (profile_image_url && isGoogleImageUrl(profile_image_url)) {
      try {
        console.log('[SYNC_GOOGLE] Detected Google profile image:', profile_image_url)
        const storedImageUrl = await fetchAndStoreProfileImage(profile_image_url, user.google_user_id, supabase)
        if (storedImageUrl) {
          console.log('[SYNC_GOOGLE] Successfully stored profile image at:', storedImageUrl)
          profile_image_url = storedImageUrl
        } else {
          console.log('[SYNC_GOOGLE] Failed to store image, keeping original URL:', profile_image_url)
        }
      } catch (error) {
        console.error('[SYNC_GOOGLE] Error storing profile image:', error)
        // Continue with original URL if upload fails
      }
    } else {
      console.log('[SYNC_GOOGLE] No Google profile image to process:', profile_image_url)
    }

    // Build the response object with the actual fields from Make.com
    const responseObj = {
      email: user.email || null,
      phone: null, // Not returned from Make
      job_title: user.job_title || null,
      department_id,
      google_user_id: user.google_user_id || null,
      company_id: user.work_id || null, // Using work_id from Make for our company_id
      profile_image_url, // Updated URL after storage if successful
      location: user.location || null,
      timezone: null, // Will be set from location if possible
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
  if (!departmentName || departmentName.trim() === '') return null
  
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
    return null // Return null instead of throwing to prevent UUID errors
  }
}

// Check if a URL is from Google's image hosting
function isGoogleImageUrl(url: string): boolean {
  if (!url) return false
  return url.includes('lh3.google.com') || url.includes('googleusercontent.com')
}

// Fetch and store profile image in Supabase Storage
async function fetchAndStoreProfileImage(imageUrl: string, googleUserId: string | null, supabase: any): Promise<string | null> {
  try {
    if (!imageUrl) {
      console.log('[SYNC_GOOGLE] No image URL provided')
      return null
    }

    // Fetch the image from Google with no-cors to avoid CORS issues
    console.log('[SYNC_GOOGLE] Fetching image from:', imageUrl)
    const imageResponse = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })
    
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status} ${imageResponse.statusText}`)
    }
    
    // Get content type from response headers or default to jpeg
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg'
    const fileExtension = contentType.includes('png') ? 'png' : 'jpg'
    
    // Generate a filename using google_user_id or UUID
    let filename
    if (googleUserId) {
      filename = `${googleUserId}.${fileExtension}`
    } else {
      filename = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExtension}`
    }
    
    const storagePath = `avatars/${filename}`
    
    // Convert the image to ArrayBuffer
    const imageBuffer = await imageResponse.arrayBuffer()
    if (!imageBuffer || imageBuffer.byteLength === 0) {
      throw new Error('Received empty image data')
    }
    
    console.log('[SYNC_GOOGLE] Got image buffer with size:', imageBuffer.byteLength)
    
    // Upload to Supabase Storage
    console.log('[SYNC_GOOGLE] Uploading image to Supabase path:', storagePath)
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('avatars')
      .upload(storagePath, imageBuffer, {
        contentType,
        upsert: true // Overwrite if file exists
      })
    
    if (uploadError) {
      console.error('[SYNC_GOOGLE] Upload error:', uploadError)
      throw uploadError
    }
    
    console.log('[SYNC_GOOGLE] Upload successful:', uploadData)
    
    // Get the public URL
    const { data: urlData } = supabase
      .storage
      .from('avatars')
      .getPublicUrl(storagePath)
    
    console.log('[SYNC_GOOGLE] Generated public URL:', urlData.publicUrl)
    return urlData.publicUrl
  } catch (error) {
    console.error('[SYNC_GOOGLE] Error in fetchAndStoreProfileImage:', error)
    return null
  }
}
