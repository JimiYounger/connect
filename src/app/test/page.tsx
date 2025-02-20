'use client'

import { useAuth } from '@/features/auth/context/auth-context'
import { useProfile } from '@/features/users/hooks/useProfile'
import { LoginButton, LogoutButton } from '@/features/auth/components'

export default function TestPage() {
  const { session, isLoading: authLoading } = useAuth()
  const { profile, isLoading: profileLoading, error } = useProfile()

  if (authLoading || profileLoading) {
    return <div className="p-4">Loading...</div>
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Auth & Profile Test</h1>
      
      {/* Auth Status */}
      <div className="border p-4 rounded">
        <h2 className="font-semibold mb-2">Authentication Status:</h2>
        <pre className="bg-gray-100 p-2 rounded">
          {JSON.stringify({ isAuthenticated: !!session }, null, 2)}
        </pre>
        
        <div className="mt-4">
          {session ? (
            <LogoutButton className="bg-red-500 text-white px-4 py-2 rounded" />
          ) : (
            <LoginButton className="bg-blue-500 text-white px-4 py-2 rounded" />
          )}
        </div>
      </div>

      {/* User Profile */}
      {session && (
        <div className="border p-4 rounded">
          <h2 className="font-semibold mb-2">User Profile:</h2>
          {error ? (
            <div className="text-red-500">Error loading profile: {error.message}</div>
          ) : profile ? (
            <pre className="bg-gray-100 p-2 rounded">
              {JSON.stringify(profile, null, 2)}
            </pre>
          ) : (
            <div>No profile found</div>
          )}
        </div>
      )}

      {/* Session Details */}
      {session && (
        <div className="border p-4 rounded">
          <h2 className="font-semibold mb-2">Session Details:</h2>
          <pre className="bg-gray-100 p-2 rounded">
            {JSON.stringify({
              user: {
                id: session.user.id,
                email: session.user.email,
                role: session.user.role,
              }
            }, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
} 