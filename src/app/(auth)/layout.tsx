// my-app/src/app/(auth)/layout.tsx

import { AuthProvider } from "@/features/auth/context/auth-context";
import { createServerSupabase } from "@/features/auth/utils/supabase-server";
import { redirect } from "next/navigation";
import { cookies } from 'next/headers';

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabase()
  const { data: { session }, } = await supabase.auth.getSession()
  const cookieStore = await cookies();
  
  // Check for auth cookies
  const hasAuthCookies = 
    cookieStore.has('sb-access-token') || 
    cookieStore.has('sb-refresh-token') || 
    cookieStore.has('supabase-auth-token');
  
  console.log('Auth Layout - Session check:', !!session, 'Has auth cookies:', hasAuthCookies);
  
  if (!session && !hasAuthCookies) {
    console.log('Auth Layout - No session or auth cookies, redirecting to root');
    redirect('/');
  }

  // If we have auth cookies but no session, we might be in a race condition
  // Let's render the children anyway and let client-side handle it
  if (!session && hasAuthCookies) {
    console.log('Auth Layout - No session but has auth cookies, rendering with null session');
    return (
      <AuthProvider 
        initialSession={null}
        initialLoading={{ session: true, profile: false, initializing: false }}
      >
        {children}
      </AuthProvider>
    );
  }

  console.log('Auth Layout - Session found, rendering with session');
  
  return (
    <AuthProvider 
      initialSession={session}
      initialLoading={{ session: false, profile: false, initializing: false }}
    >
      {children}
    </AuthProvider>
  );
} 