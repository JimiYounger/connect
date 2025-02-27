// my-app/src/features/widgets/hooks/use-dashboard-editor.ts

import { useState, useEffect, useCallback } from 'react';
import { Layout } from 'react-grid-layout';
import { 
  Widget, 
  DraftWidgetPlacement
} from '../types';
import { dashboardService } from '../services/dashboard-service';
import { useToast } from '@/hooks/use-toast';

interface UseDashboardEditorOptions {
  dashboardId?: string;
  userId: string;
  initialLayout?: DraftWidgetPlacement[];
  onSave?: (draftId: string) => void;
  onPublish?: (versionId: string) => void;
}

interface UseDashboardEditorReturn {
  // Layout state
  layout: DraftWidgetPlacement[];
  isDirty: boolean;
  isLoading: boolean;
  error: Error | null;
  
  // Widget operations
  addWidget: (widget: Widget) => void;
  removeWidget: (widgetId: string) => void;
  updateWidgetPosition: (widgetId: string, x: number, y: number) => void;
  updateWidgetSize: (widgetId: string, width: number, height: number) => void;
  
  // Layout operations
  resetLayout: () => void;
  clearLayout: () => void;
  
  // Dashboard operations
  saveDraft: () => Promise<string | null>;
  publishDashboard: (name?: string, description?: string) => Promise<string | null>;
  loadDraftLayout: () => Promise<void>;
  
  // Conversion utilities
  layoutToGridLayout: () => Layout[];
  gridLayoutToLayout: (gridLayout: Layout[]) => void;
}

/**
 * Hook for managing dashboard editor state and operations
 */
export function useDashboardEditor({
  dashboardId,
  userId,
  initialLayout = [],
  onSave,
  onPublish
}: UseDashboardEditorOptions): UseDashboardEditorReturn {
  // State
  const [layout, setLayout] = useState<DraftWidgetPlacement[]>(initialLayout);
  const [originalLayout, setOriginalLayout] = useState<DraftWidgetPlacement[]>(initialLayout);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);
  
  const { toast } = useToast();
  
  // Load draft layout from server
  const loadDraftLayout = useCallback(async () => {
    if (!dashboardId) {
      console.error("Cannot load draft layout: No dashboard ID provided");
      return;
    }
    
    if (!userId) {
      console.error("Cannot load draft layout: No user ID available");
      setError(new Error("Authentication required"));
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`Loading draft layout for dashboard: ${dashboardId}`);
      
      // Get the latest draft for this dashboard
      const { data: draft, error: draftError } = await dashboardService.getLatestDraft(dashboardId);
      
      if (draftError) {
        console.error(`Error fetching latest draft:`, draftError);
        throw draftError;
      }
      
      if (draft) {
        console.log(`Found existing draft with ID: ${draft.id}`);
        setDraftId(draft.id);
        
        // Load widget placements for this draft
        const { data: placements, error: placementsError } = 
          await dashboardService.getDraftWidgetPlacements(draft.id);
        
        if (placementsError) {
          console.error(`Error fetching draft placements:`, placementsError);
          throw placementsError;
        }
        
        if (placements && placements.length > 0) {
          console.log(`Loaded ${placements.length} widget placements`);
          
          // Filter out any placeholder entries
          const validPlacements = placements.filter(p => p.widget_id !== 'placeholder');
          
          setLayout(validPlacements);
          setOriginalLayout(validPlacements);
        } else {
          console.log(`No widget placements found for draft ${draft.id}`);
          setLayout([]);
          setOriginalLayout([]);
        }
      } else {
        console.log(`No draft found for dashboard ${dashboardId}, creating new draft`);
        // No draft exists, create one
        const { data: newDraft, error: newDraftError } = 
          await dashboardService.createDraft(dashboardId, userId);
        
        if (newDraftError) {
          console.error(`Error creating new draft:`, newDraftError);
          throw newDraftError;
        }
        
        if (newDraft) {
          console.log(`Created new draft with ID: ${newDraft.id}`);
          setDraftId(newDraft.id);
          setLayout([]);
          setOriginalLayout([]);
        } else {
          console.error(`Failed to create draft for dashboard ${dashboardId}`);
          throw new Error("Failed to create new draft");
        }
      }
    } catch (err) {
      const errorMessage = (err as Error).message || "Unknown error occurred";
      console.error(`Draft layout loading failed: ${errorMessage}`, err);
      setError(err as Error);
      toast({
        title: "Error loading dashboard",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [dashboardId, userId, toast]);
  
  // Check if layout has changed from original
  useEffect(() => {
    if (layout.length !== originalLayout.length) {
      setIsDirty(true);
      return;
    }
    
    // Deep comparison of layouts
    const hasChanged = layout.some((item, index) => {
      const original = originalLayout[index];
      return !original || 
        item.widget_id !== original.widget_id ||
        item.position_x !== original.position_x ||
        item.position_y !== original.position_y ||
        item.width !== original.width ||
        item.height !== original.height;
    });
    
    setIsDirty(hasChanged);
  }, [layout, originalLayout]);
  
  // Load draft layout when dashboardId changes
  useEffect(() => {
    if (dashboardId && initialLayout.length === 0) {
      loadDraftLayout();
    }
  }, [dashboardId, initialLayout.length, loadDraftLayout]);
  
  // Add a widget to the layout
  const addWidget = useCallback((widget: Widget) => {
    // Find the next available position
    const maxY = layout.length > 0 
      ? Math.max(...layout.map(item => item.position_y + item.height))
      : 0;
    
    // Fix the default_size property access
    const newPlacement: DraftWidgetPlacement = {
      id: `temp-${Date.now()}`, // Temporary ID until saved
      widget_id: widget.id,
      draft_id: draftId || '',
      position_x: 0,
      position_y: maxY,
      width: 3, // Default width
      height: 2, // Default height
      layout_type: 'grid',
      created_at: new Date().toISOString()
    };
    
    setLayout(prev => [...prev, newPlacement]);
  }, [layout, draftId]);
  
  // Remove a widget from the layout
  const removeWidget = useCallback((widgetId: string) => {
    setLayout(prev => prev.filter(item => item.widget_id !== widgetId));
  }, []);
  
  // Update a widget's position
  const updateWidgetPosition = useCallback((widgetId: string, x: number, y: number) => {
    setLayout(prev => prev.map(item => 
      item.widget_id === widgetId 
        ? { ...item, position_x: x, position_y: y }
        : item
    ));
  }, []);
  
  // Update a widget's size
  const updateWidgetSize = useCallback((widgetId: string, width: number, height: number) => {
    setLayout(prev => prev.map(item => 
      item.widget_id === widgetId 
        ? { ...item, width, height }
        : item
    ));
  }, []);
  
  // Reset layout to original state
  const resetLayout = useCallback(() => {
    setLayout(originalLayout);
  }, [originalLayout]);
  
  // Clear all widgets from layout
  const clearLayout = useCallback(() => {
    setLayout([]);
  }, []);
  
  // Fix the saveDraft method to handle deletions differently
  const saveDraft = useCallback(async (): Promise<string | null> => {
    if (!dashboardId) {
      console.error("Cannot save draft: No dashboard ID provided");
      toast({
        title: "Error saving dashboard",
        description: "No dashboard ID provided",
        variant: "destructive"
      });
      return null;
    }
    
    if (!draftId) {
      console.error("Cannot save draft: No draft ID available");
      toast({
        title: "Error saving dashboard",
        description: "No draft ID available",
        variant: "destructive"
      });
      return null;
    }
    
    if (!userId) {
      console.error("Cannot save draft: No user ID available");
      toast({
        title: "Error saving dashboard",
        description: "Authentication required",
        variant: "destructive"
      });
      return null;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`Saving draft ${draftId} with ${layout.length} widget placements`);
      
      // Ensure all placements have the correct draft_id
      const placements = layout.map(item => ({
        draft_id: draftId,
        widget_id: item.widget_id,
        position_x: item.position_x,
        position_y: item.position_y,
        width: item.width,
        height: item.height,
        layout_type: item.layout_type,
        created_by: userId // Add user ID for traceability
      }));
      
      // If layout is empty, add a placeholder entry to maintain the draft
      if (placements.length === 0) {
        console.log(`Adding placeholder entry to maintain draft ${draftId}`);
        placements.push({
          draft_id: draftId,
          widget_id: 'placeholder',
          position_x: 0,
          position_y: 0,
          width: 1,
          height: 1,
          layout_type: 'grid',
          created_by: userId
        });
      }
      
      // Replace all placements in a single operation
      const { data, error } = await dashboardService.replaceDraftWidgetPlacements(
        draftId, 
        placements
      );
      
      if (error) {
        console.error(`Error replacing widget placements:`, error);
        throw error;
      }
      
      console.log(`Successfully saved ${data?.length || 0} widget placements`);
      
      // Update original layout to match current layout (exclude placeholder entry)
      setOriginalLayout(layout);
      setIsDirty(false);
      
      toast({
        title: "Dashboard saved",
        description: "Your changes have been saved as a draft.",
      });
      
      if (onSave) onSave(draftId);
      
      return draftId;
    } catch (err) {
      const errorMessage = (err as Error).message || "Unknown error occurred";
      console.error(`Draft saving failed: ${errorMessage}`, err);
      setError(err as Error);
      toast({
        title: "Error saving dashboard",
        description: errorMessage,
        variant: "destructive"
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [dashboardId, draftId, layout, userId, onSave, toast]);
  
  // Publish the current layout as a new dashboard version
  const publishDashboard = useCallback(async (
    name?: string, 
    description?: string
  ): Promise<string | null> => {
    if (!dashboardId || !draftId) return null;
    
    // First save the draft to ensure all changes are captured
    const savedDraftId = await saveDraft();
    if (!savedDraftId) return null;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Publish the draft as a new version
      const { data: version, error: publishError } = await dashboardService.publishDashboardVersion(
        savedDraftId,
        userId,
        name,
        description
      );
      
      if (publishError) throw publishError;
      
      if (!version) throw new Error("Failed to create dashboard version");
      
      toast({
        title: "Dashboard published",
        description: "Your dashboard has been published and is now live.",
      });
      
      if (onPublish) onPublish(version.id);
      
      return version.id;
    } catch (err) {
      setError(err as Error);
      toast({
        title: "Error publishing dashboard",
        description: (err as Error).message,
        variant: "destructive"
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [dashboardId, draftId, userId, saveDraft, onPublish, toast]);
  
  // Convert our layout format to react-grid-layout format
  const layoutToGridLayout = useCallback((): Layout[] => {
    return layout.map(item => ({
      i: item.widget_id,
      x: item.position_x,
      y: item.position_y,
      w: item.width,
      h: item.height,
      minW: 1,
      minH: 1
    }));
  }, [layout]);
  
  // Convert react-grid-layout format to our layout format
  const gridLayoutToLayout = useCallback((gridLayout: Layout[]) => {
    const updatedLayout = layout.map(item => {
      const gridItem = gridLayout.find(g => g.i === item.widget_id);
      if (!gridItem) return item;
      
      return {
        ...item,
        position_x: gridItem.x,
        position_y: gridItem.y,
        width: gridItem.w,
        height: gridItem.h
      };
    });
    
    setLayout(updatedLayout);
  }, [layout]);
  
  return {
    layout,
    isDirty,
    isLoading,
    error,
    addWidget,
    removeWidget,
    updateWidgetPosition,
    updateWidgetSize,
    resetLayout,
    clearLayout,
    saveDraft,
    publishDashboard,
    loadDraftLayout,
    layoutToGridLayout,
    gridLayoutToLayout
  };
} 