// src/app/(public)/layout.tsx

import { AuthProvider } from "@/features/auth/context/auth-context";
import { createServerSupabase } from "@/features/auth/utils/supabase-server";
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabase()
  const { data: { session }, error } = await supabase.auth.getSession()
  const cookieStore = await cookies();

  // Don't redirect if there's an error or we're in the callback flow
  if (error) {
    console.error('Auth error:', error)
    return children
  }

  // Check for auth cookies
  const hasAuthCookies = 
    cookieStore.has('sb-access-token') || 
    cookieStore.has('sb-refresh-token') || 
    cookieStore.has('supabase-auth-token');

  // Only redirect if we have a confirmed session
  if (session?.user) {
    redirect('/home')
  }
  
  // If we have auth cookies but no session yet, don't redirect
  // This helps with the race condition during authentication
  if (hasAuthCookies && !session) {
    // Just render the children and let client-side handle it
    return (
      <AuthProvider 
        initialSession={null}
        initialLoading={{ session: true, profile: false, initializing: false }}
      >
        {children}
      </AuthProvider>
    );
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