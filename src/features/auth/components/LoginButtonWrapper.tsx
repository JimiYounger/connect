"use client"

import { LoginButton } from "./LoginButton"

export function LoginButtonWrapper() {
  return (
    <LoginButton
      className="bg-gradient-to-r from-[#c4ff33] to-[#a8e024] 
                 text-black font-bold rounded-full 
                 px-10 py-5 text-lg shadow-lg
                 transition-all duration-300 ease-in-out
                 border-2 border-transparent
                 hover:bg-black hover:from-black hover:to-black
                 hover:text-[#c4ff33] hover:border-[#c4ff33]"
    >
      LOG IN ›
    </LoginButton>
  )
}

