// src/app/(public)/layout.tsx

import { AuthProvider } from "@/features/auth/context/auth-context";
import { createServerSupabase } from "@/features/auth/utils/supabase-server";
import { redirect } from 'next/navigation';

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabase()
  const { data: { session }, error } = await supabase.auth.getSession()

  // Don't redirect if there's an error or we're in the callback flow
  if (error) {
    console.error('Auth error:', error)
    return children
  }

  if (session?.user) {
    redirect('/home')
  }

  return (
    <AuthProvider 
      initialSession={session}
      initialLoading={{ session: false, profile: false, initializing: false }}
    >
      {children}
    </AuthProvider>
  );
} 