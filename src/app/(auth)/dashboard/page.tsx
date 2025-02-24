// src/app/dashboard/page.tsx
import { createServerSupabase } from "@/features/auth/utils/supabase-server"
import { DashboardContent } from "./DashboardContent"
import type { UserProfile } from "@/features/users/types"

export default async function DashboardPage() {
  const supabase = await createServerSupabase()
  const { data: { session } } = await supabase.auth.getSession()

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', session!.user.id)
    .single()

  if (profileError || !profile) {
    throw new Error('Failed to load profile')
  }

  return <DashboardContent profile={profile as UserProfile} />
}
