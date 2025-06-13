"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "../context/auth-context"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface LoginButtonProps {
  className?: string
  children?: React.ReactNode
}

export function LoginButton({ className, children }: LoginButtonProps) {
  const { signIn } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const handleSignIn = async () => {
    try {
      setIsLoading(true)
      // Store a flag in sessionStorage to indicate we're in the auth flow
      // This can help with detecting auth flow state on page loads
      sessionStorage.setItem("auth_flow_started", Date.now().toString())
      await signIn()
    } catch (error) {
      console.error("Login error:", error)
      setIsLoading(false)
      // Clear the auth flow flag if there's an error
      sessionStorage.removeItem("auth_flow_started")
    }
  }

  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className="inline-block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Button
        onClick={handleSignIn}
        className={`relative overflow-hidden group ${className}`}
        disabled={isLoading}
      >
        {isLoading ? (
          <span className="flex items-center">
            <motion.svg
              className="h-5 w-5 mr-2"
              viewBox="0 0 24 24"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </motion.svg>
            Signing in...
          </span>
        ) : (
          <div className="relative flex items-center justify-center w-32 h-6 overflow-hidden">
            <AnimatePresence initial={false}>
              <motion.span
                key={isHovered ? "buckle" : "login"}
                className="absolute"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                {isHovered ? "BUCKLE UP" : children}
              </motion.span>
            </AnimatePresence>
          </div>
        )}
      </Button>
    </motion.div>
  )
}

