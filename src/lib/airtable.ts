// src/lib/airtable.ts
import Airtable from 'airtable'
import type { TeamMember } from '@/types/airtable'

function getAirtableBase() {
  if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
    console.error('Missing required environment variables:')
    console.error('AIRTABLE_API_KEY exists:', !!process.env.AIRTABLE_API_KEY)
    console.error('AIRTABLE_BASE_ID exists:', !!process.env.AIRTABLE_BASE_ID)
    throw new Error('Missing Airtable environment variables')
  }

  return new Airtable({
    apiKey: process.env.AIRTABLE_API_KEY
  }).base(process.env.AIRTABLE_BASE_ID)
}

// Don't initialize at module level, do it in each function
export async function getTeamMemberByEmail(email: string): Promise<TeamMember | null> {
  try {
    console.log('Fetching team member for email:', email)
    
    const base = getAirtableBase()
    const teamMembersTable = base('Team Members')
    const escapedEmail = email.replace(/"/g, '\\"')
    
    const records = await teamMembersTable
      .select({
        filterByFormula: `{Email} = "${escapedEmail}"`,
        maxRecords: 1
      })
      .firstPage()

    if (!records || records.length === 0) {
      console.log('No team member found for email:', email)
      return null
    }

    const record = records[0]
    
    // Validate required fields
    if (!record.id) {
      console.error('Missing record ID for team member:', email)
      return null
    }

    if (!record.fields['First Name'] || !record.fields['Last Name']) {
      console.error('Missing required name fields for team member:', email)
      return null
    }

    // Log the complete record for debugging
    console.log('Found Airtable record:', {
      id: record.id,
      fields: {
        email: record.fields['Email'],
        firstName: record.fields['First Name'],
        lastName: record.fields['Last Name'],
        role: record.fields['Role'],
        roleType: record.fields['Role Type'],
        team: record.fields['Team'],
        area: record.fields['Area'],
        region: record.fields['Region'],
        hireDate: record.fields['Hire Date'],
      }
    })

    return {
      id: record.id,
      fields: record.fields as TeamMember['fields']
    }
  } catch (error) {
    console.error('Error fetching team member:', error)
    throw error
  }
}

export async function getTeamMemberByGoogleId(googleId: string): Promise<TeamMember | null> {
  try {
    const base = getAirtableBase()
    const teamMembersTable = base('Team Members')
    
    const records = await teamMembersTable
      .select({
        filterByFormula: `{Google User ID} = "${googleId}"`,
        maxRecords: 1
      })
      .firstPage()

    if (!records || records.length === 0) {
      return null
    }

    return {
      id: records[0].id,
      fields: records[0].fields as TeamMember['fields']
    }
  } catch (error) {
    console.error('Error fetching team member by Google ID:', error)
    return null
  }
}

export async function getAllTeamMembers(): Promise<TeamMember[]> {
  try {
    const base = getAirtableBase()
    const teamMembersTable = base('Team Members')
    
    const records = await teamMembersTable
      .select({
        sort: [{ field: 'Full Name', direction: 'asc' }]
      })
      .all()

    return records.map(record => ({
      id: record.id,
      fields: record.fields as TeamMember['fields']
    }))
  } catch (error) {
    console.error('Error fetching all team members:', error)
    return []
  }
}

export async function testAirtableConnection(): Promise<boolean> {
  try {
    const base = getAirtableBase()
    const teamMembersTable = base('Team Members')
    
    const testRecord = await teamMembersTable
      .select({ maxRecords: 1 })
      .firstPage()
    
    console.log('Airtable connection test:', testRecord ? 'Success' : 'No records found')
    return true
  } catch (error) {
    console.error('Airtable connection test failed:', error)
    return false
  }
}