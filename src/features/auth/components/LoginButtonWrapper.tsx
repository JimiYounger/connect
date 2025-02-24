// src/features/auth/components/LoginButtonWrapper.tsx

'use client'

import { LoginButton } from './LoginButton'

export function LoginButtonWrapper() {
  return (
    <LoginButton 
      className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white 
                 hover:from-purple-600 hover:to-indigo-600 px-6 py-3 rounded-lg 
                 font-medium shadow-lg hover:shadow-xl transition-all duration-200"
    />
  )
} 