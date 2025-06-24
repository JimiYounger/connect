// src/features/analytics/components/VideoOverviewCards.tsx

import React from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Play, Users, Clock, TrendingUp, Calendar } from 'lucide-react'

interface VideoOverview {
  totalViews: number
  uniqueViewers: number
  avgCompletionRate: number
  totalWatchTime: number
  lastWatched: string | null
}

interface VideoOverviewCardsProps {
  overview: VideoOverview | null
  videoTitle: string
  videoDuration?: number
  isLoading?: boolean
}

const LoadingCard = () => (
  <Card className="p-6">
    <div className="animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    </div>
  </Card>
)

export function VideoOverviewCards({ overview, videoTitle, videoDuration, isLoading }: VideoOverviewCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => <LoadingCard key={i} />)}
      </div>
    )
  }

  if (!overview) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 col-span-full">
          <div className="text-center text-gray-500">
            <Play className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p>No viewing data available for this video yet</p>
            <p className="text-sm mt-1">Analytics will appear once users start watching</p>
          </div>
        </Card>
      </div>
    )
  }

  // Format duration helper
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`
    } else {
      return `${remainingSeconds}s`
    }
  }

  // Calculate engagement score
  const engagementScore = overview.totalViews > 0 ? 
    Math.round((overview.avgCompletionRate / 100) * (overview.uniqueViewers / overview.totalViews) * 100) : 0

  // Get completion rate color
  const getCompletionColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600 bg-green-50'
    if (rate >= 60) return 'text-yellow-600 bg-yellow-50'
    if (rate >= 40) return 'text-orange-600 bg-orange-50'
    return 'text-red-600 bg-red-50'
  }

  return (
    <div className="space-y-6">
      {/* Video Title Header */}
      <div className="border-b pb-4">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">{videoTitle}</h2>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          {videoDuration && (
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>Duration: {formatDuration(videoDuration)}</span>
            </div>
          )}
          {overview.lastWatched && (
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>Last viewed: {new Date(overview.lastWatched).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Views */}
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <Play className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Views</p>
              <p className="text-2xl font-bold text-gray-900">{overview.totalViews.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        {/* Unique Viewers */}
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-50 rounded-lg">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Unique Viewers</p>
              <p className="text-2xl font-bold text-gray-900">{overview.uniqueViewers.toLocaleString()}</p>
              {overview.totalViews > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  {Math.round((overview.uniqueViewers / overview.totalViews) * 100)}% unique
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Completion Rate */}
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg ${getCompletionColor(overview.avgCompletionRate)}`}>
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Avg Completion</p>
              <p className="text-2xl font-bold text-gray-900">{Math.round(overview.avgCompletionRate)}%</p>
              <Badge 
                variant="secondary" 
                className={`text-xs mt-1 ${getCompletionColor(overview.avgCompletionRate)}`}
              >
                {overview.avgCompletionRate >= 80 ? 'Excellent' :
                 overview.avgCompletionRate >= 60 ? 'Good' :
                 overview.avgCompletionRate >= 40 ? 'Fair' : 'Needs Improvement'}
              </Badge>
            </div>
          </div>
        </Card>

        {/* Total Watch Time */}
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-50 rounded-lg">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Watch Time</p>
              <p className="text-2xl font-bold text-gray-900">{formatDuration(overview.totalWatchTime)}</p>
              {videoDuration && overview.totalViews > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Avg: {formatDuration(overview.totalWatchTime / overview.totalViews)} per view
                </p>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Engagement Insights */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Engagement Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">{engagementScore}%</div>
            <p className="text-sm text-gray-600">Engagement Score</p>
            <p className="text-xs text-gray-500 mt-1">
              Based on completion rate and viewer retention
            </p>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {overview.totalViews > 0 ? Math.round((overview.uniqueViewers / overview.totalViews) * 100) : 0}%
            </div>
            <p className="text-sm text-gray-600">Viewer Uniqueness</p>
            <p className="text-xs text-gray-500 mt-1">
              Percentage of unique vs repeat viewers
            </p>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {overview.totalViews > overview.uniqueViewers ? 
                ((overview.totalViews - overview.uniqueViewers) / overview.uniqueViewers).toFixed(1) : 
                '0.0'}
            </div>
            <p className="text-sm text-gray-600">Repeat Views Ratio</p>
            <p className="text-xs text-gray-500 mt-1">
              Average rewatches per unique viewer
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}