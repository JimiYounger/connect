'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

export default function AuthProcessingPage() {
  const router = useRouter()
  const [message, setMessage] = useState('Processing your login...')
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    const maxAttempts = 3
    const checkInterval = 1000 // ms between checks
    let attempts = 0
    
    async function verifySession() {
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        
        // Use getUser instead of getSession for security
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError) throw userError
        
        if (user) {
          // Clear loading state and redirect
          localStorage.removeItem('auth_loading')
          document.body.classList.remove('loading')
          router.push('/home')
          return
        }
        
        attempts++
        if (attempts >= maxAttempts) {
          setError('Login verification timed out. Please try again.')
          localStorage.removeItem('auth_loading')
          document.body.classList.remove('loading')
          setTimeout(() => router.push('/'), 2000)
          return
        }
        
        setMessage(`Verifying login (attempt ${attempts}/${maxAttempts})...`)
        setTimeout(verifySession, checkInterval)
      } catch (error) {
        console.error('Auth verification error:', error)
        setError('Something went wrong. Please try logging in again.')
        localStorage.removeItem('auth_loading')
        document.body.classList.remove('loading')
        setTimeout(() => router.push('/'), 2000)
      }
    }
    
    // Mark as loading
    document.body.classList.add('loading')
    localStorage.setItem('auth_loading', 'true')
    
    // Initial delay before first check
    setTimeout(verifySession, 1000)
    
    // Cleanup on unmount
    return () => {
      localStorage.removeItem('auth_loading')
      document.body.classList.remove('loading')
    }
  }, [router])
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="text-center space-y-6 transition-opacity duration-200">
        <div className="auth-loading">
          {!error && <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>}
        </div>
        <div className="auth-content">
          <h1 className={`text-2xl font-bold ${error ? 'text-red-600' : 'text-gray-900'}`}>
            {error || message}
          </h1>
          {!error && (
            <p className="text-gray-600">Please wait while we complete your sign in...</p>
          )}
        </div>
      </div>
    </div>
  )
} 