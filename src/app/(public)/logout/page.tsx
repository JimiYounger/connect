'use client'

import { useEffect } from 'react'
import { authService } from '@/features/auth/utils/supabase-client'
import { useRouter } from 'next/navigation'

export default function LogoutPage() {
  const router = useRouter()

  useEffect(() => {
    const handleLogout = async () => {
      await authService.signOut()
      router.push('/')
    }
    handleLogout()
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground">Signing out...</p>
    </div>
  )
}
