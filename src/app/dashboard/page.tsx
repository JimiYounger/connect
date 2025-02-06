'use client'

import { useAuth } from '@/context/auth-context'
import { Button } from '@/components/ui/button'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { motion } from 'framer-motion'

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 }
}

const MotionCard = motion(Card)

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-4xl mx-auto p-8">
        <Card className="mb-8">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <Skeleton className="h-8 w-[100px]" />
            <Skeleton className="h-10 w-[100px]" />
          </CardHeader>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex flex-col items-center space-y-4">
                <Skeleton className="h-32 w-32 rounded-full" />
                <div className="text-center space-y-2">
                  <Skeleton className="h-8 w-[200px]" />
                  <Skeleton className="h-4 w-[150px]" />
                </div>
              </div>

              <Separator orientation="vertical" className="hidden md:block" />
              <Separator orientation="horizontal" className="md:hidden" />

              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-[100px]" />
                    <Skeleton className="h-6 w-[150px]" />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { user, teamMember, loading } = useAuth()
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return <LoadingSkeleton />
  }

  if (!user || !teamMember) {
    return <div className="flex min-h-screen items-center justify-center">Not authenticated</div>
  }

  // Get initials for avatar fallback
  const initials = teamMember.fields?.["Full Name"]
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase() || 'U'

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-4xl mx-auto p-8 space-y-8">
        <MotionCard
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <motion.h1 
              className="text-2xl font-bold"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Dashboard
            </motion.h1>
            <Button 
              onClick={handleSignOut} 
              variant="outline"
              className="transition-all hover:scale-105"
            >
              Sign Out
            </Button>
          </CardHeader>
        </MotionCard>

        <MotionCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              <motion.div 
                className="flex flex-col items-center space-y-4"
                {...fadeIn}
                transition={{ delay: 0.4 }}
              >
                <Avatar className="h-32 w-32 transition-all hover:scale-105">
                  <AvatarImage 
                    src={teamMember.fields?.["Profile Pic URL"] || user.user_metadata.avatar_url} 
                    alt={teamMember.fields?.["Full Name"] || "Profile"} 
                  />
                  <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <h2 className="text-2xl font-bold">{teamMember.fields?.["Full Name"]}</h2>
                  <p className="text-sm text-muted-foreground">{teamMember.fields?.Email}</p>
                </div>
              </motion.div>

              <Separator orientation="vertical" className="hidden md:block" />
              <Separator orientation="horizontal" className="md:hidden" />

              <motion.div 
                className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <div className="space-y-4">
                  <div className="transition-all hover:translate-x-1">
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{teamMember.fields?.Phone || "Not provided"}</p>
                  </div>

                  <div className="transition-all hover:translate-x-1">
                    <p className="text-sm text-muted-foreground">Role</p>
                    <p className="font-medium">{teamMember.fields?.Role}</p>
                  </div>

                  <div className="transition-all hover:translate-x-1">
                    <p className="text-sm text-muted-foreground">Role Type</p>
                    <p className="font-medium">{teamMember.fields?.["Role Type"]}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="transition-all hover:translate-x-1">
                    <p className="text-sm text-muted-foreground">Team</p>
                    <p className="font-medium">{teamMember.fields?.Team}</p>
                  </div>

                  <div className="transition-all hover:translate-x-1">
                    <p className="text-sm text-muted-foreground">Area</p>
                    <p className="font-medium">{teamMember.fields?.Area}</p>
                  </div>

                  <div className="transition-all hover:translate-x-1">
                    <p className="text-sm text-muted-foreground">Region</p>
                    <p className="font-medium">{teamMember.fields?.Region}</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </CardContent>
        </MotionCard>
      </div>
    </div>
  )
} 