// src/features/users/types.ts  

export interface UserProfile {
  id?: string
  airtable_record_id: string
  area: string | null
  created_at: string
  department: string | null
  email: string
  first_name: string
  google_user_id: string | null
  health_dashboard: string | null
  hire_date: string | null
  last_airtable_sync: string
  last_name: string
  phone: string | null
  profile_pic_url: string | null
  recruiting_record_id: string | null
  region: string | null
  role: string | null
  role_type: string | null
  salesforce_id: string | null
  shirt_size: string | null
  team: string | null
  updated_at: string
  user_id: string | null
  user_key: string | null
}
