import Airtable from 'airtable'
import type { TeamMember } from '@/types/airtable'

if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
  throw new Error('Missing Airtable environment variables')
}

const base = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY
}).base(process.env.AIRTABLE_BASE_ID!)

export const teamMembersTable = base('Team Members')

export async function getTeamMemberByEmail(email: string): Promise<TeamMember | null> {
  try {
    const records = await teamMembersTable
      .select({
        filterByFormula: `{Email} = '${email}'`,
        maxRecords: 1
      })
      .firstPage()

    if (!records || records.length === 0) return null

    return {
      id: records[0].id,
      fields: records[0].fields as TeamMember['fields']
    }
  } catch (error) {
    console.error('Error fetching team member:', error)
    return null
  }
}

export async function getTeamMemberByGoogleId(googleId: string): Promise<TeamMember | null> {
  try {
    const records = await teamMembersTable
      .select({
        filterByFormula: `{Google User ID} = '${googleId}'`,
        maxRecords: 1
      })
      .firstPage()

    if (!records || records.length === 0) return null

    return {
      id: records[0].id,
      fields: records[0].fields as TeamMember['fields']
    }
  } catch (error) {
    console.error('Error fetching team member:', error)
    return null
  }
}

export async function getAllTeamMembers(): Promise<TeamMember[]> {
  try {
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
    console.error('Error fetching team members:', error)
    return []
  }
}