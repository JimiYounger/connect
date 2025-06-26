// src/features/users/services/sync-service.ts

import { getTeamMemberByEmail } from '@/lib/airtable'
import { createServerSupabase } from '@/features/auth/utils/supabase-server'
import type { TeamMember } from '@/types/airtable'

const VALID_ROLE_TYPES = ['Setter', 'Closer', 'Manager', 'Admin', 'Executive'] as const
type RoleType = typeof VALID_ROLE_TYPES[number]

const formatDate = (dateString: string | Date | undefined | null): string => {
  if (!dateString) return ''
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString
    if (isNaN(date.getTime())) return ''
    return date.toISOString().split('T')[0]
  } catch {
    return ''
  }
}

export const syncService = {
  async syncUserProfile(email: string, googleUserId: string) {
    console.log('Starting profile sync for:', email)
    
    try {
      const teamMember: TeamMember | null = await getTeamMemberByEmail(email)
      console.log('Team member from Airtable:', {
        found: !!teamMember,
        id: teamMember?.id,
        fields: teamMember?.fields,
        email
      })
      
      if (!teamMember) {
        console.error('No team member found in Airtable for:', email)
        throw new Error('User not found in Airtable')
      }

      // Validate and normalize role type
      let roleType = teamMember.fields?.['Role Type'] || 'Setter'
      if (!VALID_ROLE_TYPES.includes(roleType as RoleType)) {
        console.warn(`Invalid role type from Airtable: ${roleType}, defaulting to Setter`)
        roleType = 'Setter'
      }

      const syncData = {
        p_email: email,
        p_airtable_record_id: teamMember.id || '',
        p_first_name: teamMember.fields?.['First Name'] || '',
        p_last_name: teamMember.fields?.['Last Name'] || '',
        p_role: teamMember.fields?.Role || '',
        p_role_type: roleType,
        p_team: teamMember.fields?.Team || '',
        p_area: teamMember.fields?.Area || '',
        p_region: teamMember.fields?.Region || '',
        p_phone: teamMember.fields?.Phone || '',
        p_profile_pic_url: teamMember.fields?.['Profile Pic URL'] || '',
        p_google_user_id: googleUserId || '',
        p_hire_date: formatDate(teamMember.fields?.['Hire Date']),
        p_user_key: teamMember.fields?.['User Key'] || '',
        p_recruiting_record_id: teamMember.fields?.['Recruiting ID'] || '',
        p_health_dashboard: teamMember.fields?.['Health Dashboard'] ? 'true' : 'false',
        p_salesforce_id: teamMember.fields?.['Salesforce ID'] || '',
        p_shirt_size: teamMember.fields?.['Shirt Size'] || '',
        p_department: teamMember.fields?.Department || ''
      }

      console.log('Sync data:', JSON.stringify(syncData, null, 2))

      const supabase = await createServerSupabase()
      const { error: syncError } = await supabase.rpc('sync_user_profile', syncData)

      if (syncError) {
        console.error('Sync procedure error:', syncError)
        console.error('Error details:', {
          message: syncError.message,
          hint: syncError.hint,
          details: syncError.details,
          code: syncError.code
        })
        throw syncError
      }

      const { data: profile, error: fetchError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('email', email)
        .single()

      if (fetchError) {
        console.error('Error fetching synced profile:', fetchError)
        throw fetchError
      }

      return profile
    } catch (error) {
      console.error('Profile sync failed:', error)
      throw error
    }
  }
} 