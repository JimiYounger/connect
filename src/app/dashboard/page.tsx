// src/app/dashboard/page.tsx

"use client"

import { useEffect, useRef } from "react"
import { useAuth } from "@/features/auth/context/auth-context"
import { useProfile } from "@/features/users/hooks/useProfile"
import { LoadingState } from "@/components/loading-state"
import { usePermissions } from "@/features/permissions/hooks/usePermissions"
import type { UserProfile } from "@/features/users/types"
import {
  Target,
  Users,
  Building2,
  Crown,
  Shield,
  Award,
  LogOut,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { redirect } from "next/navigation"
import { useLoadingState } from "@/hooks/use-loading-state"
import { motion, useTransform, useViewportScroll } from "framer-motion"

interface StatCardData {
  icon: React.ReactNode
  title: string
  field: keyof Pick<
    UserProfile,
    "region" | "team" | "area" | "role" | "role_type" | "hire_date"
  >
  color: string
  getValue: (profile: UserProfile) => string
}

const STAT_CARDS: StatCardData[] = [
  {
    icon: <Target className="h-5 w-5" />,
    title: "Region",
    field: "region",
    color: "from-blue-500 to-blue-300",
    getValue: (profile) => profile.region || "N/A",
  },
  {
    icon: <Users className="h-5 w-5" />,
    title: "Team",
    field: "team",
    color: "from-purple-500 to-purple-300",
    getValue: (profile) => profile.team || "N/A",
  },
  {
    icon: <Building2 className="h-5 w-5" />,
    title: "Area",
    field: "area",
    color: "from-green-500 to-green-300",
    getValue: (profile) => profile.area || "N/A",
  },
  {
    icon: <Crown className="h-5 w-5" />,
    title: "Role",
    field: "role",
    color: "from-amber-500 to-amber-300",
    getValue: (profile) => profile.role || "N/A",
  },
  {
    icon: <Shield className="h-5 w-5" />,
    title: "Role Type",
    field: "role_type",
    color: "from-red-500 to-red-300",
    getValue: (profile) => profile.role_type || "N/A",
  },
  {
    icon: <Award className="h-5 w-5" />,
    title: "Hire Date",
    field: "hire_date",
    color: "from-teal-500 to-teal-300",
    getValue: (profile) => profile.hire_date || "N/A",
  },
]

export default function DashboardPage() {
  const { session, signOut, loading: authLoading } = useAuth()
  const { profile, isLoading: profileLoading } = useProfile(session)
  const { } = usePermissions(profile ?? null)

  const { isLoading, message } = useLoadingState(
    {
      auth: !session || authLoading.initializing,
      profile: profileLoading && !profile,
    },
    {
      auth: "Checking authentication...",
      profile: "Loading your profile...",
    }
  )

  // Parallax
  const { scrollY } = useViewportScroll()
  const shape1Y = useTransform(scrollY, [0, 500], [0, 100])
  const shape2Y = useTransform(scrollY, [0, 500], [0, -100])

  if (!session && !authLoading.initializing) {
    redirect("/")
    return null
  }

  if (isLoading) {
    return <LoadingState message={message || "Loading..."} />
  }

  if (!profile) return null

  return (
    <main className="relative flex flex-col min-h-screen w-full overflow-hidden">
      {/* Background & floating shapes */}
      <div className="absolute inset-0 -z-50 overflow-hidden bg-gradient-to-b from-black via-[#0f0f0f] to-[#151515]" />
      <motion.div
        style={{ y: shape1Y }}
        className="absolute top-[-10rem] left-[-10rem] w-[40rem] h-[40rem]
                   bg-gradient-to-r from-pink-500 to-purple-600
                   rounded-full opacity-30 blur-3xl"
      />
      <motion.div
        style={{ y: shape2Y }}
        className="absolute bottom-[-10rem] right-[-10rem] w-[40rem] h-[40rem]
                   bg-gradient-to-r from-blue-500 to-green-500
                   rounded-full opacity-30 blur-3xl"
      />

      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center min-h-[60vh] px-4 text-center text-white">
        <motion.h1
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1 }}
          className="mt-12 text-5xl md:text-7xl font-extrabold tracking-tight"
        >
          Welcome to{" "}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-pink-400 to-orange-400">
            Connect<sup>®</sup>
          </span>
        </motion.h1>
        <motion.p
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1.2 }}
          className="mt-4 text-lg md:text-xl text-gray-300 max-w-xl"
        >
          Where <span className="font-bold text-white">innovation</span> meets{" "}
          <span className="font-bold text-white">possibility</span>.
        </motion.p>
      </section>

      {/* Content wrapper */}
      <div className="-mt-10 pb-16 px-4 sm:px-6 lg:px-8">
        {/* Profile card */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          whileHover={{ rotateX: 2, rotateY: -2 }}
          className="mx-auto max-w-4xl bg-white/10 backdrop-blur-lg rounded-xl p-6 sm:p-8 shadow-2xl
                     hover:shadow-[0_0_40px_rgba(255,255,255,0.15)] transition-shadow"
        >
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <Avatar className="h-24 w-24 md:h-32 md:w-32 ring-2 ring-offset-2 ring-offset-black ring-purple-500">
              {profile.profile_pic_url && (
                <AvatarImage
                  src={profile.profile_pic_url}
                  alt={`${profile.first_name} ${profile.last_name}`}
                />
              )}
              <AvatarFallback className="bg-purple-500 text-white text-2xl">
                {profile.first_name?.[0]}
                {profile.last_name?.[0]}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <h2 className="text-2xl md:text-3xl font-bold text-white">
                {profile.first_name} {profile.last_name}
              </h2>
              <p className="text-gray-300 mt-1">
                {profile.role}
                <span className="mx-2 text-purple-300">•</span>
                {profile.team}
              </p>
            </div>

            {/* Sign Out Button */}
            <Button
              onClick={() => signOut()}
              className="gap-2 bg-transparent border border-purple-500 text-white
                         hover:bg-purple-500 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </motion.div>

        {/* Stats grid */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
          className="mx-auto max-w-4xl mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {STAT_CARDS.map((card) => (
            <motion.div
              key={card.field}
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <Card className="bg-white/10 backdrop-blur-md shadow-xl hover:shadow-2xl
                               transition-shadow duration-300 rounded-xl"
              >
                <CardContent className="flex items-center gap-4 p-5">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${card.color} text-white shadow-md`}
                  >
                    {card.icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-400">
                      {card.title}
                    </p>
                    <p className="text-lg font-semibold mt-0.5 text-white">
                      {card.getValue(profile)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </main>
  )
}
