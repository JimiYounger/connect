// my-app/src/app/api/sync/profiles/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAllTeamMembers } from '@/lib/airtable'
import type { TeamMember } from '@/types/airtable'
import { formatPhoneE164 } from '@/lib/utils'

// Add allowed role types constant
const VALID_ROLE_TYPES = [
  'Setter',
  'Closer',
  'Manager',
  'Admin',
  'Executive'
] as const;

function mapAirtableToSupabase(member: TeamMember) {
  // Skip terminated employees
  if (member.fields?.Role === 'TERM') {
    throw new Error(`Skipping terminated member ${member.id}`)
  }

  // Validate required fields
  if (!member.id || 
      !member.fields?.Email || 
      !member.fields?.['First Name'] || 
      !member.fields?.['Last Name'] ||
      !member.fields?.Role ||
      !member.fields?.['Role Type'] ||
      !member.fields?.Team ||
      !member.fields?.Area ||
      !VALID_ROLE_TYPES.includes(member.fields['Role Type'] as any)
  ) {
    const missing = [
      !member.id && 'ID',
      !member.fields?.Email && 'Email',
      !member.fields?.['First Name'] && 'First Name',
      !member.fields?.['Last Name'] && 'Last Name',
      !member.fields?.Role && 'Role',
      !member.fields?.['Role Type'] && 'Role Type',
      !member.fields?.Team && 'Team',
      !member.fields?.Area && 'Area',
      !VALID_ROLE_TYPES.includes(member.fields?.['Role Type'] as any) && 
        `Role Type (${member.fields?.['Role Type']} not in ${VALID_ROLE_TYPES.join(', ')})`
    ].filter(Boolean).join(', ')
    
    throw new Error(`Member ${member.id} missing or invalid fields: ${missing}`)
  }

  return {
    airtable_record_id: member.id,
    email: member.fields.Email,
    first_name: member.fields['First Name'],
    last_name: member.fields['Last Name'],
    role: member.fields.Role,
    role_type: member.fields['Role Type'],
    team: member.fields.Team,
    area: member.fields.Area,
    // Format phone number to E.164
    phone: formatPhoneE164(member.fields.Phone),
    // Optional fields below
    region: member.fields.Region || null,
    profile_pic_url: member.fields['Profile Pic URL'] || null,
    hire_date: member.fields['Hire Date'] 
      ? new Date(member.fields['Hire Date']).toISOString() 
      : null,
    google_user_id: member.fields['Google User ID'] || null,
    health_dashboard: member.fields['Health Dashboard'] || null,
    recruiting_record_id: member.fields['Recruiting ID'] || null,
    salesforce_id: member.fields['Salesforce ID'] || null,
    shirt_size: member.fields['Shirt Size'] || null,
    department: member.fields.Department || null,
    user_key: member.fields['User Key'] || null,
    // Use Airtable's timestamps if available
    created_at: member.createdTime || new Date().toISOString(),
    updated_at: member.lastModifiedTime || new Date().toISOString(),
    last_airtable_sync: new Date().toISOString()
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify secret
    const secret = request.nextUrl.searchParams.get('secret')
    if (!process.env.SYNC_SECRET || secret !== process.env.SYNC_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create service role client for admin operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role key
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Fetch all team members from Airtable
    const teamMembers = await getAllTeamMembers()
    if (!teamMembers.length) {
      console.error('No team members found in Airtable')
      return NextResponse.json({ error: 'No team members found' }, { status: 500 })
    }

    // Map and filter out any invalid profiles
    const mappedProfiles = teamMembers
      .map(member => {
        try {
          return mapAirtableToSupabase(member)
        } catch (error) {
          console.error('Error mapping member:', error)
          return null
        }
      })
      .filter((profile): profile is NonNullable<typeof profile> => profile !== null)

    if (!mappedProfiles.length) {
      return NextResponse.json({ error: 'No valid profiles to sync' }, { status: 500 })
    }

    // Deduplicate profiles by email, keeping the most recent record
    const uniqueProfiles = Object.values(
      mappedProfiles.reduce((acc, profile) => {
        const existing = acc[profile.email]
        if (!existing || new Date(profile.updated_at) > new Date(existing.updated_at)) {
          acc[profile.email] = profile
          console.log(`Using record for ${profile.email} modified at ${profile.updated_at}`)
        } else {
          console.log(`Skipping older record for ${profile.email} modified at ${profile.updated_at}`)
        }
        return acc
      }, {} as Record<string, typeof mappedProfiles[0]>)
    )

    console.log(`Deduped from ${mappedProfiles.length} to ${uniqueProfiles.length} profiles`)

    // Upsert unique profiles
    const { error } = await supabase
      .from('user_profiles')
      .upsert(uniqueProfiles, {
        onConflict: 'email',
        ignoreDuplicates: false
      })

    if (error) {
      console.error('Error upserting profiles:', error)
      return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: `Synced ${uniqueProfiles.length} profiles`,
      duplicatesRemoved: mappedProfiles.length - uniqueProfiles.length
    })

  } catch (error) {
    console.error('Sync error:', error)
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret
    const secret = request.nextUrl.searchParams.get('secret')
    if (!process.env.SYNC_SECRET || secret !== process.env.SYNC_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse webhook payload
    const payload = await request.json()
    
    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Extract the member data from payload
    const member = payload.record
    
    // Handle TERM case - delete the user
    if (member?.fields?.Role === 'TERM') {
      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('airtable_record_id', member.id)
      
      if (error) {
        console.error('Error removing terminated user:', error)
        return NextResponse.json({ error: 'Failed to remove user' }, { status: 500 })
      }
      
      return NextResponse.json({ 
        success: true, 
        message: `User ${member.id} removed due to TERM status` 
      })
    }
    
    // Process the user update
    try {
      const mappedProfile = mapAirtableToSupabase(member)
      
      // Check if record exists
      const { data: existingRecord } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('airtable_record_id', member.id)
        .maybeSingle()
      
      // Update or insert based on existence
      const operation = existingRecord ? 'updated' : 'created'
      
      // Use upsert to handle both insert and update cases
      const { error } = await supabase
        .from('user_profiles')
        .upsert(mappedProfile, {
          onConflict: 'airtable_record_id',
          ignoreDuplicates: false
        })
        
      if (error) {
        console.error(`Error ${operation === 'updated' ? 'updating' : 'creating'} profile:`, error)
        return NextResponse.json({ error: `${operation === 'updated' ? 'Update' : 'Creation'} failed` }, { status: 500 })
      }
      
      return NextResponse.json({ 
        success: true, 
        message: `${operation === 'updated' ? 'Updated' : 'Created'} profile for ${mappedProfile.email}` 
      })
      
    } catch (error: any) {
      console.error('Error processing webhook data:', error)
      return NextResponse.json({ 
        error: error.message || 'Failed to process record' 
      }, { status: 400 })
    }
    
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 })
  }
}