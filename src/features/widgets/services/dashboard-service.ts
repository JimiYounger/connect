// my-app/src/features/widgets/services/dashboard-service.ts

import { createClient as createBrowserClient } from '@/lib/supabase';
import type { 
  DraftWidgetPlacement,
  WidgetPlacement
} from '../types';
import { v4 as _uuidv4 } from 'uuid';

/**
 * Interface for dashboard data
 */
interface Dashboard {
  id: string;
  name: string;
  description?: string;
  is_published: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_default: boolean;
  role_access?: string[];
}

/**
 * Interface for dashboard version data
 */
interface DashboardVersion {
  id: string;
  dashboard_id: string;
  version_number: number;
  created_by: string;
  created_at: string;
  is_active: boolean;
  name?: string;
  description?: string;
}

/**
 * Interface for dashboard draft data
 */
interface DashboardDraft {
  id: string;
  dashboard_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  name?: string;
  description?: string;
}

/**
 * Service for managing dashboard layouts and configurations
 */
export class DashboardService {
  /**
   * Get the Supabase client with current auth session
   */
  private getClient() {
    // Make sure to get a client with the current session
    return createBrowserClient();
  }
  
  /**
   * Fetch dashboards accessible to a user based on their role
   */
  async getDashboardsByUser(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      isPublished?: boolean;
      roleIds?: string[];
    }
  ): Promise<{ data: Dashboard[] | null; error: Error | null }> {
    try {
      const supabase = this.getClient();
      
      // Query the actual dashboards table, not dashboard_drafts
      let query = supabase
        .from('dashboards')
        .select('*');
      
      // Apply filters
      if (options?.isPublished !== undefined) {
        query = query.eq('is_active', options.isPublished); // Use is_active from schema
      }
      
      // Role-based access filter
      if (options?.roleIds && options.roleIds.length > 0) {
        // Match dashboards where role_type is in the user's roles, or created by the user
        query = query.or(`role_type.in.(${options.roleIds.join(',')}),created_by.eq.${userId}`);
      } else {
        // If no roles specified, only show dashboards created by the user
        query = query.eq('created_by', userId);
      }
      
      // Pagination
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      
      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Transform the data to match the Dashboard interface
      const dashboards: Dashboard[] = data.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description || '',
        is_published: item.is_active || false, // Map is_active to is_published
        created_by: item.created_by || '',
        created_at: item.created_at || new Date().toISOString(),
        updated_at: item.updated_at || new Date().toISOString(),
        is_default: false, // Default value since it might not exist in the schema
        role_access: item.role_type ? [item.role_type] : [] // Use role_type field from schema
      }));
      
      return { data: dashboards, error: null };
    } catch (error) {
      console.error('Error fetching dashboards:', error);
      return { data: null, error: error as Error };
    }
  }
  
  /**
   * Fetch a single dashboard by ID
   */
  async getDashboardById(
    dashboardId: string
  ): Promise<{ data: Dashboard | null; error: Error | null }> {
    try {
      if (!dashboardId || dashboardId.trim() === '') {
        return { data: null, error: new Error('Invalid dashboard ID') };
      }
      
      const supabase = this.getClient();
      console.log(`Fetching dashboard with ID: ${dashboardId}`);
      
      // Use dashboards table (not dashboard_drafts)
      const { data, error } = await supabase
        .from('dashboards')  // Changed from dashboard_drafts
        .select('*')
        .eq('id', dashboardId)
        .single();
        
      if (error) {
        console.error('Error fetching dashboard:', error);
        throw error;
      }
      
      if (!data) {
        throw new Error(`Dashboard not found: ${dashboardId}`);
      }
      
      // Transform the data to match the Dashboard interface
      const dashboard: Dashboard = {
        id: data.id,
        name: data.name,
        description: data.description || '',
        is_published: data.is_active || false,
        created_by: data.created_by || '',
        created_at: data.created_at || new Date().toISOString(),
        updated_at: data.updated_at || new Date().toISOString(),
        is_default: false,
        role_access: [data.role_type] 
      };
        
      return { data: dashboard, error: null };
    } catch (error) {
      console.error(`Error fetching dashboard ${dashboardId}:`, error);
      return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
    }
  }
  
  /**
   * Create a new dashboard
   */
  async createDashboard(
    dashboard: Partial<Dashboard>,
    userId: string
  ): Promise<{ data: Dashboard | null; error: Error | null }> {
    try {
      const supabase = this.getClient();
      
      // Get the role type from the role_access array if it exists
      const role_type = dashboard.role_access && dashboard.role_access.length > 0 
        ? dashboard.role_access[0] 
        : 'user'; // Default role type
      
      // Create dashboard object with proper field names to match database schema
      const dashboardToCreate = {
        name: dashboard.name || 'Untitled Dashboard',
        description: dashboard.description || '',
        created_by: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true,  // This field exists in the DB schema instead of is_published
        role_type: role_type, // This is the required field according to the error
      };
      
      console.log('Creating dashboard with data:', dashboardToCreate);
      
      const { data, error } = await supabase
        .from('dashboards')
        .insert(dashboardToCreate)
        .select('*')
        .single();
      
      if (error) {
        console.error('Supabase insert error:', error);
        throw new Error(error.message || 'Failed to create dashboard');
      }
      
      // Map the database schema to your Dashboard interface
      if (data) {
        // Convert DB schema to your Dashboard interface
        const dashboard: Dashboard = {
          id: data.id,
          name: data.name,
          description: data.description || '',
          is_published: data.is_active || false,  // Map from is_active to is_published
          created_by: data.created_by || '',
          created_at: data.created_at || new Date().toISOString(),
          updated_at: data.updated_at || new Date().toISOString(),
          is_default: false,
          role_access: [data.role_type]  // Convert role_type to role_access array
        };
        
        // Create an initial draft for this dashboard
        await this.createDraft(data.id, userId);
        
        return { data: dashboard, error: null };
      }
      
      return { data: null, error: new Error('Failed to create dashboard - no data returned') };
    } catch (error) {
      console.error('Error in createDashboard:', error);
      return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
    }
  }
  
  /**
   * Update a dashboard
   */
  async updateDashboard(
    dashboardId: string,
    updates: Partial<Dashboard>
  ): Promise<{ data: Dashboard | null; error: Error | null }> {
    try {
      const supabase = this.getClient();
      
      // Prepare updates for the dashboard_drafts table
      const draftUpdates: any = {
        updated_at: new Date().toISOString()
      };
      
      if (updates.name) draftUpdates.name = updates.name;
      if (updates.description) draftUpdates.description = updates.description;
      
      const { data, error } = await supabase
        .from('dashboard_drafts')
        .update(draftUpdates)
        .eq('id', dashboardId)
        .select()
        .single();
        
      if (error) throw error;
      
      // Transform the data to match the Dashboard interface
      const updatedDashboard: Dashboard = {
        id: data.id,
        name: data.name,
        description: '',
        is_published: updates.is_published || false,
        created_by: data.created_by || '',
        created_at: data.created_at || new Date().toISOString(),
        updated_at: data.updated_at || new Date().toISOString(),
        is_default: updates.is_default || false,
        role_access: [] // Remove reference to data.role_type
      };
      
      return { data: updatedDashboard, error: null };
    } catch (error) {
      console.error(`Error updating dashboard ${dashboardId}:`, error);
      return { data: null, error: error as Error };
    }
  }
  
  /**
   * Delete a dashboard
   */
  async deleteDashboard(
    dashboardId: string
  ): Promise<{ error: Error | null }> {
    try {
      const supabase = this.getClient();
      
      // Delete the dashboard
      const { error } = await supabase
        .from('dashboard_drafts')
        .delete()
        .eq('id', dashboardId);
        
      if (error) throw error;
      
      return { error: null };
    } catch (error) {
      console.error(`Error deleting dashboard ${dashboardId}:`, error);
      return { error: error as Error };
    }
  }
  
  /**
   * Get drafts for a dashboard
   */
  async getDraftsForDashboard(
    dashboardId: string
  ): Promise<{ data: DashboardDraft[] | null; error: Error | null }> {
    try {
      const supabase = this.getClient();
      
      const { data, error } = await supabase
        .from('dashboard_drafts')
        .select('*')
        .eq('dashboard_id', dashboardId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      return { data: data as DashboardDraft[], error: null };
    } catch (error) {
      console.error(`Error fetching drafts for dashboard ${dashboardId}:`, error);
      return { data: null, error: error as Error };
    }
  }
  
  /**
   * Get latest draft for a dashboard
   */
  async getLatestDraftForDashboard(
    dashboardId: string
  ): Promise<{ data: DashboardDraft | null; error: Error | null }> {
    try {
      if (!dashboardId || dashboardId.trim() === '') {
        return { data: null, error: new Error('Invalid dashboard ID') };
      }
      
      const supabase = this.getClient();
      
      // First verify the dashboard exists
      const { data: _dashboardExists, error: dashboardError } = await supabase
        .from('dashboards')
        .select('id')
        .eq('id', dashboardId)
        .single();
        
      if (dashboardError) {
        console.error('Error checking dashboard existence:', dashboardError);
        return { data: null, error: new Error(`Dashboard not found: ${dashboardId}`) };
      }
      
      // Now look for drafts
      const { data, error } = await supabase
        .from('dashboard_drafts')
        .select('*')
        .eq('dashboard_id', dashboardId)
        .eq('is_current', true)
        .maybeSingle(); // Use maybeSingle instead of single
        
      if (error) {
        console.error(`Error fetching draft for dashboard ${dashboardId}:`, error);
        return { data: null, error: new Error(`Failed to fetch draft: ${error.message}`) };
      }
      
      return { data: data as DashboardDraft, error: null };
    } catch (error) {
      console.error(`Error fetching draft for dashboard ${dashboardId}:`, error);
      return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
    }
  }
  
  /**
   * Backward compatibility alias for getLatestDraftForDashboard
   * @deprecated Use getLatestDraftForDashboard instead
   */
  async getLatestDraft(
    dashboardId: string
  ): Promise<{ data: DashboardDraft | null; error: Error | null }> {
    console.log('getLatestDraft is deprecated. Please use getLatestDraftForDashboard instead.');
    return this.getLatestDraftForDashboard(dashboardId);
  }
  
  /**
   * Create a new dashboard draft
   */
  async createDraft(
    dashboardId: string,
    userId: string
  ): Promise<{ data: DashboardDraft | null; error: Error | null }> {
    try {
      if (!dashboardId || dashboardId.trim() === '') {
        throw new Error('Invalid dashboard ID: cannot create draft with empty ID');
      }
      
      const supabase = this.getClient();
      
      console.log(`Creating draft for dashboard ${dashboardId} and user ${userId}`);
      
      // Check if the dashboard exists first
      const { data: _existingDashboard, error: checkError } = await supabase
        .from('dashboards')
        .select('id')
        .eq('id', dashboardId)
        .single();
        
      if (checkError) {
        console.error('Error checking dashboard existence:', checkError);
        throw new Error(`Dashboard not found: ${dashboardId}`);
      }
      
      const { data, error } = await supabase
        .from('dashboard_drafts')
        .insert({
          dashboard_id: dashboardId,
          name: 'Draft', // Set a default name
          created_by: userId,
          updated_at: new Date().toISOString(),
          is_current: true // Mark as current draft
        })
        .select('*')
        .single();
      
      if (error) throw error;
      
      return { data: data as DashboardDraft, error: null };
    } catch (error) {
      console.error('Error creating dashboard draft:', error);
      return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
    }
  }
  
  /**
   * Get a draft by ID
   */
  async getDraftById(
    draftId: string
  ): Promise<{ data: DashboardDraft | null; error: Error | null }> {
    try {
      const supabase = this.getClient();
      
      // Get the draft from dashboard_drafts table
      const { data, error } = await supabase
        .from('dashboard_drafts')
        .select('*')
        .eq('id', draftId)
        .single();
        
      if (error) throw error;
      
      if (!data) {
        throw new Error(`Draft with ID ${draftId} not found`);
      }
      
      // Create a draft object to return
      const draft: DashboardDraft = {
        id: data.id,
        dashboard_id: data.dashboard_id,
        created_by: data.created_by || '',
        created_at: data.created_at || new Date().toISOString(),
        updated_at: data.updated_at || new Date().toISOString(),
        name: data.name || '',
        description: data.description || ''
      };
      
      return { data: draft, error: null };
    } catch (error) {
      console.error(`Error fetching draft ${draftId}:`, error);
      return { data: null, error: error as Error };
    }
  }
  
  /**
   * Save widget placements to a draft
   */
  async saveDraftWidgetPlacements(
    draftId: string,
    placements: Partial<DraftWidgetPlacement>[]
  ): Promise<{ data: DraftWidgetPlacement[] | null; error: Error | null }> {
    try {
      const supabase = this.getClient();
      
      // First delete existing placements for this draft
      await supabase
        .from('draft_widget_placements')
        .delete()
        .eq('draft_id', draftId);
      
      // Check if there are any placements to insert
      if (placements.length === 0) {
        return { data: [], error: null };
      }
      
      // Then insert the new placements with all required fields
      const placementsWithDefaults = placements.map(placement => ({
        draft_id: draftId,
        widget_id: placement.widget_id || '',
        position_x: placement.position_x || 0,
        position_y: placement.position_y || 0,
        width: placement.width || 3,
        height: placement.height || 2,
        layout_type: placement.layout_type || 'grid',
        created_at: new Date().toISOString(),
        // Include created_by if available in the placement
        created_by: placement.created_by || null
      }));
      
      const { data, error } = await supabase
        .from('draft_widget_placements')
        .insert(placementsWithDefaults)
        .select();
        
      if (error) throw error;
      
      return { data: data as DraftWidgetPlacement[], error: null };
    } catch (error) {
      console.error(`Error saving widget placements for draft ${draftId}:`, error);
      return { data: null, error: error as Error };
    }
  }
  
  /**
   * Get widget placements for a draft
   */
  async getDraftWidgetPlacements(
    draftId: string
  ): Promise<{ data: DraftWidgetPlacement[] | null; error: Error | null }> {
    try {
      const supabase = this.getClient();
      
      const { data, error } = await supabase
        .from('draft_widget_placements')
        .select(`
          *,
          widget:widgets (*)
        `)
        .eq('draft_id', draftId)
        .order('position_y', { ascending: true })
        .order('position_x', { ascending: true });
        
      if (error) throw error;
      
      return { data: data as DraftWidgetPlacement[], error: null };
    } catch (error) {
      console.error(`Error fetching widget placements for draft ${draftId}:`, error);
      return { data: null, error: error as Error };
    }
  }
  
  /**
   * Create a new dashboard version from a draft
   */
  async publishDashboardVersion(
    draftId: string,
    userId: string,
    name?: string,
    description?: string
  ): Promise<{ data: DashboardVersion | null; error: Error | null }> {
    try {
      const supabase = this.getClient();
      
      // Get the draft to find the dashboard ID
      const { data: draft, error: draftError } = await this.getDraftById(draftId);
      
      if (draftError) throw draftError;
      if (!draft) throw new Error(`Draft ${draftId} not found`);
      
      // Get the dashboard
      const { data: dashboard, error: dashboardError } = await this.getDashboardById(draft.dashboard_id);
      
      if (dashboardError) throw dashboardError;
      if (!dashboard) throw new Error(`Dashboard ${draft.dashboard_id} not found`);
      
      // Get the latest version number
      const { data: versions, error: versionsError } = await supabase
        .from('dashboard_versions')
        .select('version_number')
        .eq('dashboard_id', draft.dashboard_id)
        .order('version_number', { ascending: false })
        .limit(1);
        
      if (versionsError) throw versionsError;
      
      const nextVersionNumber = versions && versions.length > 0 && 
        'version_number' in versions[0] ? 
        (versions[0] as any).version_number + 1 : 1;
      
      // Create a new version with all required fields
      const { data: version, error: versionError } = await supabase
        .from('dashboard_versions')
        .insert({
          dashboard_id: draft.dashboard_id,
          version_number: nextVersionNumber,
          created_by: userId,
          created_at: new Date().toISOString(),
          is_active: true,
          name: name || draft.name || `Version ${nextVersionNumber}`,
          description: description || draft.description || '',
          status: 'active' // Required field per schema
        })
        .select()
        .single();
        
      if (versionError) throw versionError;
      
      // Deactivate previous versions
      await supabase
        .from('dashboard_versions')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('dashboard_id', draft.dashboard_id)
        .neq('id', version.id);
      
      // Get the draft widget placements
      const { data: draftPlacements, error: placementsError } = await this.getDraftWidgetPlacements(draftId);
      
      if (placementsError) throw placementsError;
      if (!draftPlacements) throw new Error(`No placements found for draft ${draftId}`);
      
      // Convert draft placements to version placements
      const versionPlacements = draftPlacements.map(placement => ({
        version_id: version.id,
        widget_id: placement.widget_id,
        position_x: placement.position_x,
        position_y: placement.position_y,
        width: placement.width,
        height: placement.height,
        layout_type: placement.layout_type,
        created_at: new Date().toISOString()
      }));
      
      // Insert the version placements
      if (versionPlacements.length > 0) {
        const { error: insertError } = await supabase
          .from('widget_placements')
          .insert(versionPlacements);
          
        if (insertError) throw insertError;
      }
      
      // Update the dashboard to active state if it's not already
      if (!dashboard.is_published) {
        await supabase
          .from('dashboards')
          .update({ 
            is_active: true,
            updated_at: new Date().toISOString() 
          })
          .eq('id', draft.dashboard_id);
      }
      
      return { data: version as unknown as DashboardVersion, error: null };
    } catch (error) {
      console.error(`Error publishing dashboard version from draft ${draftId}:`, error);
      return { data: null, error: error as Error };
    }
  }
  
  /**
   * Get active dashboard version for a dashboard
   */
  async getActiveDashboardVersion(
    dashboardId: string
  ): Promise<{ data: DashboardVersion | null; error: Error | null }> {
    try {
      const supabase = this.getClient();
      
      const { data, error } = await supabase
        .from('dashboard_versions')
        .select('*')
        .eq('dashboard_id', dashboardId)
        .eq('is_active', true)
        .single();
        
      if (error) throw error;
      
      return { data: data as unknown as DashboardVersion, error: null };
    } catch (error) {
      console.error(`Error fetching active version for dashboard ${dashboardId}:`, error);
      return { data: null, error: error as Error };
    }
  }
  
  /**
   * Get widget placements for a dashboard version
   */
  async getWidgetPlacementsForVersion(
    versionId: string
  ): Promise<{ data: WidgetPlacement[] | null; error: Error | null }> {
    try {
      const supabase = this.getClient();
      
      const { data, error } = await supabase
        .from('widget_placements')
        .select(`
          *,
          widget:widgets (*)
        `)
        .eq('version_id', versionId) // Changed from dashboard_version_id to version_id
        .order('position_y', { ascending: true })
        .order('position_x', { ascending: true });
        
      if (error) throw error;
      
      // Return data as WidgetPlacement[] after applying proper type conversion
      // This is a type casting issue that needs to be handled appropriately
      return { 
        data: data.map(item => ({
          id: item.id,
          version_id: item.version_id,
          widget_id: item.widget_id,
          position_x: item.position_x,
          position_y: item.position_y,
          width: item.width,
          height: item.height,
          layout_type: item.layout_type,
          created_at: item.created_at,
          widget: item.widget
        })) as WidgetPlacement[], 
        error: null 
      };
    } catch (error) {
      console.error(`Error fetching widget placements for version ${versionId}:`, error);
      return { data: null, error: error as Error };
    }
  }
  
  /**
   * Get all dashboard versions for a dashboard
   */
  async getDashboardVersions(
    dashboardId: string
  ): Promise<{ data: DashboardVersion[] | null; error: Error | null }> {
    try {
      const supabase = this.getClient();
      
      const { data, error } = await supabase
        .from('dashboard_versions')
        .select('*')
        .eq('dashboard_id', dashboardId)
        .order('version_number', { ascending: false });
        
      if (error) throw error;
      
      return { data: data as unknown as DashboardVersion[], error: null };
    } catch (error) {
      console.error(`Error fetching versions for dashboard ${dashboardId}:`, error);
      return { data: null, error: error as Error };
    }
  }
  
  /**
   * Replace all widget placements for a draft
   */
  async replaceDraftWidgetPlacements(
    draftId: string,
    placements: Omit<DraftWidgetPlacement, 'id' | 'created_at'>[]
  ): Promise<{ data: DraftWidgetPlacement[] | null; error: Error | null }> {
    try {
      const supabase = this.getClient();
      
      // First, delete all existing placements for this draft
      const { error: deleteError } = await supabase
        .from('draft_widget_placements')
        .delete()
        .eq('draft_id', draftId);
        
      if (deleteError) throw deleteError;
      
      // If there are no new placements to add, return empty array
      if (placements.length === 0) {
        return { data: [], error: null };
      }
      
      // Then insert the new placements with all required fields
      const placementsWithTimestamp = placements.map(placement => ({
        ...placement,
        draft_id: draftId, // Ensure draft_id is set
        created_at: new Date().toISOString()
      }));
      
      const { data, error } = await supabase
        .from('draft_widget_placements')
        .insert(placementsWithTimestamp)
        .select();
        
      if (error) throw error;
      
      return { data: data as DraftWidgetPlacement[], error: null };
    } catch (error) {
      console.error(`Error replacing widget placements for draft ${draftId}:`, error);
      return { data: null, error: error as Error };
    }
  }
}

// Export a singleton instance
export const dashboardService = new DashboardService(); 