'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

export default function AuthProcessingPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Completing your sign in...')
  
  useEffect(() => {
    let mounted = true
    let redirectTimeout: NodeJS.Timeout
    let retryTimeout: NodeJS.Timeout
    
    async function verifySession(attempt = 1) {
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        
        // Check for session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) throw sessionError
        
        // If we have a session, we can proceed
        if (session) {
          if (mounted) {
            setStatus('success')
            setMessage('Sign in successful! Redirecting...')
            
            // Clear any existing timeouts
            clearTimeout(redirectTimeout)
            clearTimeout(retryTimeout)
            
            // Add a small delay to ensure cookies are properly set
            redirectTimeout = setTimeout(() => {
              if (mounted) {
                // Use replace instead of push to avoid navigation stack issues
                router.replace('/home')
              }
            }, 500)
          }
          return
        }
        
        // If we don't have a session yet but still have attempts left
        if (attempt < 5 && mounted) {
          setMessage(`Verifying your login (${attempt}/5)...`)
          retryTimeout = setTimeout(() => verifySession(attempt + 1), 800)
        } else if (mounted) {
          setStatus('error')
          setMessage('Login verification timed out. Please try again.')
          redirectTimeout = setTimeout(() => router.replace('/'), 2000)
        }
      } catch (error) {
        console.error('Auth verification error:', error)
        if (mounted) {
          setStatus('error')
          setMessage('Something went wrong. Please try logging in again.')
          redirectTimeout = setTimeout(() => router.replace('/'), 2000)
        }
      }
    }
    
    // Initial delay before first check to allow cookies to be set
    const initialTimeout = setTimeout(() => verifySession(), 800)
    
    // Fallback redirect after a maximum wait time
    const fallbackTimeout = setTimeout(() => {
      if (mounted) {
        // If we've waited too long, just try to go to home anyway
        router.replace('/home')
      }
    }, 8000)
    
    return () => {
      mounted = false
      clearTimeout(initialTimeout)
      clearTimeout(redirectTimeout)
      clearTimeout(retryTimeout)
      clearTimeout(fallbackTimeout)
    }
  }, [router])
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="text-center space-y-6 transition-opacity duration-200">
        {status === 'loading' && (
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900 mb-4"></div>
        )}
        <h1 className={`text-2xl font-bold ${status === 'error' ? 'text-red-600' : 'text-gray-900'}`}>
          {message}
        </h1>
        {status === 'loading' && (
          <p className="text-gray-600">Please wait while we complete your sign in...</p>
        )}
      </div>
    </div>
  )
} 