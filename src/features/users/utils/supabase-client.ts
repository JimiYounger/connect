// src/features/users/utils/supabase-client.ts

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'

const supabase = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const userService = {
  async getProfile(email: string) {
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', email)
      .single()
      
    if (error) throw error
    return profile
  },

  async updateProfile(email: string, data: Partial<Database['public']['Tables']['user_profiles']['Row']>) {
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .update(data)
      .eq('email', email)
      .single()
      
    if (error) throw error
    return profile
  }
} 