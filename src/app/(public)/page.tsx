"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { LoginButtonWrapper } from "@/features/auth/components/LoginButtonWrapper"
import { createBrowserClient } from "@supabase/ssr"
import { motion } from "framer-motion"

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
          {isLoading ? (
            <div className="flex items-center justify-center">
              <motion.div
                className="h-16 w-16 rounded-full border-t-2 border-l-2 border-[#c4ff33]"
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              />
            </div>
          ) : (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isLoaded ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <h2 className="text-zinc-400 text-xl md:text-2xl font-light mb-2">Welcome to</h2>
                <h1 className="text-white text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
                  CONNECT<span className="text-[#c4ff33]">®</span>
                </h1>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={isLoaded ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.5 }}
              >
                <h2 className="text-white text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-2">
                  Explore and navigate your tools
                </h2>
                <h2 className="text-white text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-16">
                  <span className="text-[#c4ff33]">easier</span> than ever.
                </h2>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={isLoaded ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.5, delay: 1 }}
                className="mt-8"
              >
                <div className="flex justify-center">
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="inline-block">
                    <LoginButtonWrapper />
                  </motion.div>
                </div>
              </motion.div>
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      {!isLoading && (
        <motion.div
          className="absolute bottom-8 left-0 right-0 text-center text-zinc-500 text-sm"
          initial={{ opacity: 0 }}
          animate={isLoaded ? { opacity: 0.7 } : {}}
          transition={{ duration: 1, delay: 1.5 }}
        >
          © {new Date().getFullYear()} CONNECT. All rights reserved.
        </motion.div>
      )}
    </div>
  )
}

