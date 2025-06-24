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
      
      // Calculate the start date for the trending period
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)
      
      // First, get all video watches within the timeframe
      const { data: watches, error: watchError } = await supabase
        .from('video_watches')
        .select(`
          video_file_id,
          user_id,
          percent_complete,
          created_at,
          video_files!inner (
            id,
            title,
            library_status
          )
        `)
        .gte('created_at', startDate.toISOString())
        .eq('video_files.library_status', 'approved')

      if (watchError) {
        console.error('Error fetching video watches:', watchError)
        return []
      }

      if (!watches || watches.length === 0) {
        return []
      }

      // Group watches by video and calculate metrics
      const videoMetrics = new Map<string, {
        videoId: string,
        title: string,
        totalViews: number,
        uniqueViewers: Set<string>,
        completions: number[]
      }>()

      watches.forEach((watch: any) => {
        const videoId = watch.video_file_id
        const userId = watch.user_id
        const completion = parseFloat(watch.percent_complete) || 0
        const title = watch.video_files.title

        if (!videoMetrics.has(videoId)) {
          videoMetrics.set(videoId, {
            videoId,
            title,
            totalViews: 0,
            uniqueViewers: new Set(),
            completions: []
          })
        }

        const metrics = videoMetrics.get(videoId)!
        metrics.totalViews += 1
        metrics.uniqueViewers.add(userId)
        metrics.completions.push(completion)
      })

      // Calculate trend scores and create final results
      const trendingVideos: TrendingVideo[] = Array.from(videoMetrics.values())
        .map(metrics => {
          const avgCompletionRate = metrics.completions.length > 0
            ? metrics.completions.reduce((sum, rate) => sum + rate, 0) / metrics.completions.length
            : 0

          // Trend score formula: (total_views * unique_viewers * avg_completion_rate) / 100
          // This gives higher scores to videos with more views, diverse viewership, and high completion
          const trendScore = (metrics.totalViews * metrics.uniqueViewers.size * avgCompletionRate) / 100

          return {
            videoId: metrics.videoId,
            title: metrics.title,
            totalViews: metrics.totalViews,
            uniqueViewers: metrics.uniqueViewers.size,
            avgCompletionRate: avgCompletionRate,
            trendScore: trendScore
          }
        })
        .filter(video => video.totalViews > 0) // Only include videos with actual views
        .sort((a, b) => b.trendScore - a.trendScore) // Sort by trend score descending
        .slice(0, limit) // Limit results

      return trendingVideos
    } catch (err) {
      console.error('Error in getTrendingVideos:', err)
      return []
    }
  }

  /**
   * Get video overview statistics
   * Uses the same organizational data filtering as breakdown functions for consistency
   */
  static async getVideoOverview(
    videoId: string, 
    timeframe: number = 30
  ): Promise<{
    totalViews: number
    uniqueViewers: number
    avgCompletionRate: number
    totalWatchTime: number
    lastWatched: string | null
  } | null> {
    try {
      const supabase = await createClient()
      
      // Use the same join pattern as the org breakdown function to ensure consistency
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - timeframe)
      
      const { data, error } = await supabase
        .from('video_watches')
        .select(`
          watched_seconds,
          percent_complete,
          created_at,
          user_id,
          user_profiles!inner (
            id,
            region,
            area,
            team
          )
        `)
        .eq('video_file_id', videoId)
        .gte('created_at', startDate.toISOString())
        .not('user_profiles.region', 'is', null)
        .not('user_profiles.area', 'is', null)
        .not('user_profiles.team', 'is', null)
        .neq('user_profiles.team', '')

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