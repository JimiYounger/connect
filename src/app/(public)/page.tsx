"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { LoginButtonWrapper } from "@/features/auth/components/LoginButtonWrapper"
import { createBrowserClient } from "@supabase/ssr"
import { motion } from "framer-motion"

// Animation variants for the title
const sentence = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      delay: 0.5,
      staggerChildren: 0.04,
    },
  },
}

const letter = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
  },
}

export default function Home() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isLoaded, setIsLoaded] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setMousePosition({ x: event.clientX, y: event.clientY })
    }
    window.addEventListener("mousemove", handleMouseMove)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
    }
  }, [])

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
          // No session, show the landing page
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

  if (isLoading) {
    return (
      <div className="relative flex flex-col items-center justify-center w-full min-h-screen bg-black overflow-hidden">
        {/* Background gradient effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-black to-zinc-900" />

        <div className="relative z-10 container mx-auto px-4 flex flex-col items-center">
          {/* Loading spinner */}
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

  return (
    <div className="relative flex flex-col items-center justify-center w-full min-h-screen bg-black overflow-hidden">
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-black to-zinc-900" />

      {/* Interactive Mouse Spotlight */}
      <motion.div
        className="pointer-events-none absolute inset-0 z-20"
        style={{
          background: `radial-gradient(600px at ${mousePosition.x}px ${mousePosition.y}px, rgba(196, 255, 51, 0.1), transparent 80%)`,
        }}
      />

      {/* New High-End Background Animations */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Dynamic Grid */}
        {Array.from({ length: 30 }).map((_, i) => (
          <motion.div
            key={`grid-line-h-${i}`}
            className="absolute h-[1px] w-full bg-white/5"
            style={{ top: `${i * (100 / 30)}%` }}
            initial={{ opacity: 0 }}
            animate={
              isLoaded
                ? {
                    opacity: 0.1,
                    transition: {
                      duration: 1,
                      delay: 0.5 + i * 0.02,
                    },
                  }
                : {}
            }
          />
        ))}
        {Array.from({ length: 40 }).map((_, i) => (
          <motion.div
            key={`grid-line-v-${i}`}
            className="absolute w-[1px] h-full bg-white/5"
            style={{ left: `${i * (100 / 40)}%` }}
            initial={{ opacity: 0 }}
            animate={
              isLoaded
                ? {
                    opacity: 0.1,
                    transition: {
                      duration: 1,
                      delay: 0.5 + i * 0.02,
                    },
                  }
                : {}
            }
          />
        ))}

        {/* Sweeping Light Streaks */}
        {Array.from({ length: 3 }).map((_, i) => (
          <motion.div
            key={`streak-${i}`}
            className="absolute h-full w-[200px] bg-gradient-to-r from-transparent via-[#c4ff33]/10 to-transparent"
            style={{
              top: 0,
              left: `${-20 + i * 30}%`,
              skewX: -25,
            }}
            initial={{ x: '-50vw' }}
            animate={
              isLoaded
                ? {
                    x: '150vw',
                    transition: {
                      duration: 6 + i * 2,
                      repeat: Infinity,
                      ease: 'linear',
                      delay: 2 + i * 1.5,
                    },
                  }
                : {}
            }
          />
        ))}

        {/* Floating Dust Motes */}
        {Array.from({ length: 15 }).map((_, i) => (
          <motion.div
            key={`mote-${i}`}
            className="absolute rounded-full bg-white/10"
            style={{
              width: `${Math.random() * 3 + 1}px`,
              height: `${Math.random() * 3 + 1}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={
              isLoaded
                ? {
                    y: [0, (Math.random() - 0.5) * 80],
                    x: [0, (Math.random() - 0.5) * 80],
                    opacity: [0, 0.8, 0],
                    transition: {
                      duration: 10 + Math.random() * 10,
                      repeat: Infinity,
                      ease: 'linear',
                      delay: Math.random() * 5,
                    },
                  }
                : {}
            }
          />
        ))}
      </div>

      <div className="relative z-10 container mx-auto px-4 flex flex-col items-center text-center">
        {/* Main content */}
        <div className="max-w-4xl mx-auto">
          <motion.div
            variants={sentence}
            initial="hidden"
            animate={isLoaded ? "visible" : "hidden"}
            className="mb-8"
          >
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight [text-shadow:0_0_15px_rgba(196,255,51,0.3)]">
              {"Welcome to ".split("").map((char, index) => (
                <motion.span key={char + "-" + index} variants={letter}>
                  {char}
                </motion.span>
              ))}
              <motion.span
                className="text-transparent bg-clip-text bg-gradient-to-r from-[#c4ff33] to-[#a8e024]"
                initial={{ opacity: 0 }}
                animate={isLoaded ? { opacity: 1 } : {}}
                transition={{ duration: 0.8, delay: 1.2 }}
              >
                CONNECT
              </motion.span>
            </h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={isLoaded ? { opacity: 1 } : {}}
              transition={{ duration: 0.8, delay: 1.6 }}
              className="text-xl md:text-2xl text-zinc-300 mb-12 max-w-2xl mx-auto leading-relaxed [text-shadow:0_0_10px_rgba(196,255,51,0.2)]"
            >
              Everything you need in one place
            </motion.p>
          </motion.div>

          {/* Login Button */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isLoaded ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5, delay: 1.8 }}
            className="mb-16"
          >
            <div className="group relative">
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="relative z-10 inline-block"
              >
                <LoginButtonWrapper />
              </motion.div>

              {/* Horizontal Glow */}
              <div className="absolute inset-x-0 z-0 top-1/2 h-20 w-full -translate-y-1/2 bg-gradient-to-r from-[#c4ff33]/10 via-[#c4ff33]/30 to-[#c4ff33]/10 opacity-40 blur-xl transition-all duration-500 group-hover:opacity-60 group-hover:scale-x-125" />
            </div>
          </motion.div>

          {/* Footer */}
          <motion.div
            className="text-zinc-500 text-sm"
            initial={{ opacity: 0 }}
            animate={isLoaded ? { opacity: 0.7 } : {}}
            transition={{ duration: 1, delay: 2.0 }}
          >
            © {new Date().getFullYear()} CONNECT X Younger Creatives
          </motion.div>
        </div>
      </div>

      {/* TV Static Overlay */}
      <div className="absolute inset-0 z-50 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-repeat"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
          }}
          animate={{ opacity: [0.03, 0.05, 0.03, 0.06, 0.04] }}
          transition={{ duration: 0.2, repeat: Infinity }}
        />
      </div>

      {/* Enhanced ambient glow effect */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#c4ff33]/8 rounded-full blur-3xl" />
      <div className="absolute top-1/3 left-1/3 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#a8e024]/5 rounded-full blur-2xl" />
    </div>
  )
}

