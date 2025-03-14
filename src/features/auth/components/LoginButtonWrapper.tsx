"use client"

import { LoginButton } from "./LoginButton"

export function LoginButtonWrapper() {
  return (
    <LoginButton
      className="bg-[#c4ff33] hover:bg-[#d5ff5c] text-black 
                 font-medium rounded-full px-8 py-6 text-lg
                 shadow-lg transition-all duration-200"
    >
      LOG IN
    </LoginButton>
  )
}

