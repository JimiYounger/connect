'use client'

import { useRouter } from 'next/navigation'
import { AuthButton } from '@/components/auth/auth-button'
import { useAuth } from '@/features/auth/context/auth-context'

export default function LoginPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  // Redirect if already logged in
  if (user) {
    router.push('/dashboard')
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
          <AuthButton />
        </div>
      </div>
    </div>
  )
} 