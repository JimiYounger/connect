// my-app/src/features/widgets/services/dashboard-service.ts

import { createClient as createBrowserClient } from '@/lib/supabase';
import type { 
  DraftWidgetPlacement,
  WidgetPlacement
} from '../types';
import { v4 as uuidv4 } from 'uuid';

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
  // Simplify to only use the browser client
  private getClient() {
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
      
      // Using the correct table name from the schema
      let query = supabase
        .from('dashboard_drafts') // Using dashboard_drafts instead of custom_dashboards
        .select('*');
      
      // Apply filters
      if (options?.isPublished !== undefined) {
        query = query.eq('is_published', options.isPublished);
      }
      
      // Role-based access filter
      if (options?.roleIds && options.roleIds.length > 0) {
        // This assumes your dashboards table has a role_access JSONB column
        // that contains an array of role IDs that can access the dashboard
        query = query.or(`role_access.cs.{${options.roleIds.join(',')}},created_by.eq.${userId}`);
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
        description: '',
        is_published: false, // Default value since it might not exist in the schema
        created_by: item.created_by || '',
        created_at: item.created_at || new Date().toISOString(),
        updated_at: item.updated_at || new Date().toISOString(),
        is_default: false, // Default value since it might not exist in the schema
        role_access: item.role_type ? [item.role_type] : []
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
      const supabase = this.getClient();
      const { data, error } = await supabase
        .from('dashboard_drafts') // Using dashboard_drafts instead of custom_dashboards
        .select('*')
        .eq('id', dashboardId)
        .single();
        
      if (error) throw error;
      
      // Transform the data to match the Dashboard interface
      const dashboard: Dashboard = {
        id: data.id,
        name: data.name,
        description: '',
        is_published: false, // Default value since it might not exist in the schema
        created_by: data.created_by || '',
        created_at: data.created_at || new Date().toISOString(),
        updated_at: data.updated_at || new Date().toISOString(),
        is_default: false, // Default value since it might not exist in the schema
        role_access: data.role_type ? [data.role_type] : []
      };
        
      return { data: dashboard, error: null };
    } catch (error) {
      console.error(`Error fetching dashboard ${dashboardId}:`, error);
      return { data: null, error: error as Error };
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
      
      // Try with capitalized role types
      const validRoleTypes = ['Admin', 'Executive', 'Manager', 'Closer', 'Setter'];
      let roleType = 'Admin'; // Default
      
      if (dashboard.role_access && dashboard.role_access.length > 0) {
        // Capitalize first letter
        const requestedRole = dashboard.role_access[0].charAt(0).toUpperCase() + 
                             dashboard.role_access[0].slice(1).toLowerCase();
        if (validRoleTypes.includes(requestedRole)) {
          roleType = requestedRole;
        }
      }
      
      console.log('Attempting to create dashboard with role_type:', roleType);
      
      const { data, error } = await supabase
        .from('dashboard_drafts')
        .insert({
          name: dashboard.name || 'Untitled Dashboard',
          created_by: userId,
          updated_at: new Date().toISOString(),
          role_type: roleType
        })
        .select()
        .single();
        
      if (error) throw error;
      
      // Transform the data to match the Dashboard interface
      const newDashboard: Dashboard = {
        id: data.id,
        name: data.name,
        description: '', // We'll keep this in the interface but not send to DB
        is_published: false,
        created_by: data.created_by || '',
        created_at: data.created_at || new Date().toISOString(),
        updated_at: data.updated_at || new Date().toISOString(),
        is_default: false,
        role_access: data.role_type ? [data.role_type] : []
      };
      
      return { data: newDashboard, error: null };
    } catch (error) {
      console.error('Error creating dashboard:', error);
      return { data: null, error: error as Error };
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
      if (updates.role_access && updates.role_access.length > 0) {
        draftUpdates.role_type = updates.role_access[0];
      }
      
      const { data, error } = await supabase
        .from('dashboard_drafts') // Using dashboard_drafts instead of custom_dashboards
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
        role_access: data.role_type ? [data.role_type] : []
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
        .from('dashboard_drafts') // Using dashboard_drafts instead of custom_dashboards
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
   * Get the latest draft for a dashboard
   */
  async getLatestDraft(
    dashboardId: string
  ): Promise<{ data: DashboardDraft | null; error: Error | null }> {
    try {
      const supabase = this.getClient();
      
      // Log the query parameters for debugging
      console.log(`Fetching latest draft for dashboard: ${dashboardId}`);
      
      const { data, error } = await supabase
        .from('draft_widget_placements')
        .select('*')
        .eq('draft_id', dashboardId)  // Ensure we're using draft_id
        .order('created_at', { ascending: false })
        .limit(1);
        
      // Detailed error logging
      if (error) {
        console.error(`Database error fetching draft: ${error.message}`, error);
        
        // Only throw if it's not a "no rows returned" error
        if (error.code !== 'PGRST116') {
          throw error;
        }
        return { data: null, error: null };
      }
      
      // If no placements found, return null with detailed log
      if (!data || data.length === 0) {
        console.log(`No draft placements found for dashboard ${dashboardId}`);
        return { data: null, error: null };
      }
      
      console.log(`Found draft placement with ID: ${data[0].id}`);
      
      // Create a draft object to return - don't try to access properties that don't exist
      const draft: DashboardDraft = {
        id: data[0].id,
        dashboard_id: data[0].draft_id,
        created_by: '', // Fixed: Set a default value instead of trying to access nonexistent property
        created_at: data[0].created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        name: '', // Fixed: Set a default value instead of trying to access nonexistent property
        description: '' // Fixed: Set a default value instead of trying to access nonexistent property
      };
      
      return { data: draft, error: null };
    } catch (error) {
      console.error(`Error fetching latest draft for dashboard ${dashboardId}:`, error);
      return { data: null, error: error as Error };
    }
  }
  
  /**
   * Create a new draft
   */
  async createDraft(
    dashboardId: string,
    userId: string
  ): Promise<{ data: DashboardDraft | null; error: Error | null }> {
    try {
      const supabase = this.getClient();
      
      // Create a draft with required fields according to the schema
      const { data: draftData, error: draftError } = await supabase
        .from('dashboard_drafts')
        .insert({
          // Using role_type and name which are required fields
          role_type: 'Manager', // Use an appropriate role type from your enum
          name: `Draft for ${dashboardId}`,
          created_by: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select();
        
      if (draftError) throw draftError;
      
      // We need the draft ID from the newly created draft
      const draftId = draftData[0].id;
      
      // Now we can create the draft_widget_placement
      // Get an existing widget to use for a valid reference
      const { data: widgetsData, error: widgetsError } = await supabase
        .from('widgets')
        .select('id')
        .limit(1);
        
      if (widgetsError) throw widgetsError;
      
      // Only try to create a placement if we have at least one widget
      if (widgetsData && widgetsData.length > 0) {
        // Create initial placement with a valid widget ID and correct layout_type
        const { error: placementError } = await supabase
          .from('draft_widget_placements')
          .insert({
            draft_id: draftId, // Use the newly created draft ID
            widget_id: widgetsData[0].id, // Use an existing widget ID
            position_x: 0,
            position_y: 0,
            width: 3,
            height: 2,
            layout_type: 'desktop', // Use valid value: 'desktop' or 'mobile'
            created_at: new Date().toISOString()
          });
          
        if (placementError) {
          console.warn('Could not create initial placement:', placementError);
          // Continue anyway as we already created the draft
        }
      }
      
      // Return the created draft
      // Since we're storing the dashboardId association in our client code, 
      // keep it in the return value even though it's not in the database
      const draft: DashboardDraft = {
        id: draftId,
        dashboard_id: dashboardId, // We keep this for client-side reference
        created_by: userId,
        created_at: draftData[0].created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        name: draftData[0].name,
        description: ''
      };
      
      return { data: draft, error: null };
    } catch (error) {
      console.error(`Error creating draft for dashboard ${dashboardId}:`, error);
      return { data: null, error: error as Error };
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
      
      const { data, error } = await supabase
        .from('draft_widget_placements')
        .select('*')
        .eq('id', draftId)
        .single();
        
      if (error) throw error;
      
      // Create a draft object to return
      const draft: DashboardDraft = {
        id: data.id,
        dashboard_id: data.draft_id,
        created_by: '', // This information might not be available
        created_at: data.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        name: '', // This information might not be available
        description: '' // This information might not be available
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
      
      // Then insert the new placements
      // Make sure all required fields are present, but don't include created_by
      const placementsWithDefaults = placements.map(placement => ({
        draft_id: draftId,
        widget_id: placement.widget_id || '',
        position_x: placement.position_x || 0,
        position_y: placement.position_y || 0,
        width: placement.width || 3,
        height: placement.height || 2,
        layout_type: placement.layout_type || 'grid',
        created_at: new Date().toISOString()
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
      
      // Get the dashboard to find the current version number
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
      
      // Safely access version_number with type checking
      const nextVersionNumber = versions && versions.length > 0 && 
        'version_number' in versions[0] ? 
        (versions[0] as any).version_number + 1 : 1;
      
      // Create a new version
      const { data: version, error: versionError } = await supabase
        .from('dashboard_versions')
        .insert({
          version_number: nextVersionNumber,
          created_by: userId,
          is_active: true,
          name: name || `Version ${nextVersionNumber}`,
          description: description || '',
          role_type: 'user',
          status: 'active',
          version_name: name || `Version ${nextVersionNumber}`,
          created_at: new Date().toISOString()
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
      
      // Convert draft placements to published placements
      const publishedPlacements = draftPlacements.map(placement => ({
        dashboard_version_id: version.id,
        widget_id: placement.widget_id,
        position_x: placement.position_x,
        position_y: placement.position_y,
        width: placement.width,
        height: placement.height,
        layout_type: placement.layout_type,
        created_at: new Date().toISOString()
      }));
      
      // Insert the published placements
      await supabase
        .from('widget_placements')
        .insert(publishedPlacements);
      
      // Update the dashboard to published state if it's not already
      if (!dashboard.is_published) {
        await this.updateDashboard(draft.dashboard_id, { is_published: true });
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
        .eq('dashboard_version_id', versionId)
        .order('position_y', { ascending: true })
        .order('position_x', { ascending: true });
        
      if (error) throw error;
      
      return { data: data as WidgetPlacement[], error: null };
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
   * This is more efficient than deleting and then adding placements separately
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
      
      // Then insert the new placements
      const placementsWithTimestamp = placements.map(placement => ({
        ...placement,
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