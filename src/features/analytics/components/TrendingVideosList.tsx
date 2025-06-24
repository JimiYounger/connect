// src/features/analytics/components/TrendingVideosList.tsx

import React from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, Play, Users, Clock } from 'lucide-react'
import Link from 'next/link'

interface TrendingVideo {
  videoId: string
  title: string
  totalViews: number
  uniqueViewers: number
  avgCompletionRate: number
  trendScore: number
}

interface TrendingVideosListProps {
  videos: TrendingVideo[]
  isLoading?: boolean
  onVideoClick?: (videoId: string) => void
}

const LoadingList = () => (
  <div className="space-y-3">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="animate-pulse">
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
          <div className="w-8 h-8 bg-gray-200 rounded"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    ))}
  </div>
)

const EmptyList = () => (
  <div className="text-center py-12">
    <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
    <p className="text-gray-500">No trending videos</p>
    <p className="text-sm text-gray-400 mt-1">Videos will appear here once there&apos;s engagement data</p>
  </div>
)

export function TrendingVideosList({ videos, isLoading, onVideoClick }: TrendingVideosListProps) {
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold">Trending Videos</h3>
          <p className="text-sm text-gray-600">Most engaging videos this week</p>
        </div>
        <LoadingList />
      </Card>
    )
  }

  if (!videos || videos.length === 0) {
    return (
      <Card className="p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold">Trending Videos</h3>
          <p className="text-sm text-gray-600">Most engaging videos this week</p>
        </div>
        <EmptyList />
      </Card>
    )
  }

  const handleVideoClick = (videoId: string) => {
    onVideoClick?.(videoId)
  }

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold">Trending Videos</h3>
        <p className="text-sm text-gray-600">Most engaging videos this week</p>
      </div>
      
      <div className="space-y-3">
        {videos.map((video, index) => (
          <div
            key={video.videoId}
            className="group flex items-center gap-4 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            onClick={() => handleVideoClick(video.videoId)}
          >
            {/* Rank */}
            <div className="flex-shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                index === 0 ? 'bg-yellow-100 text-yellow-700' :
                index === 1 ? 'bg-gray-100 text-gray-700' :
                index === 2 ? 'bg-orange-100 text-orange-700' :
                'bg-blue-100 text-blue-700'
              }`}>
                {index + 1}
              </div>
            </div>

            {/* Video Info */}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                {video.title}
              </h4>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Play className="w-3 h-3" />
                  <span>{video.totalViews.toLocaleString()} views</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span>{video.uniqueViewers.toLocaleString()} viewers</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{Math.round(video.avgCompletionRate)}% completion</span>
                </div>
              </div>
            </div>

            {/* Trend Score Badge */}
            <div className="flex-shrink-0">
              <Badge 
                variant="secondary" 
                className={`${
                  video.trendScore > 50 ? 'bg-green-100 text-green-700' :
                  video.trendScore > 20 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-700'
                }`}
              >
                {video.trendScore ? Math.round(video.trendScore) : 0} score
              </Badge>
            </div>

            {/* Action Button */}
            <div className="flex-shrink-0">
              <Link
                href={`/admin/analytics/video/${video.videoId}`}
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                Analyze
              </Link>
            </div>
          </div>
        ))}
      </div>

      {videos.length >= 10 && (
        <div className="mt-4 text-center">
          <Link
            href="/admin/analytics/trending"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View all trending videos →
          </Link>
        </div>
      )}
    </Card>
  )
}