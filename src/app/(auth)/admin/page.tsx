// src/app/(auth)/admin/page.tsx
'use client'

import { useAuth } from "@/features/auth/context/auth-context"
import { useProfile } from "@/features/users/hooks/useProfile"
import { usePermissions } from "@/features/permissions/hooks/usePermissions"
import { hasPermissionLevel } from "@/features/permissions/constants/roles"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { LineChart, Activity, AlertOctagon, ImageIcon, TrendingUp, TrendingDown, BookText, MessageSquare, Settings, Users, RefreshCw, Database } from "lucide-react"
import { LucideIcon } from 'lucide-react'
import { useState } from 'react'

type TrendDirection = 'up' | 'down'

interface StatData {
  current: number
  change: number
  trending: TrendDirection
}

interface MockStats {
  daily: StatData
  weekly: StatData
  monthly: StatData
}

interface StatCardProps {
  title: string
  icon: LucideIcon
  stat: number
  change: number
  trending: TrendDirection
  iconColor: string
}

// Mock data
const mockStats: MockStats = {
  daily: {
    current: 245,
    change: 12.5,
    trending: 'up'
  },
  weekly: {
    current: 1456,
    change: -2.3,
    trending: 'down'
  },
  monthly: {
    current: 5271,
    change: 8.7,
    trending: 'up'
  }
}

function StatCard({ 
  title, 
  icon: Icon, 
  stat, 
  change, 
  trending,
  iconColor 
}: StatCardProps) {
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
          <p>You Don&apos;t have permission to access this page</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] p-6">
      <div className="max-w-[1400px] mx-auto"> 
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight mb-2">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Welcome back, {profile.first_name}
          </p>
        </div>

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

        <h2 className="text-xl font-medium mb-6">Admin Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: "Dashboards",
              icon: LineChart,
              href: "/admin/dashboards",
              color: "text-indigo-500",
              bgColor: "bg-indigo-50",
              description: "Manage application dashboards"
            },
            {
              title: "Widgets",
              icon: Settings,
              href: "/admin/widgets",
              color: "text-amber-500",
              bgColor: "bg-amber-50",
              description: "Configure dashboard widgets"
            },
            {
              title: "Navigation",
              icon: Users,
              href: "/admin/navigation",
              color: "text-sky-500",
              bgColor: "bg-sky-50",
              description: "Manage site navigation menu"
            },
            {
              title: "Messaging",
              icon: MessageSquare,
              href: "/admin/messaging",
              color: "text-violet-500",
              bgColor: "bg-violet-50",
              description: "Configure messaging settings"
            },
            {
              title: "Carousel Editor",
              icon: ImageIcon,
              href: "/admin/carousel",
              color: "text-blue-500",
              bgColor: "bg-blue-50",
              description: "Manage homepage carousel content"
            },
            {
              title: "Document Library",
              icon: BookText,
              href: "/admin/document-library",
              color: "text-emerald-500",
              bgColor: "bg-emerald-50",
              description: "Manage document resources"
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

        {/* Cache Management Section */}
        <div className="mt-8">
          <h2 className="text-xl font-medium mb-6">System Management</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CacheClearCard />
          </div>
        </div>
      </div>
    </div>
  )
}

// Cache Clear Component
function CacheClearCard() {
  const [isClearing, setIsClearing] = useState(false)
  const [lastCleared, setLastCleared] = useState<string | null>(null)
  const [cacheStats, setCacheStats] = useState<any>(null)

  const handleClearCache = async () => {
    setIsClearing(true)
    try {
      const response = await fetch('/api/admin/cache/clear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()
      
      if (result.success) {
        setLastCleared(new Date().toLocaleString())
        setCacheStats(result.statsBefore)
        console.log('Cache cleared:', result)
      } else {
        console.error('Failed to clear cache:', result.error)
        alert('Failed to clear cache: ' + result.error)
      }
    } catch (error) {
      console.error('Error clearing cache:', error)
      alert('Error clearing cache. Check console for details.')
    } finally {
      setIsClearing(false)
    }
  }

  const getCacheStats = async () => {
    try {
      const response = await fetch('/api/admin/cache/clear', {
        method: 'GET',
      })
      const result = await response.json()
      if (result.success) {
        setCacheStats(result.stats)
      }
    } catch (error) {
      console.error('Error getting cache stats:', error)
    }
  }

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-50 rounded-lg">
            <Database className="w-6 h-6 text-orange-500" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Cache Management</h3>
            <p className="text-sm text-gray-600">Clear cached data to reflect recent changes</p>
          </div>
        </div>
        
        {cacheStats && (
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
            <p>Cache items: {cacheStats.active} active, {cacheStats.expired} expired</p>
          </div>
        )}
        
        {lastCleared && (
          <div className="text-sm text-green-600 bg-green-50 p-3 rounded-lg">
            <p>Last cleared: {lastCleared}</p>
            {cacheStats && <p>Cleared {cacheStats.total} items</p>}
          </div>
        )}
        
        <div className="flex gap-3">
          <button
            onClick={handleClearCache}
            disabled={isClearing}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isClearing ? 'animate-spin' : ''}`} />
            {isClearing ? 'Clearing...' : 'Clear Cache'}
          </button>
          
          <button
            onClick={getCacheStats}
            className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            <Database className="w-4 h-4" />
            View Stats
          </button>
        </div>
        
        <div className="text-xs text-gray-500">
          <p>• Clears categories cache (normally cached for 4 hours)</p>
          <p>• Clears user permissions cache (normally cached for 30 minutes)</p>
          <p>• Use after updating video categories or user roles</p>
        </div>
      </div>
    </Card>
  )
}