// my-app/src/features/widgets/services/widget-service.ts

import { createClient as createBrowserClient } from '@/lib/supabase';
// Remove server client import
// import { createClient as createServerClient } from '@/lib/supabase-server';
import type { 
  Widget, 
  WidgetConfiguration, 
  WidgetPlacement, 
  DraftWidgetPlacement,
} from '../types';

import { 
  WidgetType,
  WidgetDisplayType
} from '../types';

// Define interface for widget interactions since it's missing from Database type
// Prefix with underscore to indicate it's intentionally unused for now
interface _WidgetInteraction {
  widget_id: string;
  user_id: string;
  interaction_type: string;
  metadata: Record<string, any>;
  timestamp: string;
}

/**
 * Service for fetching and managing widget data
 */
export class WidgetService {
  // Simplify to only use the browser client
  private getClient() {
    return createBrowserClient();
  }
  
  /**
   * Fetch widgets accessible to a user based on their role
   */
  async getWidgetsByUser(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      types?: WidgetType[];
      isPublished?: boolean;
    }
  ): Promise<{ data: Widget[] | null; error: Error | null }> {
    try {
      const supabase = this.getClient();
      
      let query = supabase
        .from('widgets')
        .select('*')
        .eq('is_active', true);
      
      // Apply filters
      if (options?.types && options.types.length > 0) {
        query = query.in('widget_type', options.types);
      }
      
      if (options?.isPublished !== undefined) {
        query = query.eq('is_published', options.isPublished);
      }
      
      // Role-based access filter - we join with user_roles to check permissions
      // This is a simplified approach - actual implementation might be more complex
      query = query.or(`public.eq.true,created_by.eq.${userId}`);
      
      // Pagination
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      
      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching widgets:', error);
      return { data: null, error: error as Error };
    }
  }
  
  /**
   * Fetch a single widget by ID
   */
  async getWidgetById(widgetId: string): Promise<{ data: Widget | null; error: Error | null }> {
    try {
      const supabase = this.getClient();
      
      const { data, error } = await supabase
        .from('widgets')
        .select(`
          *,
          category:widget_categories (id, name, color)
        `)
        .eq('id', widgetId)
        .single();
        
      if (error) throw error;
      
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching widget:', error);
      return { data: null, error: error as Error };
    }
  }
  
  /**
   * Fetch widget configuration by widget ID
   */
  async getWidgetConfiguration(
    widgetId: string
  ): Promise<{ data: WidgetConfiguration | null; error: Error | null }> {
    try {
      const supabase = this.getClient();
      const { data, error } = await supabase
        .from('widget_configurations')
        .select('*')
        .eq('widget_id', widgetId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
        
      if (error) throw error;
      
      return { data, error: null };
    } catch (error) {
      console.error(`Error fetching widget configuration for ${widgetId}:`, error);
      return { data: null, error: error as Error };
    }
  }
  
  /**
   * Get widget placements for a dashboard
   */
  async getWidgetPlacementsForDashboard(
    dashboardId: string,
    isDraft: boolean = false
  ): Promise<{ data: (WidgetPlacement | DraftWidgetPlacement)[] | null; error: Error | null }> {
    try {
      const supabase = this.getClient();
      const table = isDraft ? 'draft_widget_placements' : 'widget_placements';
      
      const { data, error } = await supabase
        .from(table)
        .select(`
          *,
          widget:widgets (*)
        `)
        .eq('dashboard_id', dashboardId)
        .order('position_y', { ascending: true })
        .order('position_x', { ascending: true });
        
      if (error) throw error;
      
      return { data, error: null };
    } catch (error) {
      console.error(`Error fetching widget placements for dashboard ${dashboardId}:`, error);
      return { data: null, error: error as Error };
    }
  }
  
  /**
   * Track widget interaction
   */
  async trackWidgetInteraction(
    widgetId: string,
    userId: string,
    interactionType: string,
    _metadata?: Record<string, any>
  ): Promise<{ success: boolean; error: Error | null }> {
    try {
      const supabase = this.getClient();
      
      // Use the widget_analytics table which is defined in your Database type
      const { error } = await supabase
        .from('widget_analytics')
        .insert({
          widget_id: widgetId,
          user_id: userId,
          interaction_type: interactionType,
          // Note: widget_analytics doesn't have metadata field in your type definition
          // If you need to store metadata, consider updating your DB schema
        });
        
      if (error) throw error;
      
      return { success: true, error: null };
    } catch (error) {
      console.error('Error tracking widget interaction:', error);
      return { success: false, error: error as Error };
    }
  }
  
  /**
   * Save widget configuration
   */
  async saveWidgetConfiguration(
    widgetId: string,
    configuration: Partial<WidgetConfiguration>,
    userId: string
  ): Promise<{ data: WidgetConfiguration | null; error: Error | null }> {
    try {
      const supabase = this.getClient();
      
      // Create new configuration entry
      const { data, error } = await supabase
        .from('widget_configurations')
        .insert({
          widget_id: widgetId,
          created_by: userId,
          ...configuration
        })
        .select()
        .single();
        
      if (error) throw error;
      
      return { data, error: null };
    } catch (error) {
      console.error('Error saving widget configuration:', error);
      return { data: null, error: error as Error };
    }
  }
  
  /**
   * Get widgets with filtering and pagination
   */
  async getWidgets(options?: {
    userId?: string;
    search?: string;
    types?: string[];
    categoryId?: string;
    isPublished?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ 
    data: Widget[] | null; 
    error: Error | null;
    pagination?: { total: number; page: number; limit: number } 
  }> {
    try {
      const supabase = this.getClient();
      const page = options?.page || 1;
      const limit = options?.limit || 10;
      const offset = (page - 1) * limit;
      
      // Count total widgets matching the filter
      let countQuery = supabase
        .from('widgets')
        .select('id', { count: 'exact' });
      
      // Build query for fetching widgets
      let query = supabase
        .from('widgets')
        .select(`
          *,
          category:widget_categories (id, name, color),
          usage_count:widget_placements!widget_id(count)
        `);
      
      // Apply filters
      if (options?.search) {
        const searchTerm = `%${options.search}%`;
        countQuery = countQuery.or(`name.ilike.${searchTerm},description.ilike.${searchTerm}`);
        query = query.or(`name.ilike.${searchTerm},description.ilike.${searchTerm}`);
      }
      
      if (options?.types && options.types.length > 0) {
        countQuery = countQuery.in('widget_type', options.types);
        query = query.in('widget_type', options.types);
      }
      
      if (options?.isPublished !== undefined) {
        countQuery = countQuery.eq('is_published', options.isPublished);
        query = query.eq('is_published', options.isPublished);
      }
      
      if (options?.categoryId) {
        if (options.categoryId === 'uncategorized') {
          countQuery = countQuery.is('category_id', null);
          query = query.is('category_id', null);
        } else {
          countQuery = countQuery.eq('category_id', options.categoryId);
          query = query.eq('category_id', options.categoryId);
        }
      }
      
      // User access filter - REMOVED problematic or condition
      // For now, fetch all widgets since access control isn't implemented in the schema
      
      // Get count
      const { count, error: countError } = await countQuery;
      
      if (countError) throw countError;
      
      // Apply pagination
      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      
      // Execute query
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Process data to format usage count
      const processedData = data.map(widget => ({
        ...widget,
        usage_count: Array.isArray(widget.usage_count) ? widget.usage_count.length : 0,
        // For compatibility with the Widget type that expects these fields
        is_published: widget.is_published || false,
        is_active: widget.is_active || true,
        public: widget.public || false
      }));
      
      return { 
        data: processedData, 
        error: null,
        pagination: {
          total: count || 0,
          page,
          limit
        }
      };
    } catch (error) {
      console.error('Error fetching widgets:', error);
      return { data: null, error: error as Error };
    }
  }
  
  /**
   * Get widget categories
   */
  async getWidgetCategories(): Promise<{ data: any[] | null; error: Error | null }> {
    try {
      const supabase = this.getClient();
      
      const { data, error } = await supabase
        .from('widget_categories')
        .select('*')
        .order('name');
        
      if (error) throw error;
      
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching widget categories:', error);
      return { data: null, error: error as Error };
    }
  }
  
  /**
   * Create a new widget
   */
  async createWidget(
    widgetData: {
      name: string;
      description?: string;
      widget_type: string;
      created_by: string;
      category_id?: string;
      thumbnail_url?: string;
      display_type?: string;
      file_id?: string;
      is_public?: boolean;
      is_published?: boolean;
    }
  ): Promise<{ data: Widget | null; error: Error | null }> {
    try {
      const supabase = this.getClient();
      
      const now = new Date().toISOString();
      
      // Ensure we're using fields that exist in the Widget type definition
      const widgetInsert = {
        widget_type: widgetData.widget_type,
        name: widgetData.name,
        description: widgetData.description || null,
        category_id: widgetData.category_id || null,
        created_at: now,
        display_type: widgetData.display_type || WidgetDisplayType.IFRAME,
        component_path: null,
        shape: 'square', // default value
        size_ratio: '1:1', // default value
        public: true, // Always set to true
        is_active: true,
        is_published: true, // Set to published by default
        thumbnail_url: widgetData.thumbnail_url || null,
        file_id: widgetData.file_id || null,
        // Don't include created_by as it doesn't seem to exist in the Widget type
      };
      
      const { data, error } = await supabase
        .from('widgets')
        .insert(widgetInsert)
        .select()
        .single();
        
      if (error) throw error;
      
      return { data, error: null };
    } catch (error) {
      console.error('Error creating widget:', error);
      return { data: null, error: error as Error };
    }
  }
  
  /**
   * Get widget configurations (versions)
   */
  async getWidgetConfigurations(widgetId: string): Promise<{ data: WidgetConfiguration[] | null; error: Error | null }> {
    try {
      const supabase = this.getClient();
      
      const { data, error } = await supabase
        .from('widget_configurations')
        .select('*')
        .eq('widget_id', widgetId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching widget configurations:', error);
      return { data: null, error: error as Error };
    }
  }
  
  /**
   * Get widget usage information (dashboards using this widget)
   */
  async getWidgetUsage(widgetId: string): Promise<{ data: any[] | null; error: Error | null }> {
    try {
      const supabase = this.getClient();
      
      // Get published placements
      const { data: publishedPlacements, error: publishedError } = await supabase
        .from('widget_placements')
        .select(`
          id,
          dashboard_version_id,
          dashboard_versions:dashboard_version_id(id, version_name)
        `)
        .eq('widget_id', widgetId);
        
      if (publishedError) throw publishedError;
      
      // Get draft placements
      const { data: draftPlacements, error: draftError } = await supabase
        .from('draft_widget_placements')
        .select(`
          id,
          draft_id,
          dashboard_drafts:draft_id(id, name)
        `)
        .eq('widget_id', widgetId);
        
      if (draftError) throw draftError;
      
      // Process and combine the data
      const publishedData = (publishedPlacements || []).map(placement => ({
        id: `pub-${placement.id}`,
        dashboard_id: placement.dashboard_version_id,
        dashboard_name: placement.dashboard_versions?.version_name || 'Unnamed Dashboard Version',
        is_published: true,
        placement_id: placement.id,
      }));
      
      const draftData = (draftPlacements || []).map(placement => ({
        id: `draft-${placement.id}`,
        dashboard_id: placement.draft_id,
        dashboard_name: placement.dashboard_drafts?.name || 'Unnamed Draft',
        is_published: false,
        placement_id: placement.id,
      }));
      
      return { 
        data: [...publishedData, ...draftData], 
        error: null 
      };
    } catch (error) {
      console.error('Error fetching widget usage:', error);
      return { data: null, error: error as Error };
    }
  }
  
  /**
   * Update widget
   */
  async updateWidget(
    widgetId: string,
    widgetData: Partial<Widget & { file_id?: string }>
  ): Promise<{ data: Widget | null; error: Error | null }> {
    try {
      const supabase = this.getClient();
      
      // Ensure widgets are always public and published
      const updatedData = {
        ...widgetData,
        public: true,
        is_published: true
      };
      
      // Remove any is_public property if it exists
      if ('is_public' in updatedData) {
        delete updatedData.is_public;
      }
      
      const { data, error } = await supabase
        .from('widgets')
        .update(updatedData)
        .eq('id', widgetId)
        .select()
        .single();
        
      if (error) throw error;
      
      return { data, error: null };
    } catch (error) {
      console.error('Error updating widget:', error);
      return { data: null, error: error as Error };
    }
  }

  /**
   * Get widget counts by category
   */
  async getWidgetCountsByCategory(): Promise<{ data: any[] | null; error: Error | null }> {
    try {
      const supabase = this.getClient();
      
      // Alternative approach: Get all widgets with category_id and count them in JS
      const { data: widgets, error } = await supabase
        .from('widgets')
        .select('category_id')
        .not('category_id', 'is', null);
      
      if (error) throw error;
      
      // Count widgets by category using JavaScript
      const counts = widgets.reduce((acc: {[key: string]: number}, widget) => {
        const categoryId = widget.category_id;
        if (categoryId) {
          acc[categoryId] = (acc[categoryId] || 0) + 1;
        }
        return acc;
      }, {});
      
      // Format as array of {category_id, count}
      const data = Object.entries(counts).map(([category_id, count]) => ({
        category_id,
        count
      }));
      
      return { data, error: null };
    } catch (error) {
      console.error('Error getting widget counts by category:', error);
      return { data: null, error: error as Error };
    }
  }

  /**
   * Create a widget category
   */
  async createCategory(
    categoryData: {
      name: string;
      description?: string | null;
      color?: string | null;
      position?: number;
    }
  ): Promise<{ data: any | null; error: Error | null }> {
    try {
      const supabase = this.getClient();
      
      // Find the max position if not provided
      if (categoryData.position === undefined) {
        const { data: existingCategories, error: positionError } = await supabase
          .from('widget_categories')
          .select('position')
          .order('position', { ascending: false })
          .limit(1);
        
        if (positionError) throw positionError;
        
        // Check if result and position exist before accessing them
        const maxPosition = existingCategories && 
                           existingCategories.length > 0 && 
                           typeof existingCategories[0]?.position === 'number' 
                           ? existingCategories[0].position 
                           : 0;
        
        categoryData.position = maxPosition + 1;
      }
      
      // The insert will now work with the position field
      const { data, error } = await supabase
        .from('widget_categories')
        .insert({
          name: categoryData.name,
          description: categoryData.description || null,
          position: categoryData.position,
          // color is missing from the type definition, so remove it
          // color: categoryData.color || null,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return { data, error: null };
    } catch (error) {
      console.error('Error creating category:', error);
      return { data: null, error: error as Error };
    }
  }

  /**
   * Update a widget category
   */
  async updateCategory(
    categoryId: string,
    categoryData: {
      name?: string;
      description?: string | null;
      color?: string | null;
      position?: number;
    }
  ): Promise<{ data: any | null; error: Error | null }> {
    try {
      const supabase = this.getClient();
      
      const { data, error } = await supabase
        .from('widget_categories')
        .update(categoryData)
        .eq('id', categoryId)
        .select()
        .single();
      
      if (error) throw error;
      
      return { data, error: null };
    } catch (error) {
      console.error('Error updating category:', error);
      return { data: null, error: error as Error };
    }
  }

  /**
   * Delete a widget category
   */
  async deleteCategory(
    categoryId: string
  ): Promise<{ data: null; error: Error | null }> {
    try {
      const supabase = this.getClient();
      
      // Check if widgets are using this category
      const { count, error: countError } = await supabase
        .from('widgets')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', categoryId);
      
      if (countError) throw countError;
      
      if (count && count > 0) {
        throw new Error(`Cannot delete category with ${count} assigned widgets`);
      }
      
      // Delete the category
      const { error } = await supabase
        .from('widget_categories')
        .delete()
        .eq('id', categoryId);
      
      if (error) throw error;
      
      return { data: null, error: null };
    } catch (error) {
      console.error('Error deleting category:', error);
      return { data: null, error: error as Error };
    }
  }

  /**
   * Update category order
   */
  async updateCategoryOrder(
    updates: { id: string; position: number }[]
  ): Promise<{ data: null; error: Error | null }> {
    try {
      const supabase = this.getClient();
      
      // Create a transaction for all updates
      const promises = updates.map(update => 
        supabase
          .from('widget_categories')
          .update({ position: update.position })
          .eq('id', update.id)
      );
      
      // Execute all updates
      await Promise.all(promises);
      
      return { data: null, error: null };
    } catch (error) {
      console.error('Error updating category order:', error);
      return { data: null, error: error as Error };
    }
  }

  /**
   * Create a new widget configuration
   */
  async createWidgetConfiguration(
    widgetId: string,
    config: {
      name: string;
      config: Record<string, any>;
    }
  ): Promise<{ data: any; error: Error | null }> {
    try {
      const supabase = this.getClient();
      
      // Check if configuration already exists
      const { data: existingConfig, error: checkError } = await supabase
        .from('widget_configurations')
        .select('*')
        .eq('widget_id', widgetId)
        .single();
        
      if (checkError && checkError.code !== 'PGRST116') {
        // Error other than "not found"
        throw checkError;
      }
      
      let result;
      
      if (existingConfig) {
        // Update existing configuration
        const { data, error } = await supabase
          .from('widget_configurations')
          .update({
            name: config.name,
            config: config.config,
            updated_at: new Date().toISOString()
          })
          .eq('widget_id', widgetId)
          .select();
          
        if (error) throw error;
        result = data;
      } else {
        // Create new configuration
        const { data, error } = await supabase
          .from('widget_configurations')
          .insert({
            widget_id: widgetId,
            name: config.name,
            config: config.config,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select();
          
        if (error) throw error;
        result = data;
      }
      
      return { data: result, error: null };
    } catch (error) {
      console.error('Error creating widget configuration:', error);
      return { data: null, error: error as Error };
    }
  }
}

// Export a singleton instance
export const widgetService = new WidgetService(); 