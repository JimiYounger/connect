"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { LoginButtonWrapper } from "@/features/auth/components/LoginButtonWrapper"
import { createBrowserClient } from "@supabase/ssr"
import { motion } from "framer-motion"
import { HomePage } from "@/features/homepage/components/HomePage"

export default function Home() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isLoaded, setIsLoaded] = useState(false)

  // Check for session on the client side
  useEffect(() => {
    const checkSession = async () => {
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        )

        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session) {
          // If we have a session, redirect to home
          router.replace("/home")
        } else {
          // No session, show the login button
          setIsLoading(false)
          // Trigger animations after loading is complete
          setTimeout(() => setIsLoaded(true), 100)
        }
      } catch (error) {
        console.error("Error checking session:", error)
        setIsLoading(false)
        setTimeout(() => setIsLoaded(true), 100)
      }
    }

    checkSession()
  }, [router])

  if (!isLoading && isLoaded) {
    // Using HomePage with light theme for the public landing page
    return (
      <div className="min-h-screen bg-white">
        <HomePage theme="light" />
        
        {/* Additional public page content */}
        <div className="container mx-auto px-4 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="mt-8"
          >
            <div className="flex justify-center">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="inline-block">
                <LoginButtonWrapper />
              </motion.div>
            </div>
          </motion.div>
          
          {/* Footer */}
          <motion.div
            className="mt-16 text-gray-500 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            transition={{ duration: 1 }}
          >
            © {new Date().getFullYear()} CONNECT X Younger Creatives
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex flex-col items-center justify-center w-full min-h-screen bg-black overflow-hidden">
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-black to-zinc-900" />

      {/* Animated lines - only show when not loading */}
      {!isLoading && (
        <div className="absolute inset-0 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-[1px] bg-zinc-800"
              style={{
                width: `${Math.random() * 30 + 20}%`,
                left: `${Math.random() * 70}%`,
                top: `${i * 20 + Math.random() * 10}%`,
              }}
              initial={{ x: -100, opacity: 0 }}
              animate={
                isLoaded
                  ? {
                      x: 100,
                      opacity: [0, 1, 1, 0],
                      transition: {
                        duration: 3 + i,
                        repeat: Number.POSITIVE_INFINITY,
                        repeatType: "loop",
                        ease: "easeInOut",
                        delay: i * 0.5,
                      },
                    }
                  : {}
              }
            />
          ))}
        </div>
      )}

      <div className="relative z-10 container mx-auto px-4 flex flex-col items-center">
        {/* Main content */}
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center">
            <motion.div
              className="h-16 w-16 rounded-full border-t-2 border-l-2 border-[#c4ff33]"
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

