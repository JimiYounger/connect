// src/app/dashboard/page.tsx
import { createServerSupabase } from "@/features/auth/utils/supabase-server"
import { AuthProvider } from "@/features/auth/context/auth-context"
import { DashboardContent } from "./DashboardContent"
import { redirect } from "next/navigation"
import { ErrorLogger } from "@/lib/logging/error-logger"
import { ErrorSeverity, ErrorSource } from "@/lib/types/errors"

export default async function DashboardPage() {
  try {
    const supabase = await createServerSupabase()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      redirect('/')
    }

    // Fetch user profile
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .single()

    if (error || !profile) {
      await ErrorLogger.log(
        error || new Error('No profile found'),
        {
          severity: ErrorSeverity.HIGH,
          source: ErrorSource.SERVER,
          context: { 
            userId: session.user.id,
            email: session.user.email 
          }
        }
      )
      redirect('/auth/error')
    }

    return (
      <AuthProvider initialSession={session}>
        <DashboardContent profile={profile} />
      </AuthProvider>
    )
  } catch (error) {
    console.error('Error in DashboardPage:', error)
    redirect('/')
  }
}
