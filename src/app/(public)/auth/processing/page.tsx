'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

export default function AuthProcessingPage() {
  const router = useRouter()
  const [_attempts, setAttempts] = useState(0)
  const [message, setMessage] = useState('Processing your login...')
  
  useEffect(() => {
    // Mark as loading for visual feedback
    document.body.classList.add('loading')
    localStorage.setItem('auth_loading', 'true')
    
    const maxAttempts = 5
    const checkInterval = 800 // ms between checks
    
    async function verifySession() {
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          // We have a valid session, redirect to dashboard
          localStorage.removeItem('auth_loading')
          router.push('/dashboard')
          return
        }
        
        // No session yet, increment attempts
        setAttempts(prev => {
          const newCount = prev + 1
          if (newCount >= maxAttempts) {
            // Too many attempts, redirect to home
            localStorage.removeItem('auth_loading')
            document.body.classList.remove('loading')
            setMessage('Login timed out. Please try again.')
            setTimeout(() => {
              router.push('/')
            }, 2000)
            return newCount
          }
          
          // Try again after delay
          setMessage(`Verifying login (attempt ${newCount}/${maxAttempts})...`)
          setTimeout(verifySession, checkInterval)
          return newCount
        })
      } catch (error) {
        console.error('Auth verification error:', error)
        localStorage.removeItem('auth_loading')
        document.body.classList.remove('loading')
        setMessage('Something went wrong. Redirecting to login...')
        setTimeout(() => {
          router.push('/')
        }, 2000)
      }
    }
    
    // Initial delay before first check
    setTimeout(verifySession, 1000)
  }, [router])
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="text-center space-y-6 transition-opacity duration-200">
        <div className="auth-loading">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
        </div>
        <div className="auth-content">
          <h1 className="text-2xl font-bold text-gray-900">{message}</h1>
          <p className="text-gray-600">Please wait while we complete your sign in...</p>
        </div>
      </div>
    </div>
  )
} 