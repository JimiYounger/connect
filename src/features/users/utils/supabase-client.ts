// src/features/users/utils/supabase-client.ts

import { createClient } from '@/features/auth/utils/supabase-client'
import type { Database } from '@/types/supabase'

export const userService = {
  async getProfile(email: string) {
    const supabase = createClient()
    
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', email)
      .single()
      
    if (error) throw error
    return profile
  },

  async updateProfile(email: string, data: Partial<Database['public']['Tables']['user_profiles']['Row']>) {
    const supabase = createClient()
    
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .update(data)
      .eq('email', email)
      .single()
      
    if (error) throw error
    return profile
  }
} 