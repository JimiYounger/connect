// src/app/(auth)/admin/analytics/page.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Play, 
  Clock, 
  RefreshCw,
  AlertCircle 
} from "lucide-react"
import { useRouter } from 'next/navigation'

// Import our analytics components
import { DailyEngagementChart } from '@/features/analytics/components/DailyEngagementChart'
import { TrendingVideosList } from '@/features/analytics/components/TrendingVideosList'
import { VideoSearch } from '@/features/analytics/components/VideoSearch'

// Types
interface DailyEngagement {
  date: string
  totalViews: number
  uniqueViewers: number
  uniqueVideosWatched: number
  avgCompletionRate: number
}

interface TrendingVideo {
  videoId: string
  title: string
  totalViews: number
  uniqueViewers: number
  avgCompletionRate: number
  trendScore: number
}

interface OverallStats {
  totalViews: number
  totalUniqueViewers: number
  totalVideosWatched: number
  averageCompletionRate: number
}

export default function AnalyticsDashboard() {
  const router = useRouter()

  // State
  const [dailyEngagement, setDailyEngagement] = useState<DailyEngagement[]>([])
  const [trendingVideos, setTrendingVideos] = useState<TrendingVideo[]>([])
  const [overallStats, setOverallStats] = useState<OverallStats | null>(null)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  // Fetch analytics data
  const fetchAnalyticsData = async () => {
    setIsLoadingData(true)
    setError(null)

    try {
      // Fetch daily engagement (last 30 days)
      const engagementResponse = await fetch('/api/analytics/engagement?days=30')
      if (!engagementResponse.ok) throw new Error('Failed to fetch engagement data')
      const engagementData = await engagementResponse.json()

      // Fetch trending videos (last 7 days)
      const trendingResponse = await fetch('/api/analytics/trending?days=7&limit=10')
      if (!trendingResponse.ok) throw new Error('Failed to fetch trending videos')
      const trendingData = await trendingResponse.json()

      if (engagementData.success) {
        setDailyEngagement(engagementData.data.metrics || [])
        
        // Calculate overall stats from daily data
        const metrics = engagementData.data.metrics || []
        if (metrics.length > 0) {
          const stats: OverallStats = {
            totalViews: metrics.reduce((sum: number, day: DailyEngagement) => sum + day.totalViews, 0),
            totalUniqueViewers: Math.max(...metrics.map((day: DailyEngagement) => day.uniqueViewers), 0),
            totalVideosWatched: Math.max(...metrics.map((day: DailyEngagement) => day.uniqueVideosWatched), 0),
            averageCompletionRate: metrics.reduce((sum: number, day: DailyEngagement) => sum + day.avgCompletionRate, 0) / metrics.length
          }
          setOverallStats(stats)
        }
      }

      if (trendingData.success) {
        setTrendingVideos(trendingData.data.videos || [])
      }

      setLastRefresh(new Date())
    } catch (err) {
      console.error('Error fetching analytics data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load analytics data')
    } finally {
      setIsLoadingData(false)
    }
  }

  // Load data on mount
  useEffect(() => {
    fetchAnalyticsData()
  }, [])

  // Handle video selection from search
  const handleVideoSelect = (videoId: string) => {
    router.push(`/admin/analytics/video/${videoId}`)
  }

  // Handle refresh
  const handleRefresh = () => {
    fetchAnalyticsData()
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] p-6">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight mb-2">Video Analytics</h1>
              <p className="text-sm text-gray-600">
                Comprehensive insights into video engagement and usage patterns
              </p>
            </div>
            <div className="flex items-center gap-3">
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
        </div>

        {/* Error State */}
        {error && (
          <Card className="p-6 mb-8 border-red-200 bg-red-50">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <div>
                <h3 className="font-medium text-red-700">Error Loading Analytics</h3>
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

        {/* Overall Stats Cards */}
        {overallStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Play className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Views</p>
                  <p className="text-2xl font-semibold">{overallStats.totalViews.toLocaleString()}</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-50 rounded-lg">
                  <Users className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Unique Viewers</p>
                  <p className="text-2xl font-semibold">{overallStats.totalUniqueViewers.toLocaleString()}</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Videos Watched</p>
                  <p className="text-2xl font-semibold">{overallStats.totalVideosWatched.toLocaleString()}</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-50 rounded-lg">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Avg Completion</p>
                  <p className="text-2xl font-semibold">{Math.round(overallStats.averageCompletionRate)}%</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Daily Engagement Chart - Takes 2 columns */}
          <div className="lg:col-span-2">
            <DailyEngagementChart 
              data={dailyEngagement} 
              isLoading={isLoadingData}
            />
          </div>

          {/* Video Search - Takes 1 column */}
          <div>
            <VideoSearch 
              onVideoSelect={handleVideoSelect}
              placeholder="Search videos to analyze..."
              showRecentlyAnalyzed={true}
            />
          </div>
        </div>

        {/* Trending Videos - Full width */}
        <div className="mt-8">
          <TrendingVideosList 
            videos={trendingVideos}
            isLoading={isLoadingData}
            onVideoClick={handleVideoSelect}
          />
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => router.push('/admin/analytics/engagement')}
              >
                <TrendingUp className="w-4 h-4" />
                Engagement Report
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => router.push('/admin/analytics/trending')}
              >
                <BarChart3 className="w-4 h-4" />
                Trending Analysis
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => router.push('/admin/video-library')}
              >
                <Play className="w-4 h-4" />
                Manage Videos
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}