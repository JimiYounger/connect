// src/features/users/services/profile-service.ts

import { createServerSupabase } from '@/features/auth/utils/supabase-server'
import { getTeamMemberByEmail } from '@/lib/airtable'
import type { Database } from '@/types/supabase'

type UserProfileRow = Database['public']['Tables']['user_profiles']['Row']
type UserProfileInsert = Database['public']['Tables']['user_profiles']['Insert']

const formatDate = (date: string | Date | null | undefined): string | null => {
  if (!date) return null
  try {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toISOString().split('T')[0]
  } catch {
    return null
  }
}

export const profileService = {
  async getProfileByEmail(email: string): Promise<UserProfileRow | null> {
    const supabase = await createServerSupabase()
    
    // First try to get existing profile
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', email)
      .single()
      
    if (error) {
      console.error('Error fetching profile:', error)
      return null
    }
    
    // If profile exists and was updated recently, return it
    if (profile && profile.updated_at) {
      const lastUpdate = new Date(profile.updated_at)
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      
      if (lastUpdate > oneWeekAgo) {
        console.log('Using existing profile, last updated:', lastUpdate)
        return profile
      }
    }
    
    // If no profile or outdated, sync with Airtable
    console.log('Profile needs sync with Airtable')
    const teamMember = await getTeamMemberByEmail(email)
    
    if (!teamMember) {
      console.error('No team member found in Airtable')
      return profile // Return existing profile even if outdated
    }

    if (!teamMember.id) {
      console.error('Team member has no ID')
      return profile
    }

    const profileData: UserProfileInsert = {
      airtable_record_id: teamMember.id,
      email,
      first_name: teamMember.fields?.['First Name'] || '',
      last_name: teamMember.fields?.['Last Name'] || '',
      role: teamMember.fields?.Role || null,
      role_type: teamMember.fields?.['Role Type'] || 'Setter',
      team: teamMember.fields?.Team || null,
      area: teamMember.fields?.Area || null,
      region: teamMember.fields?.Region || null,
      phone: teamMember.fields?.Phone || null,
      profile_pic_url: teamMember.fields?.['Profile Pic URL'] || null,
      hire_date: formatDate(teamMember.fields?.['Hire Date']),
      user_key: teamMember.fields?.['User Key'] || null,
      recruiting_record_id: teamMember.fields?.['Recruiting ID'] || null,
      health_dashboard: teamMember.fields?.['Health Dashboard'] ? 'true' : 'false',
      salesforce_id: teamMember.fields?.['Salesforce ID'] || null,
      shirt_size: teamMember.fields?.['Shirt Size'] || null,
      department: teamMember.fields?.Department || null,
      updated_at: new Date().toISOString()
    }

    // Update profile with Airtable data
    const { data: updatedProfile, error: updateError } = await supabase
      .from('user_profiles')
      .upsert([profileData])
      .select()
      .single()

    if (updateError) {
      console.error('Error updating profile:', updateError)
      return profile // Return existing profile if update fails
    }

    return updatedProfile
  },

  async syncProfile(email: string, googleUserId: string) {
    const supabase = await createServerSupabase()
    
    try {
      const { error: syncError } = await supabase.rpc('sync_user_profile', {
        p_email: email,
        p_google_user_id: googleUserId,
        p_airtable_record_id: '',
        p_first_name: '',
        p_last_name: '',
        p_role: '',
        p_role_type: '',
        p_team: '',
        p_area: '',
        p_region: '',
        p_phone: '',
        p_profile_pic_url: '',
        p_hire_date: '',
        p_user_key: '',
        p_recruiting_record_id: '',
        p_health_dashboard: '',
        p_salesforce_id: ''
      })

      if (syncError) throw syncError
      
      // Fetch and return the updated profile
      return await this.getProfileByEmail(email)
    } catch (error) {
      console.error('Profile sync error:', error)
      throw error
    }
  }
} 