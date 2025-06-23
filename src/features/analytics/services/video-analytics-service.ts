// src/features/analytics/services/video-analytics-service.ts

import { createClient } from '@/lib/supabase-server'

export interface VideoOrgBreakdown {
  orgLevel: 'region' | 'area' | 'team'
  orgValue: string
  totalViews: number
  uniqueViewers: number
  avgCompletionRate: number
  lastWatched: string | null
}

export interface VideoUserDetail {
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

export interface DailyEngagement {
  date: string
  totalViews: number
  uniqueViewers: number
  uniqueVideosWatched: number
  avgCompletionRate: number
}

export interface TrendingVideo {
  videoId: string
  title: string
  totalViews: number
  uniqueViewers: number
  avgCompletionRate: number
  trendScore: number
}

export interface OrgFilters {
  region?: string
  area?: string
  team?: string
}

/**
 * Video Analytics Service
 * Provides analytics data for video engagement across organizational structure
 */
export class VideoAnalyticsService {
  
  /**
   * Get organizational breakdown for a specific video
   */
  static async getVideoOrgBreakdown(
    videoId: string, 
    timeframe: number = 30
  ): Promise<VideoOrgBreakdown[]> {
    try {
      const supabase = await createClient()
      
      const { data, error } = await supabase
        .rpc('get_video_org_breakdown', {
          video_id: videoId,
          timeframe: timeframe
        })

      if (error) {
        console.error('Error fetching video org breakdown:', error)
        return []
      }

      return (data as any[] || []).map((row: any) => ({
        orgLevel: row.org_level as 'region' | 'area' | 'team',
        orgValue: row.org_value,
        totalViews: parseInt(row.total_views) || 0,
        uniqueViewers: parseInt(row.unique_viewers) || 0,
        avgCompletionRate: parseFloat(row.avg_completion_rate) || 0,
        lastWatched: row.last_watched
      }))
    } catch (err) {
      console.error('Error in getVideoOrgBreakdown:', err)
      return []
    }
  }

  /**
   * Get user details for a specific video with optional org filtering
   */
  static async getVideoUserDetails(
    videoId: string,
    orgFilters: OrgFilters = {}
  ): Promise<VideoUserDetail[]> {
    try {
      const supabase = await createClient()
      
      const { data, error } = await supabase
        .rpc('get_video_user_details', {
          video_id: videoId,
          org_filters: orgFilters
        })

      if (error) {
        console.error('Error fetching video user details:', error)
        return []
      }

      return (data as any[] || []).map((row: any) => ({
        userId: row.user_id,
        firstName: row.first_name,
        lastName: row.last_name,
        email: row.email,
        region: row.region || '',
        area: row.area || '',
        team: row.team || '',
        watchedSeconds: parseFloat(row.watched_seconds) || 0,
        percentComplete: parseFloat(row.percent_complete) || 0,
        completed: row.completed || false,
        lastWatched: row.last_watched
      }))
    } catch (err) {
      console.error('Error in getVideoUserDetails:', err)
      return []
    }
  }

  /**
   * Get daily engagement metrics for the video library
   */
  static async getDailyEngagement(days: number = 30): Promise<DailyEngagement[]> {
    try {
      const supabase = await createClient()
      
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)
      
      const { data, error } = await supabase
        .rpc('get_daily_engagement_metrics', {
          start_date: startDate.toISOString().split('T')[0],
          end_date: new Date().toISOString().split('T')[0]
        })

      if (error) {
        console.error('Error fetching daily engagement:', error)
        return []
      }

      return (data as any[] || []).map((row: any) => ({
        date: row.date,
        totalViews: parseInt(row.total_views) || 0,
        uniqueViewers: parseInt(row.unique_viewers) || 0,
        uniqueVideosWatched: parseInt(row.unique_videos_watched) || 0,
        avgCompletionRate: parseFloat(row.avg_completion_rate) || 0
      }))
    } catch (err) {
      console.error('Error in getDailyEngagement:', err)
      return []
    }
  }

  /**
   * Get trending videos based on views and completion rates
   */
  static async getTrendingVideos(
    days: number = 7, 
    limit: number = 10
  ): Promise<TrendingVideo[]> {
    try {
      const supabase = await createClient()
      
      const { data, error } = await supabase
        .rpc('get_trending_videos', {
          days: days,
          limit_count: limit
        })

      if (error) {
        console.error('Error fetching trending videos:', error)
        return []
      }

      return (data as any[] || []).map((row: any) => ({
        videoId: row.video_id,
        title: row.title,
        totalViews: parseInt(row.total_views) || 0,
        uniqueViewers: parseInt(row.unique_viewers) || 0,
        avgCompletionRate: parseFloat(row.avg_completion_rate) || 0,
        trendScore: parseFloat(row.trend_score) || 0
      }))
    } catch (err) {
      console.error('Error in getTrendingVideos:', err)
      return []
    }
  }

  /**
   * Get video overview statistics
   */
  static async getVideoOverview(videoId: string): Promise<{
    totalViews: number
    uniqueViewers: number
    avgCompletionRate: number
    totalWatchTime: number
    lastWatched: string | null
  } | null> {
    try {
      const supabase = await createClient()
      
      const { data, error } = await supabase
        .from('video_watches')
        .select(`
          watched_seconds,
          percent_complete,
          created_at,
          user_id
        `)
        .eq('video_file_id', videoId)

      if (error) {
        console.error('Error fetching video overview:', error)
        return null
      }

      const watches = data || []
      const uniqueViewers = new Set(watches.map(w => w.user_id)).size
      const totalViews = watches.length
      const avgCompletionRate = watches.length > 0 
        ? watches.reduce((sum, w) => sum + (w.percent_complete || 0), 0) / watches.length
        : 0
      const totalWatchTime = watches.reduce((sum, w) => sum + (w.watched_seconds || 0), 0)
      const lastWatched = watches.length > 0 
        ? watches.sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())[0].created_at
        : null

      return {
        totalViews,
        uniqueViewers,
        avgCompletionRate,
        totalWatchTime,
        lastWatched
      }
    } catch (err) {
      console.error('Error in getVideoOverview:', err)
      return null
    }
  }

  /**
   * Get organization hierarchy data for filters
   */
  static async getOrganizationHierarchy(): Promise<{
    regions: string[]
    areas: string[]
    teams: string[]
  }> {
    try {
      const supabase = await createClient()
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('region, area, team')
        .not('region', 'is', null)
        .not('area', 'is', null)
        .not('team', 'is', null)

      if (error) {
        console.error('Error fetching organization hierarchy:', error)
        return { regions: [], areas: [], teams: [] }
      }

      const profiles = data || []
      const regions = [...new Set(profiles.map(p => p.region).filter(Boolean) as string[])].sort()
      const areas = [...new Set(profiles.map(p => p.area).filter(Boolean) as string[])].sort()
      const teams = [...new Set(profiles.map(p => p.team).filter(Boolean) as string[])].sort()

      return { regions, areas, teams }
    } catch (err) {
      console.error('Error in getOrganizationHierarchy:', err)
      return { regions: [], areas: [], teams: [] }
    }
  }
}