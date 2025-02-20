// src/app/admin/page.tsx
'use client'

import { UserProfileNav } from "@/features/users/components/UserProfileNav"
import { useAuth } from "@/features/auth/context/auth-context"
import { useProfile } from "@/features/users/hooks/useProfile"
import { usePermissions } from "@/features/permissions/hooks/usePermissions"
import { hasPermissionLevel } from "@/features/permissions/constants/roles"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { LineChart, Activity, AlertOctagon, ImageIcon, TrendingUp, TrendingDown } from "lucide-react"

// Mock data
const mockStats = {
  daily: {
    current: 245,
    change: 12.5,
    trending: 'up' as const
  },
  weekly: {
    current: 1456,
    change: -2.3,
    trending: 'down' as const
  },
  monthly: {
    current: 5271,
    change: 8.7,
    trending: 'up' as const
  }
}

function StatCard({ 
  title, 
  icon: Icon, 
  stat, 
  change, 
  trending,
  iconColor 
}: { 
  title: string
  icon: any
  stat: number
  change: number
  trending: 'up' | 'down'
  iconColor: string
}) {
  return (
    <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className={`p-2 rounded-lg bg-opacity-10 ${iconColor.replace('text-', 'bg-')} group-hover:scale-110 transition-transform duration-300`}>
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
          <h3 className="font-medium text-sm text-muted-foreground">{title}</h3>
        </div>
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-semibold tracking-tight">{stat.toLocaleString()}</p>
          <div className={`flex items-center gap-1 text-sm ${
            trending === 'up' ? 'text-green-600' : 'text-red-600'
          }`}>
            {trending === 'up' ? 
              <TrendingUp className="h-3 w-3" /> : 
              <TrendingDown className="h-3 w-3" />
            }
            <span className="font-medium">{Math.abs(change)}%</span>
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-20" />
    </Card>
  )
}

export default function AdminDashboard() {
  const { session, loading } = useAuth()
  const { profile, isLoading: profileLoading } = useProfile(session)
  const { userPermissions, isLoading: permissionsLoading } = usePermissions(profile)

  // Loading states
  if (loading.initializing || profileLoading || permissionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    )
  }

  // Auth & permission checks
  if (!session || !profile || !userPermissions || !hasPermissionLevel('Admin', userPermissions.roleType)) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p>You don't have permission to access this page</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-2rem)]">
      <div className="border-b bg-white/50 backdrop-blur-sm sticky top-0 z-10 mb-8">
        <div className="px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto">  {/* Added max-width and auto margins */}
          <div className="flex justify-between items-center h-16">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Welcome back, {profile.first_name}
              </p>
            </div>
            <UserProfileNav profile={profile} />
          </div>
        </div>
      </div>

      
    <div className="px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto"> 
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard 
            title="Daily Active Users"
            icon={Activity}
            stat={mockStats.daily.current}
            change={mockStats.daily.change}
            trending={mockStats.daily.trending}
            iconColor="text-blue-500"
          />
          <StatCard 
            title="Weekly Active Users"
            icon={LineChart}
            stat={mockStats.weekly.current}
            change={mockStats.weekly.change}
            trending={mockStats.weekly.trending}
            iconColor="text-green-500"
          />
          <StatCard 
            title="Monthly Active Users"
            icon={Activity}
            stat={mockStats.monthly.current}
            change={mockStats.monthly.change}
            trending={mockStats.monthly.trending}
            iconColor="text-purple-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: "Carousel Editor",
              icon: ImageIcon,
              href: "/admin/carousel",
              color: "text-blue-500",
              bgColor: "bg-blue-50",
              description: "Manage homepage carousel content"
            },
            {
              title: "Activity Log",
              icon: Activity,
              href: "/admin/activities",
              color: "text-green-500",
              bgColor: "bg-green-50",
              description: "View user activity history"
            },
            {
              title: "Error Log",
              icon: AlertOctagon,
              href: "/admin/errors",
              color: "text-red-500",
              bgColor: "bg-red-50",
              description: "Monitor system errors"
            },
          ].map((item) => (
            <Link key={item.href} href={item.href} className="group">
              <Card className="p-6 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]">
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className={`${item.bgColor} p-2.5 rounded-lg group-hover:scale-110 transition-transform duration-300`}>
                        <item.icon className={`h-5 w-5 ${item.color}`} />
                      </div>
                      <h3 className="font-medium">{item.title}</h3>
                    </div>
                    <span className="text-muted-foreground group-hover:translate-x-1 transition-transform duration-200">
                      →
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground pl-12">
                    {item.description}
                  </p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}