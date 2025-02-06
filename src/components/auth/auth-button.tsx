'use client'

import { Button } from "@/components/ui/button"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export function AuthButton() {
  const handleSignIn = async () => {
    const supabase = createClientComponentClient()
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
            hd: 'purelightpower.com'
          },
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        console.error('Sign in error:', error)
      }
    } catch (error) {
      console.error('Sign in error:', error)
    }
  }

  return (
    <Button 
      onClick={handleSignIn} 
      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
    >
      Sign in with Google
    </Button>
  )
} 