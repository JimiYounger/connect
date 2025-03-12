// my-app/src/features/dashboards/services/dashboard-service.ts

import { createClient } from '@/lib/supabase';
import { Tables } from '@/types/supabase';

type _DashboardVersion = Tables<'dashboard_versions'>;
type _WidgetPlacement = Tables<'widget_placements'>;
type _DashboardDraft = Tables<'dashboard_drafts'>;
type Dashboard = Tables<'dashboards'>;
type DraftWidgetPlacement = Tables<'draft_widget_placements'>;

// Required fields for creating a dashboard
type CreateDashboardData = {
  name: string;
  role_type: string;
  created_by?: string | null;
  description?: string | null;
  is_active?: boolean | null;
};

// Required fields for creating a draft placement
type CreateDraftPlacementData = {
  draft_id: string;
  widget_id: string;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  layout_type: string;
  created_by?: string | null;
};

export const dashboardService = {
  // Get dashboard by ID
  // Check the getDashboardById function in dashboard-service.ts
async getDashboardById(id: string) {
  try {
    const supabase = createClient();
    
    // First check if the dashboard exists
    const { data: dashboard, error: dashboardError } = await supabase
      .from('dashboards')
      .select('*')
      .eq('id', id)
      .single();

    if (dashboardError) {
      if (dashboardError.code === 'PGRST116') {
        return { 
          data: null, 
          error: new Error(`Dashboard with ID ${id} not found`) 
        };
      }
      console.error('Error fetching dashboard:', dashboardError);
      return { data: null, error: dashboardError };
    }

    // Get the current draft
    const { data: currentDraft, error: _draftError } = await supabase
      .from('dashboard_drafts')
      .select('*')
      .eq('dashboard_id', id)
      .eq('is_current', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // NOTE: We're using a single() call here, which can cause the issue you're seeing
    // if there are multiple drafts. If this fails, let's try a different approach.

    // Combine the data
    const dashboardWithDraft = {
      ...dashboard,
      current_draft: currentDraft || null
    };

    return {
      data: dashboardWithDraft,
      error: null
    };

  } catch (error) {
    console.error('Error in getDashboardById:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error('Unknown error occurred') 
    };
  }
},

  // Create new dashboard
  async createDashboard(data: CreateDashboardData) {
    try {
      const supabase = createClient();
      const { data: dashboard, error } = await supabase
        .from('dashboards')
        .insert(data)
        .select()
        .single();

      if (error) {
        console.error('Error creating dashboard:', error);
        return { data: null, error };
      }

      // Create initial draft
      const { error: draftError } = await supabase
        .from('dashboard_drafts')
        .insert({
          dashboard_id: dashboard.id,
          name: dashboard.name,
          description: dashboard.description,
          is_current: true,
          created_by: data.created_by,
        });

      if (draftError) {
        console.error('Error creating draft:', draftError);
        return { data: null, error: draftError };
      }

      return { data: dashboard, error: null };
    } catch (error) {
      console.error('Error in createDashboard:', error);
      return { data: null, error };
    }
  },

  async createDashboardDraft(dashboardId: string, data: {
    name: string;
    description?: string;
    is_current?: boolean;
    created_by?: string;
  }) {
    try {
      const supabase = createClient();
      
      // First, set all existing drafts for this dashboard to not current
      if (data.is_current) {
        const { error: updateError } = await supabase
          .from('dashboard_drafts')
          .update({ is_current: false })
          .eq('dashboard_id', dashboardId);
          
        if (updateError) {
          console.error('Error updating existing drafts:', updateError);
        }
      }
      
      // Then create the new draft
      const { data: draft, error } = await supabase
        .from('dashboard_drafts')
        .insert({
          dashboard_id: dashboardId,
          name: data.name,
          description: data.description || null,
          is_current: data.is_current !== undefined ? data.is_current : true,
          created_by: data.created_by || null,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
  
      if (error) throw error;
  
      return { data: draft, error: null };
    } catch (error) {
      console.error('Error creating dashboard draft:', error);
      return { data: null, error };
    }
  },

  // Update dashboard
  async updateDashboard(id: string, data: Partial<Dashboard>) {
    try {
      const supabase = createClient();
      const { data: updated, error } = await supabase
        .from('dashboards')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating dashboard:', error);
        return { data: null, error };
      }

      return { data: updated, error: null };
    } catch (error) {
      console.error('Error in updateDashboard:', error);
      return { data: null, error };
    }
  },

  // Get current draft
  async getCurrentDraft(dashboardId: string) {
    try {
      const supabase = createClient();
      
      // Get all current drafts for this dashboard
      const { data: drafts, error: draftsError } = await supabase
        .from('dashboard_drafts')
        .select('*')
        .eq('dashboard_id', dashboardId)
        .eq('is_current', true)
        .order('created_at', { ascending: false });
        
      if (draftsError) throw draftsError;
      
      // If multiple drafts found, use the most recent one
      if (drafts && drafts.length > 0) {
        // If more than one draft is found, we should fix the data
        if (drafts.length > 1) {
          console.warn(`Found ${drafts.length} current drafts for dashboard ${dashboardId}, using most recent`);
          
          // Keep the most recent as current, set others to not current
          const _mostRecentDraft = drafts[0]; // Assuming sorted by created_at desc
          const draftsToUpdate = drafts.slice(1).map(draft => draft.id);
          
          if (draftsToUpdate.length > 0) {
            await supabase
              .from('dashboard_drafts')
              .update({ is_current: false })
              .in('id', draftsToUpdate);
          }
        }
        
        // Use the most recent draft
        const draftId = drafts[0].id;
        
        // Get the draft with its placements
        const { data: draftWithPlacements, error: placementsError } = await supabase
          .from('dashboard_drafts')
          .select(`
            *,
            draft_widget_placements(*)
          `)
          .eq('id', draftId)
          .single();
          
        if (placementsError) throw placementsError;
        
        return { data: draftWithPlacements, error: null };
      }
      
      // No drafts found
      return { data: null, error: null };
    } catch (error) {
      console.error('Error in getCurrentDraft:', error);
      return { data: null, error };
    }
  },

  // Save widget placement in draft
  async saveDraftPlacement(placement: CreateDraftPlacementData) {
    const supabase = createClient();
    return supabase
      .from('draft_widget_placements')
      .insert(placement)
      .select()
      .single();
  },

  // Update widget placement in draft
  async updateDraftPlacement(id: string, updates: Partial<DraftWidgetPlacement>) {
    const supabase = createClient();
    return supabase
      .from('draft_widget_placements')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
  },

  // Delete widget placement from draft
  async deleteDraftPlacement(id: string) {
    const supabase = createClient();
    return supabase
      .from('draft_widget_placements')
      .delete()
      .eq('id', id);
  },

  // Publish dashboard
  async publishDashboard(dashboardId: string, scheduledDate?: Date) {
    try {
      const supabase = createClient();
      const { data: draft } = await this.getCurrentDraft(dashboardId);
      
      if (!draft) {
        return { error: new Error('No draft found') };
      }

      // Create new version
      const { data: latestVersion } = await supabase
        .from('dashboard_versions')
        .select('version_number')
        .eq('dashboard_id', dashboardId)
        .order('version_number', { ascending: false })
        .limit(1)
        .single();

      const newVersionNumber = (latestVersion?.version_number || 0) + 1;

      const { data: version, error: versionError } = await supabase
        .from('dashboard_versions')
        .insert({
          dashboard_id: dashboardId,
          name: draft.name,
          description: draft.description,
          version_number: newVersionNumber,
          status: scheduledDate ? 'scheduled' : 'published',
          scheduled_publish_date: scheduledDate?.toISOString(),
          created_by: draft.created_by,
          is_active: true,
        })
        .select()
        .single();

      if (versionError) {
        console.error('Error creating version:', versionError);
        return { data: null, error: versionError };
      }

      // Copy placements from draft to version
      const { data: draftPlacements } = await supabase
        .from('draft_widget_placements')
        .select('*')
        .eq('draft_id', draft.id);

      if (draftPlacements && draftPlacements.length > 0) {
        const versionPlacements = draftPlacements.map((dp: DraftWidgetPlacement) => ({
          version_id: version.id,
          widget_id: dp.widget_id,
          position_x: dp.position_x,
          position_y: dp.position_y,
          width: dp.width,
          height: dp.height,
          layout_type: dp.layout_type,
        }));

        const { error: placementError } = await supabase
          .from('widget_placements')
          .insert(versionPlacements);

        if (placementError) {
          console.error('Error copying placements:', placementError);
          return { data: null, error: placementError };
        }
      }

      return { data: version, error: null };
    } catch (error) {
      console.error('Error in publishDashboard:', error);
      return { data: null, error };
    }
  },

  // Get widget by ID
  async getWidgetById(id: string) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('widgets')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching widget:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in getWidgetById:', error);
      return { data: null, error };
    }
  },

  // Save widget configuration
  async saveWidgetConfiguration(widgetId: string, configData: any, userId?: string) {
    const supabase = createClient();
    
    // Check if a configuration already exists for this widget
    const { data: existingConfig } = await supabase
      .from('widget_configurations')
      .select('id')
      .eq('widget_id', widgetId)
      .maybeSingle();
    
    if (existingConfig) {
      // Update existing configuration
      return supabase
        .from('widget_configurations')
        .update({
          config: configData,
          updated_at: new Date().toISOString(),
          updated_by: userId || null
        })
        .eq('id', existingConfig.id)
        .select()
        .single();
    } else {
      // Create new configuration
      return supabase
        .from('widget_configurations')
        .insert({
          widget_id: widgetId,
          config: configData,
          created_by: userId || null,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
    }
  },
}; 