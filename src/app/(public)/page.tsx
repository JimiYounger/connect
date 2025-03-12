// src/app/(public)/page.tsx
import { createServerSupabase } from "@/features/auth/utils/supabase-server"
import { redirect } from 'next/navigation'
import { LoginButtonWrapper } from '@/features/auth/components/LoginButtonWrapper'

export default async function Home() {
  const supabase = await createServerSupabase()
  const { data: { session } } = await supabase.auth.getSession()

  if (session) {
    redirect('/home')
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="text-center space-y-6 transition-opacity duration-200">
        <div className="auth-loading">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
        </div>
        <div className="auth-content">
          <h1 className="text-4xl font-bold text-gray-900">Welcome to Connect</h1>
          <p className="text-gray-600">Please sign in to continue</p>
          <LoginButtonWrapper />
        </div>
      </div>
    </div>
  );
}
