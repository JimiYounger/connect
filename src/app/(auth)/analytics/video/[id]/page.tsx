// src/app/(auth)/analytics/video/[id]/page.tsx
'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { use } from 'react'
import { useAuth } from "@/features/auth/context/auth-context"
import { useProfile } from "@/features/users/hooks/useProfile"
import { usePermissions } from "@/features/permissions/hooks/usePermissions"
import { hasPermissionLevel } from "@/features/permissions/constants/roles"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, 
  RefreshCw, 
  AlertCircle, 
  Download,
  Users,
  BarChart3,
  TrendingUp
} from "lucide-react"
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// Import our analytics components
import { VideoOverviewCards } from '@/features/analytics/components/VideoOverviewCards'
import { OrgBreakdownChart } from '@/features/analytics/components/OrgBreakdownChart'
import { DrillDownTable } from '@/features/analytics/components/DrillDownTable'

// Types
interface VideoOverview {
  totalViews: number
  uniqueViewers: number
  avgCompletionRate: number
  totalWatchTime: number
  lastWatched: string | null
}

interface OrgBreakdownData {
  orgLevel: 'region' | 'area' | 'team'
  orgValue: string
  totalViews: number
  uniqueViewers: number
  avgCompletionRate: number
  lastWatched: string | null
}

interface UserDetail {
  userId: string
  firstName: string
  lastName: string
  email: string
  region: string
  area: string
  team: string
  watchedSeconds: number
  percentComplete: number
  completed: boolean
  lastWatched: string
}

interface VideoData {
  videoId: string
  videoTitle: string
  videoDuration?: number
}

interface PageParams {
  id: string
}

export default function VideoAnalyticsPage({ params }: { params: Promise<PageParams> }) {
  const resolvedParams = use(params)
  const videoId = resolvedParams.id
  
  const { session, loading } = useAuth()
  const { profile, isLoading: profileLoading } = useProfile(session)
  const { userPermissions, isLoading: permissionsLoading } = usePermissions(profile)
  const router = useRouter()

  // State
  const [videoData, setVideoData] = useState<VideoData | null>(null)
  const [overview, setOverview] = useState<VideoOverview | null>(null)
  const [orgBreakdown, setOrgBreakdown] = useState<OrgBreakdownData[]>([])
  const [userDetails, setUserDetails] = useState<UserDetail[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserDetail[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [currentFilters, setCurrentFilters] = useState<any>({})

  // Fetch video analytics data
  const fetchVideoAnalytics = useCallback(async (orgFilters: any = {}) => {
    setIsLoadingData(true)
    setError(null)

    try {
      // Fetch video overview
      const overviewResponse = await fetch(`/api/analytics/video/${videoId}/overview`)
      if (!overviewResponse.ok) {
        if (overviewResponse.status === 404) {
          throw new Error('Video not found')
        }
        throw new Error('Failed to fetch video overview')
      }
      const overviewData = await overviewResponse.json()

      // Fetch organizational breakdown
      const breakdownResponse = await fetch(`/api/analytics/video/${videoId}/breakdown?timeframe=30`)
      if (!breakdownResponse.ok) throw new Error('Failed to fetch organizational breakdown')
      const breakdownData = await breakdownResponse.json()

      // Fetch user details with current filters
      const filterParams = new URLSearchParams()
      if (orgFilters.region) filterParams.append('region', orgFilters.region)
      if (orgFilters.area) filterParams.append('area', orgFilters.area)
      if (orgFilters.team) filterParams.append('team', orgFilters.team)

      const usersResponse = await fetch(`/api/analytics/video/${videoId}/users?${filterParams}`)
      if (!usersResponse.ok) throw new Error('Failed to fetch user details')
      const usersData = await usersResponse.json()

      if (overviewData.success) {
        setVideoData({
          videoId: overviewData.data.videoId,
          videoTitle: overviewData.data.videoTitle,
          videoDuration: overviewData.data.videoDuration
        })
        setOverview(overviewData.data.statistics)
      }

      if (breakdownData.success) {
        setOrgBreakdown(breakdownData.data.breakdown || [])
      }

      if (usersData.success) {
        setUserDetails(usersData.data.users || [])
        setFilteredUsers(usersData.data.users || [])
      }

      setCurrentFilters(orgFilters)
      setLastRefresh(new Date())
    } catch (err) {
      console.error('Error fetching video analytics:', err)
      setError(err instanceof Error ? err.message : 'Failed to load video analytics')
    } finally {
      setIsLoadingData(false)
    }
  }, [videoId])

  // Load data on mount
  useEffect(() => {
    if (videoId) {
      fetchVideoAnalytics()
    }
  }, [videoId, fetchVideoAnalytics])

  // Loading states
  if (loading.initializing || profileLoading || permissionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    )
  }

  // Handle organizational drill-down
  const handleOrgClick = (orgLevel: string, orgValue: string) => {
    const newFilters = {
      [orgLevel]: orgValue
    }
    fetchVideoAnalytics(newFilters)
  }

  // Handle filters change
  const _handleFiltersChange = (filters: any) => {
    fetchVideoAnalytics(filters)
  }

  // Handle refresh
  const handleRefresh = () => {
    fetchVideoAnalytics(currentFilters)
  }

  // Handle export
  const handleExport = () => {
    if (!videoData || !userDetails.length) return

    const csvData = [
      ['Name', 'Email', 'Region', 'Area', 'Team', 'Watch Time (seconds)', 'Completion %', 'Completed', 'Last Watched'],
      ...userDetails.map(user => [
        `${user.firstName} ${user.lastName}`,
        user.email,
        user.region,
        user.area,
        user.team,
        user.watchedSeconds.toString(),
        user.percentComplete.toString(),
        user.completed ? 'Yes' : 'No',
        new Date(user.lastWatched).toLocaleString()
      ])
    ]

    const csvContent = csvData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${videoData.videoTitle.replace(/[^a-zA-Z0-9]/g, '_')}_analytics.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  // Clear filters
  const clearFilters = () => {
    fetchVideoAnalytics({})
  }

  // Auth & permission checks
  if (!session || !profile || !userPermissions || !hasPermissionLevel('Admin', userPermissions.roleType)) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">You need admin access to view analytics</p>
          <Button onClick={() => router.push('/admin')} variant="outline">
            Go to Admin Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] p-6">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/analytics">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Analytics
              </Button>
            </Link>
            <div className="flex items-center gap-3 ml-auto">
              <Badge variant="outline" className="text-xs">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </Badge>
              <Button
                onClick={handleRefresh}
                disabled={isLoadingData}
                size="sm"
                variant="outline"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingData ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
          
          <div>
            <h1 className="text-2xl font-semibold tracking-tight mb-2">
              Video Analytics: {videoData?.videoTitle || 'Loading...'}
            </h1>
            <p className="text-sm text-muted-foreground">
              Detailed engagement analysis and user drill-down
            </p>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <Card className="p-6 mb-8 border-red-200 bg-red-50">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <div>
                <h3 className="font-medium text-red-700">Error Loading Video Analytics</h3>
                <p className="text-sm text-red-600 mt-1">{error}</p>
                <Button
                  onClick={handleRefresh}
                  size="sm"
                  variant="outline"
                  className="mt-3 border-red-300 text-red-700 hover:bg-red-100"
                >
                  Try Again
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Video Overview Cards */}
        <div className="mb-8">
          <VideoOverviewCards
            overview={overview}
            videoTitle={videoData?.videoTitle || ''}
            videoDuration={videoData?.videoDuration}
            isLoading={isLoadingData}
          />
        </div>

        {/* Filter Status */}
        {Object.keys(currentFilters).length > 0 && (
          <Card className="p-4 mb-6 border-blue-200 bg-blue-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-700">Filtered View Active</span>
                </div>
                <div className="flex items-center gap-2">
                  {currentFilters.region && (
                    <Badge className="bg-blue-100 text-blue-700">Region: {currentFilters.region}</Badge>
                  )}
                  {currentFilters.area && (
                    <Badge className="bg-blue-100 text-blue-700">Area: {currentFilters.area}</Badge>
                  )}
                  {currentFilters.team && (
                    <Badge className="bg-blue-100 text-blue-700">Team: {currentFilters.team}</Badge>
                  )}
                </div>
              </div>
              <Button
                onClick={clearFilters}
                variant="outline"
                size="sm"
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                Clear Filters
              </Button>
            </div>
          </Card>
        )}

        {/* Main Content */}
        <div className="space-y-8">
          {/* Organizational Breakdown Chart */}
          <OrgBreakdownChart
            data={orgBreakdown}
            isLoading={isLoadingData}
            onOrgClick={handleOrgClick}
          />

          {/* User Details Table */}
          <DrillDownTable
            users={filteredUsers}
            isLoading={isLoadingData}
            orgFilters={currentFilters}
            onExport={handleExport}
          />
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => router.push(`/videos/${videoId}`)}
              >
                <Users className="w-4 h-4" />
                View Video
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={handleExport}
                disabled={!userDetails.length}
              >
                <Download className="w-4 h-4" />
                Export Data
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => router.push('/analytics/trending')}
              >
                <TrendingUp className="w-4 h-4" />
                Compare with Trending
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => router.push('/analytics')}
              >
                <BarChart3 className="w-4 h-4" />
                Analytics Dashboard
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}