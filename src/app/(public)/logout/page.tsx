'use client'

import { useEffect } from 'react'
import { useAuth } from '@/features/auth/context/auth-context'
import { useRouter } from 'next/navigation'

export default function LogoutPage() {
  const { signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const handleLogout = async () => {
      await signOut()
      router.push('/')
    }
    handleLogout()
  }, [signOut, router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground">Signing out...</p>
    </div>
  )
}
