// src/app/(public)/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LoginButtonWrapper } from '@/features/auth/components/LoginButtonWrapper'
import { createBrowserClient } from '@supabase/ssr'

export default function Home() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  
  // Check for session on the client side
  useEffect(() => {
    const checkSession = async () => {
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          // If we have a session, redirect to home
          router.replace('/home')
        } else {
          // No session, show the login button
          setIsLoading(false)
        }
      } catch (error) {
        console.error('Error checking session:', error)
        setIsLoading(false)
      }
    }
    
    checkSession()
  }, [router])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="text-center space-y-6 transition-opacity duration-200">
        {isLoading ? (
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
        ) : (
          <>
            <h1 className="text-4xl font-bold text-gray-900">Welcome to Connect</h1>
            <p className="text-gray-600">Please sign in to continue</p>
            <LoginButtonWrapper />
          </>
        )}
      </div>
    </div>
  );
}
