// my-app/src/features/widgets/services/analytics-service.ts

import { createClient as createBrowserClient } from '@/lib/supabase';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { WidgetType } from '../types';

// Cache mechanism for expensive queries
const analyticsCache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface AnalyticsFilters {
  from?: string;
  to?: string;
  widgetTypes?: WidgetType[];
  dashboardIds?: string[];
  userRoles?: string[];
  minInteractions?: number;
}

/**
 * Service for fetching and analyzing widget analytics data
 */
class AnalyticsService {
  // Get the appropriate Supabase client
  private getClient() {
    return createBrowserClient();
  }
  
  /**
   * Get widget views count with optional filtering
   */
  async getWidgetViewsCount(filters?: AnalyticsFilters): Promise<{ data: number | null; error: Error | null }> {
    try {
      const supabase = this.getClient();
      
      let query = supabase
        .from('widget_analytics')
        .select('count(*)', { count: 'exact' })
        .eq('action', 'view');
        
      if (filters) {
        if (filters.from) query = query.gte('timestamp', new Date(filters.from).getTime());
        if (filters.to) query = query.lte('timestamp', new Date(filters.to).getTime());
        if (filters.widgetTypes && filters.widgetTypes.length > 0) {
          // Need to join with widgets table to filter by type
          const { data: widgetIds } = await supabase
            .from('widgets')
            .select('id')
            .in('widget_type', filters.widgetTypes);
            
          if (widgetIds && widgetIds.length > 0) {
            query = query.in('widget_id', widgetIds.map(w => w.id));
          }
        }
        if (filters.dashboardIds && filters.dashboardIds.length > 0) {
          query = query.in('dashboard_id', filters.dashboardIds);
        }
        if (filters.userRoles && filters.userRoles.length > 0) {
          query = query.in('user_role', filters.userRoles);
        }
      }
      
      const { count, error } = await query;
      
      if (error) throw error;
      
      return { data: count, error: null };
    } catch (error) {
      console.error('Error fetching widget views count:', error);
      return { data: null, error: error as Error };
    }
  }
  
  /**
   * Get widget interactions count with optional filtering
   */
  async getWidgetInteractionsCount(filters?: AnalyticsFilters): Promise<{ data: number | null; error: Error | null }> {
    try {
      const supabase = this.getClient();
      
      let query = supabase
        .from('widget_analytics')
        .select('count(*)', { count: 'exact' })
        .neq('action', 'view'); // All non-view actions are interactions
        
      if (filters) {
        if (filters.from) query = query.gte('timestamp', new Date(filters.from).getTime());
        if (filters.to) query = query.lte('timestamp', new Date(filters.to).getTime());
        if (filters.widgetTypes && filters.widgetTypes.length > 0) {
          // Need to join with widgets table to filter by type
          const { data: widgetIds } = await supabase
            .from('widgets')
            .select('id')
            .in('widget_type', filters.widgetTypes);
            
          if (widgetIds && widgetIds.length > 0) {
            query = query.in('widget_id', widgetIds.map(w => w.id));
          }
        }
        if (filters.dashboardIds && filters.dashboardIds.length > 0) {
          query = query.in('dashboard_id', filters.dashboardIds);
        }
        if (filters.userRoles && filters.userRoles.length > 0) {
          query = query.in('user_role', filters.userRoles);
        }
      }
      
      const { count, error } = await query;
      
      if (error) throw error;
      
      return { data: count, error: null };
    } catch (error) {
      console.error('Error fetching widget interactions count:', error);
      return { data: null, error: error as Error };
    }
  }
  
  /**
   * Get the interaction distribution by type
   */
  async getInteractionTypeDistribution(filters?: AnalyticsFilters): Promise<{ data: any; error: Error | null }> {
    try {
      const supabase = this.getClient();
      
      let query = supabase
        .from('widget_analytics')
        .select('action, count(*)')
        .neq('action', 'view')
        .groupBy('action');
        
      if (filters) {
        if (filters.from) query = query.gte('timestamp', new Date(filters.from).getTime());
        if (filters.to) query = query.lte('timestamp', new Date(filters.to).getTime());
        if (filters.widgetTypes && filters.widgetTypes.length > 0) {
          query = query.in('widget_id', 
            supabase
              .from('widgets')
              .select('id')
              .in('widget_type', filters.widgetTypes)
          );
        }
        if (filters.dashboardIds && filters.dashboardIds.length > 0) {
          query = query.in('dashboard_id', filters.dashboardIds);
        }
        if (filters.userRoles && filters.userRoles.length > 0) {
          query = query.in('user_role', filters.userRoles);
        }
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Transform data for pie chart
      const pieData = data.map((item: any) => ({
        name: item.action,
        value: parseInt(item.count),
        // Assign colors based on action type
        color: this.getColorForInteractionType(item.action)
      }));
      
      return { data: pieData, error: null };
    } catch (error) {
      console.error('Error fetching interaction type distribution:', error);
      return { data: [], error: error as Error };
    }
  }
  
  /**
   * Get widget interactions by timeframe
   */
  async getWidgetInteractionsByTimeframe(
    timeframe: 'day' | 'week' | 'month' = 'day',
    filters?: AnalyticsFilters
  ): Promise<{ data: any; error: Error | null }> {
    try {
      const supabase = this.getClient();
      
      let query = supabase
        .from('widget_analytics')
        .select('action, timestamp');
        
      if (filters) {
        if (filters.from) query = query.gte('timestamp', new Date(filters.from).getTime());
        if (filters.to) query = query.lte('timestamp', new Date(filters.to).getTime());
        if (filters.widgetTypes && filters.widgetTypes.length > 0) {
          query = query.in('widget_id', 
            supabase
              .from('widgets')
              .select('id')
              .in('widget_type', filters.widgetTypes)
          );
        }
        if (filters.dashboardIds && filters.dashboardIds.length > 0) {
          query = query.in('dashboard_id', filters.dashboardIds);
        }
        if (filters.userRoles && filters.userRoles.length > 0) {
          query = query.in('user_role', filters.userRoles);
        }
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Process and group data by timeframe
      const result = this.processTimeframeData(data, timeframe, filters?.from, filters?.to);
      
      return { data: result, error: null };
    } catch (error) {
      console.error('Error fetching widget interactions by timeframe:', error);
      return { data: [], error: error as Error };
    }
  }
  
  /**
   * Get top widgets by usage
   */
  async getTopWidgets(
    limit: number = 10,
    metric: 'views' | 'interactions' | 'interactionRate' = 'views',
    filters?: AnalyticsFilters
  ): Promise<{ data: any; error: Error | null }> {
    try {
      const supabase = this.getClient();
      
      // This is a more complex query that requires joining tables and aggregating data
      // First, get the basic widget data
      const { data: widgets, error: widgetsError } = await supabase
        .from('widgets')
        .select('id, name, widget_type');
        
      if (widgetsError) throw widgetsError;
      
      // For each widget, get its analytics data
      const widgetAnalytics = await Promise.all(
        widgets.map(async (widget) => {
          const viewsQuery = supabase
            .from('widget_analytics')
            .select('count(*)', { count: 'exact' })
            .eq('widget_id', widget.id)
            .eq('action', 'view');
            
          const interactionsQuery = supabase
            .from('widget_analytics')
            .select('count(*)', { count: 'exact' })
            .eq('widget_id', widget.id)
            .neq('action', 'view');
            
          // Apply filters to both queries
          if (filters) {
            if (filters.from) {
              viewsQuery.gte('timestamp', new Date(filters.from).getTime());
              interactionsQuery.gte('timestamp', new Date(filters.from).getTime());
            }
            if (filters.to) {
              viewsQuery.lte('timestamp', new Date(filters.to).getTime());
              interactionsQuery.lte('timestamp', new Date(filters.to).getTime());
            }
            if (filters.dashboardIds && filters.dashboardIds.length > 0) {
              viewsQuery.in('dashboard_id', filters.dashboardIds);
              interactionsQuery.in('dashboard_id', filters.dashboardIds);
            }
            if (filters.userRoles && filters.userRoles.length > 0) {
              viewsQuery.in('user_role', filters.userRoles);
              interactionsQuery.in('user_role', filters.userRoles);
            }
          }
          
          const [viewsResult, interactionsResult] = await Promise.all([
            viewsQuery,
            interactionsQuery
          ]);
          
          const views = viewsResult.count || 0;
          const interactions = interactionsResult.count || 0;
          
          return {
            id: widget.id,
            name: widget.name,
            type: widget.widget_type,
            views,
            interactions,
            interactionRate: views > 0 ? interactions / views : 0
          };
        })
      );
      
      // Sort by the chosen metric and limit results
      const sortedWidgets = widgetAnalytics
        .sort((a, b) => b[metric] - a[metric])
        .slice(0, limit);
      
      return { data: sortedWidgets, error: null };
    } catch (error) {
      console.error('Error fetching top widgets:', error);
      return { data: [], error: error as Error };
    }
  }
  
  /**
   * Get user role heat map data
   */
  async getWidgetUsageByRole(filters?: AnalyticsFilters): Promise<{ data: any; error: Error | null }> {
    try {
      const supabase = this.getClient();
      
      let query = supabase
        .from('widget_analytics')
        .select(`
          user_role,
          action,
          widgets:widget_id (id, widget_type)
        `);
        
      if (filters) {
        if (filters.from) query = query.gte('timestamp', new Date(filters.from).getTime());
        if (filters.to) query = query.lte('timestamp', new Date(filters.to).getTime());
        if (filters.widgetTypes && filters.widgetTypes.length > 0) {
          query = query.in('widgets.widget_type', filters.widgetTypes);
        }
        if (filters.dashboardIds && filters.dashboardIds.length > 0) {
          query = query.in('dashboard_id', filters.dashboardIds);
        }
        if (filters.userRoles && filters.userRoles.length > 0) {
          query = query.in('user_role', filters.userRoles);
        }
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Group the data by role and widget type
      const roleWidgetTypeMap: Record<string, Record<string, { 
        views: number; 
        interactions: number;
        count: number;
      }>> = {};
      
      data?.forEach(item => {
        const role = item.user_role || 'anonymous';
        const widgetType = item.widgets?.widget_type || 'unknown';
        
        if (!roleWidgetTypeMap[role]) {
          roleWidgetTypeMap[role] = {};
        }
        
        if (!roleWidgetTypeMap[role][widgetType]) {
          roleWidgetTypeMap[role][widgetType] = { views: 0, interactions: 0, count: 0 };
        }
        
        if (item.action === 'view') {
          roleWidgetTypeMap[role][widgetType].views++;
        } else {
          roleWidgetTypeMap[role][widgetType].interactions++;
        }
        
        roleWidgetTypeMap[role][widgetType].count++;
      });
      
      // Convert to array format for the heat map
      const result = Object.entries(roleWidgetTypeMap).flatMap(([role, widgetTypes]) => 
        Object.entries(widgetTypes).map(([widgetType, counts]) => ({
          role,
          widgetType,
          value: counts.count,
          views: counts.views,
          interactions: counts.interactions,
          z: 1 // Size factor for scatter plot
        }))
      );
      
      return { data: result, error: null };
    } catch (error) {
      console.error('Error fetching widget usage by role:', error);
      return { data: [], error: error as Error };
    }
  }
  
  /**
   * Get detailed analytics for a specific widget
   */
  async getWidgetDetailedAnalytics(
    widgetId: string,
    filters?: AnalyticsFilters
  ): Promise<{ data: any; error: Error | null }> {
    try {
      const supabase = this.getClient();
      
      // Get basic widget info
      const { data: widget, error: widgetError } = await supabase
        .from('widgets')
        .select('*')
        .eq('id', widgetId)
        .single();
        
      if (widgetError) throw widgetError;
      
      // Get analytics data for this widget
      let query = supabase
        .from('widget_analytics')
        .select('*')
        .eq('widget_id', widgetId);
        
      if (filters) {
        if (filters.from) query = query.gte('timestamp', new Date(filters.from).getTime());
        if (filters.to) query = query.lte('timestamp', new Date(filters.to).getTime());
        if (filters.dashboardIds && filters.dashboardIds.length > 0) {
          query = query.in('dashboard_id', filters.dashboardIds);
        }
        if (filters.userRoles && filters.userRoles.length > 0) {
          query = query.in('user_role', filters.userRoles);
        }
      }
      
      const { data: analyticsData, error: analyticsError } = await query;
      
      if (analyticsError) throw analyticsError;
      
      // Process the data into different views
      const views = analyticsData.filter((item: any) => item.action === 'view').length;
      const interactions = analyticsData.filter((item: any) => item.action !== 'view').length;
      
      // Get interaction types
      const interactionTypes = this.processInteractionTypes(analyticsData);
      
      // Get usage trend
      const usageTrend = this.processUsageTrend(analyticsData);
      
      // Get user roles
      const userRoles = this.processUserRoles(analyticsData);
      
      // Get dashboards
      const dashboards = await this.getWidgetDashboards(widgetId, analyticsData);
      
      // Get time to interaction data
      const timeToInteraction = this.processTimeToInteraction(analyticsData);
      
      return {
        data: {
          widget,
          summary: {
            views,
            interactions,
            interactionRate: views > 0 ? interactions / views : 0,
          },
          interactionTypes,
          usageTrend,
          userRoles,
          dashboards,
          timeToInteraction,
        },
        error: null
      };
    } catch (error) {
      console.error('Error fetching detailed widget analytics:', error);
      return { data: null, error: error as Error };
    }
  }
  
  /**
   * Get analytics overview for dashboard
   */
  async getAnalyticsOverview(filters?: AnalyticsFilters): Promise<{ data: any; error: Error | null }> {
    try {
      // Build cache key based on filters
      const cacheKey = `analytics_overview_${JSON.stringify(filters || {})}`;
      
      // Check cache
      const cachedResult = analyticsCache.get(cacheKey);
      if (cachedResult && (Date.now() - cachedResult.timestamp < CACHE_TTL)) {
        return { data: cachedResult.data, error: null };
      }
      
      // Calculate date for previous period
      const currentFrom = filters?.from ? new Date(filters.from) : subDays(new Date(), 30);
      const currentTo = filters?.to ? new Date(filters.to) : new Date();
      
      const previousPeriodLength = Math.ceil((currentTo.getTime() - currentFrom.getTime()) / (1000 * 60 * 60 * 24));
      const previousFrom = subDays(currentFrom, previousPeriodLength);
      const previousTo = subDays(currentTo, previousPeriodLength);
      
      // Create filter objects for current and previous periods
      const currentFilters = { ...filters };
      const previousFilters = { 
        ...filters,
        from: previousFrom.toISOString(),
        to: previousTo.toISOString()
      };
      
      // Get metrics for current period
      const [
        currentViewsResult,
        currentInteractionsResult,
        interactionTypesResult,
        topWidgetsResult,
        usageTrendResult,
        userRoleHeatMapResult
      ] = await Promise.all([
        this.getWidgetViewsCount(currentFilters),
        this.getWidgetInteractionsCount(currentFilters),
        this.getInteractionTypeDistribution(currentFilters),
        this.getTopWidgets(10, 'views', currentFilters),
        this.getWidgetInteractionsByTimeframe('day', currentFilters),
        this.getWidgetUsageByRole(currentFilters)
      ]);
      
      // Get metrics for previous period (for comparison)
      const [
        previousViewsResult,
        previousInteractionsResult
      ] = await Promise.all([
        this.getWidgetViewsCount(previousFilters),
        this.getWidgetInteractionsCount(previousFilters)
      ]);
      
      const currentViews = currentViewsResult.data || 0;
      const currentInteractions = currentInteractionsResult.data || 0;
      const previousViews = previousViewsResult.data || 0;
      const previousInteractions = previousInteractionsResult.data || 0;
      
      // Calculate change percentages
      const viewsChange = previousViews > 0 
        ? ((currentViews - previousViews) / previousViews) * 100 
        : 0;
        
      const interactionsChange = previousInteractions > 0 
        ? ((currentInteractions - previousInteractions) / previousInteractions) * 100 
        : 0;
        
      const currentInteractionRate = currentViews > 0 
        ? currentInteractions / currentViews 
        : 0;
        
      const previousInteractionRate = previousViews > 0 
        ? previousInteractions / previousViews 
        : 0;
        
      const rateChange = previousInteractionRate > 0 
        ? ((currentInteractionRate - previousInteractionRate) / previousInteractionRate) * 100 
        : 0;
      
      // Calculate average time on widget (mock data for now)
      // In a real implementation, you would calculate this from actual session data
      const avgTimeOnWidget = 45.3; // seconds
      const timeChange = 5.2; // percent
      
      // Get device engagement data (mock data)
      const deviceEngagement = [
        { name: 'Desktop', value: 68 },
        { name: 'Mobile', value: 25 },
        { name: 'Tablet', value: 7 }
      ];
      
      const result = {
        metrics: {
          totalViews: currentViews,
          totalInteractions: currentInteractions,
          interactionRate: currentInteractionRate,
          avgTimeOnWidget,
          viewsChange,
          interactionsChange,
          rateChange,
          timeChange
        },
        interactionTypes: interactionTypesResult.data || [],
        topWidgets: topWidgetsResult.data || [],
        usageTrend: usageTrendResult.data || [],
        userRoleHeatMap: userRoleHeatMapResult.data || [],
        deviceEngagement,
        widgetPerformance: topWidgetsResult.data || []
      };
      
      // Update cache
      analyticsCache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });
      
      return { data: result, error: null };
    } catch (error) {
      console.error('Error fetching analytics overview:', error);
      return { data: null, error: error as Error };
    }
  }
  
  /**
   * Export widget analytics to CSV
   */
  async exportWidgetAnalyticsCSV(
    widgetId: string,
    dateRange: { from: Date; to: Date }
  ): Promise<void> {
    try {
      const { data } = await this.getWidgetDetailedAnalytics(
        widgetId,
        {
          from: dateRange.from.toISOString(),
          to: dateRange.to.toISOString()
        }
      );
      
      if (!data) throw new Error('No data to export');
      
      // Format the data for CSV
      const csvRows = [
        // Headers
        ['Date', 'Action', 'Dashboard', 'User Role', 'Device', 'Details'].join(','),
        
        // Rows
        ...(data.analyticsData || []).map((item: any) => [
          new Date(item.timestamp).toISOString(),
          item.action,
          item.dashboard_id || 'N/A',
          item.user_role || 'anonymous',
          item.device || 'unknown',
          JSON.stringify(item.details || {}).replace(/,/g, ';') // Replace commas to avoid CSV issues
        ].join(','))
      ];
      
      const csvContent = csvRows.join('\n');
      
      // Create a blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      link.setAttribute('href', url);
      link.setAttribute('download', `widget_${widgetId}_analytics.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Error exporting widget analytics to CSV:', error);
      alert('Failed to export analytics data. Please try again.');
    }
  }
  
  // Helper methods
  
  private processTimeframeData(
    data: any[],
    timeframe: 'day' | 'week' | 'month',
    fromDate?: string,
    toDate?: string
  ) {
    const from = fromDate ? new Date(fromDate) : subDays(new Date(), 30);
    const to = toDate ? new Date(toDate) : new Date();
    
    // Generate all dates in the range
    const dateRange = eachDayOfInterval({ start: from, end: to });
    
    // Initialize result with all dates
    const result = dateRange.map(date => {
      const formattedDate = format(date, 'yyyy-MM-dd');
      return {
        date: formattedDate,
        views: 0,
        interactions: 0
      };
    });
    
    // Count events for each date
    data.forEach(item => {
      const date = new Date(item.timestamp);
      const formattedDate = format(date, 'yyyy-MM-dd');
      
      const existingEntry = result.find(entry => entry.date === formattedDate);
      if (existingEntry) {
        if (item.action === 'view') {
          existingEntry.views++;
        } else {
          existingEntry.interactions++;
        }
      }
    });
    
    return result;
  }
  
  private processInteractionTypes(data: any[]) {
    const interactions = data.filter((item: any) => item.action !== 'view');
    
    // Group by action
    const actionCounts: Record<string, number> = {};
    
    interactions.forEach(item => {
      const action = item.action;
      if (!actionCounts[action]) {
        actionCounts[action] = 0;
      }
      actionCounts[action]++;
    });
    
    // Convert to chart format
    return Object.entries(actionCounts).map(([action, count]) => ({
      name: action,
      value: count,
      color: this.getColorForInteractionType(action)
    }));
  }
  
  private processUsageTrend(data: any[]) {
    // Group by date
    const dateMap: Record<string, { views: number; interactions: number }> = {};
    
    data.forEach(item => {
      const date = format(new Date(item.timestamp), 'yyyy-MM-dd');
      
      if (!dateMap[date]) {
        dateMap[date] = { views: 0, interactions: 0 };
      }
      
      if (item.action === 'view') {
        dateMap[date].views++;
      } else {
        dateMap[date].interactions++;
      }
    });
    
    // Convert to array and sort by date
    return Object.entries(dateMap)
      .map(([date, counts]) => ({
        date,
        ...counts
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }
  
  private processUserRoles(data: any[]) {
    // Group by user role
    const roleMap: Record<string, { views: number; interactions: number }> = {};
    
    data.forEach(item => {
      const role = item.user_role || 'anonymous';
      
      if (!roleMap[role]) {
        roleMap[role] = { views: 0, interactions: 0 };
      }
      
      if (item.action === 'view') {
        roleMap[role].views++;
      } else {
        roleMap[role].interactions++;
      }
    });
    
    // Convert to array
    return Object.entries(roleMap)
      .map(([role, counts]) => ({
        role,
        ...counts
      }));
  }
  
  private async getWidgetDashboards(widgetId: string, analyticsData: any[]) {
    try {
      const supabase = this.getClient();
      
      // Extract unique dashboard IDs
      const dashboardIds = Array.from(new Set(
        analyticsData
          .filter((item: any) => item.dashboard_id)
          .map((item: any) => item.dashboard_id)
      ));
      
      if (dashboardIds.length === 0) return [];
      
      // Get dashboard details
      const { data: dashboards, error } = await supabase
        .from('dashboards')
        .select('id, name')
        .in('id', dashboardIds);
        
      if (error) throw error;
      
      // Count views and interactions per dashboard
      return dashboards.map(dashboard => {
        const dashboardAnalytics = analyticsData.filter(
          (item: any) => item.dashboard_id === dashboard.id
        );
        
        const views = dashboardAnalytics.filter(
          (item: any) => item.action === 'view'
        ).length;
        
        const interactions = dashboardAnalytics.filter(
          (item: any) => item.action !== 'view'
        ).length;
        
        return {
          ...dashboard,
          views,
          interactions
        };
      });
    } catch (error) {
      console.error('Error fetching widget dashboards:', error);
      return [];
    }
  }
  
  private processTimeToInteraction(data: any[]) {
    // Group analytics by session
    const sessionMap: Record<string, { views: any[]; interactions: any[] }> = {};
    
    data.forEach(item => {
      const sessionId = item.session_id || `${item.user_id || 'anonymous'}-${format(new Date(item.timestamp), 'yyyyMMdd-HHmm')}`;
      
      if (!sessionMap[sessionId]) {
        sessionMap[sessionId] = { views: [], interactions: [] };
      }
      
      if (item.action === 'view') {
        sessionMap[sessionId].views.push(item);
      } else {
        sessionMap[sessionId].interactions.push(item);
      }
    });
    
    // Calculate time between view and first interaction
    const timeToInteract: number[] = [];
    
    Object.values(sessionMap).forEach(session => {
      if (session.views.length > 0 && session.interactions.length > 0) {
        // Find first view and first interaction
        const firstView = session.views.reduce((earliest, current) => 
          earliest.timestamp < current.timestamp ? earliest : current
        );
        
        const firstInteraction = session.interactions.reduce((earliest, current) => 
          earliest.timestamp < current.timestamp ? earliest : current
        );
        
        // Only count if interaction came after view
        if (firstInteraction.timestamp > firstView.timestamp) {
          const seconds = (firstInteraction.timestamp - firstView.timestamp) / 1000;
          timeToInteract.push(seconds);
        }
      }
    });
    
    // Create time range buckets for histogram
    const ranges = [
      { range: '0-5s', min: 0, max: 5, count: 0 },
      { range: '5-15s', min: 5, max: 15, count: 0 },
      { range: '15-30s', min: 15, max: 30, count: 0 },
      { range: '30-60s', min: 30, max: 60, count: 0 },
      { range: '1-3m', min: 60, max: 180, count: 0 },
      { range: '3-5m', min: 180, max: 300, count: 0 },
      { range: '5m+', min: 300, max: Infinity, count: 0 }
    ];
    
    // Count interactions in each range
    timeToInteract.forEach(seconds => {
      const range = ranges.find(r => seconds >= r.min && seconds < r.max);
      if (range) {
        range.count++;
      }
    });
    
    return ranges;
  }
  
  private getColorForInteractionType(action: string): string {
    const colorMap: Record<string, string> = {
      'click': '#8884D8',
      'submit': '#82CA9D',
      'download': '#FFBB28',
      'play': '#FF8042',
      'pause': '#0088FE',
      'expand': '#00C49F',
      'like': '#FF6B6B',
      'share': '#6A7FDB'
    };
    
    return colorMap[action] || `#${Math.floor(Math.random()*16777215).toString(16)}`;
  }
}

// Export a singleton instance
export const analyticsService = new AnalyticsService(); 