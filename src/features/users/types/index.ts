// src/features/users/types/index.ts

import type { Database } from '@/types/supabase'

export type UserProfile = Database['public']['Tables']['user_profiles']['Row']

export interface ProfileWithTeamMember {
  profile: UserProfile
  teamMember: TeamMember | null
}

export type SyncProfileParams = {
  email: string
  googleUserId: string
}

export interface TeamMember {
  id: string
  fields: {
    'Full Name': string
    'First Name': string
    'Last Name': string
    'Email': string
    'Role': string
    'Role Type': string
    'Phone': string
    'Area': string
    'Team': string
    'Region': string
    'Profile Pic URL': string
    'Google User ID': string
    'Hire Date': string
    'User Key': string
    'Recruiting ID': string
    'Health Dashboard': string
    'Salesforce ID': string
  }
}