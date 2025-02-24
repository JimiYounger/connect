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
  const { data: { session } } = await supabase.auth.getSession()

  if (session) {
    redirect('/dashboard')
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