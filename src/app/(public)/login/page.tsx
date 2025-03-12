'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/features/auth/context/auth-context'
import { LoginButton } from '@/features/auth/components/LoginButton'

export default function LoginPage() {
  const router = useRouter()
  const { isAuthenticated, loading } = useAuth()

  // Redirect if already logged in
  if (isAuthenticated) {
    router.push('/home')
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Use your PureLightPower Google account
          </p>
        </div>

        <div className="mt-8 flex justify-center">
          <LoginButton className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            Sign in with Google
          </LoginButton>
        </div>
      </div>
    </div>
  )
} 