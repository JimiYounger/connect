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

  // If we have auth cookies but no session, we're in a race condition
  // Show a consistent loading state while auth resolves client-side
  if (!session && hasAuthCookies) {
    console.log('Auth Layout - No session but has auth cookies, showing loading state');
    return (
      <AuthProvider 
        initialSession={null}
        initialLoading={{ session: true, profile: true, initializing: true }}
      >
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
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