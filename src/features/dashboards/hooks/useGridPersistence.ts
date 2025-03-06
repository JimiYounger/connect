// my-app/src/features/dashboards/hooks/useGridPersistence.ts

import { useState, useCallback, useEffect } from 'react';
import { dashboardService } from '../services/dashboard-service';
import { toast } from '@/hooks/use-toast';

interface UseGridPersistenceProps {
  dashboardId: string;
  draftId?: string;
  layout: 'mobile' | 'desktop';
  onPlacementsLoaded: (placements: any[]) => void;
}

export function useGridPersistence({ 
  dashboardId, 
  draftId, 
  layout, 
  onPlacementsLoaded 
}: UseGridPersistenceProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Load placements from backend
  const loadPlacements = useCallback(async () => {
    if (!dashboardId || !draftId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Get current draft with placements
      const { data: draft, error: draftError } = await dashboardService.getCurrentDraft(dashboardId);
      
      if (draftError || !draft) {
        console.error('Error loading draft:', draftError);
        setError(new Error('Failed to load dashboard draft'));
        return;
      }
      
      // Filter placements by layout type
      const layoutPlacements = draft.draft_widget_placements.filter(
        (p: any) => p.layout_type === layout
      );
      
      // Fetch widget data for each placement
      const placementsWithWidgets = await Promise.all(
        layoutPlacements.map(async (placement: any) => {
          const { data: widget } = await dashboardService.getWidgetById(placement.widget_id);
          return { ...placement, widget };
        })
      );
      
      onPlacementsLoaded(placementsWithWidgets);
    } catch (err) {
      console.error('Error loading placements:', err);
      setError(err instanceof Error ? err : new Error('Unknown error loading placements'));
    } finally {
      setIsLoading(false);
    }
  }, [dashboardId, draftId, layout, onPlacementsLoaded]);
  
  // Save a placement to backend
  const savePlacement = useCallback(async (placementData: any) => {
    if (!draftId) {
      console.error('Error: No draft ID available for saving placement');
      toast({
        title: "Error",
        description: "Cannot save widget: No draft available.",
        variant: "destructive"
      });
      setError(new Error('No draft ID available'));
      return null;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Extract configuration from placement data if it exists
      const { configuration, ...placementDataWithoutConfig } = placementData;
      
      // Save the placement without configuration first
      const { data, error: saveError } = await dashboardService.saveDraftPlacement({
        draft_id: draftId,
        ...placementDataWithoutConfig
      });
      
      if (saveError) {
        console.error('Error saving placement:', saveError);
        setError(new Error('Failed to save widget placement'));
        toast({
          title: "Error",
          description: "Failed to save widget placement.",
          variant: "destructive"
        });
        return null;
      }
      
      // If we have configuration data and the placement was saved successfully,
      // update the placement with the configuration
      if (configuration && data) {
        // Update the placement to include the configuration
        // Use type assertion to avoid TypeScript error
        const { error: updateError } = await dashboardService.updateDraftPlacement(
          data.id,
          { 
            // Cast to any to bypass the TypeScript check
            // This is a temporary solution until database schema is updated
            configuration: JSON.stringify(configuration)
          } as any
        );
        
        if (updateError) {
          console.error('Error adding configuration to placement:', updateError);
          // Continue anyway since the basic placement was saved
        }
      }
      
      return data;
    } catch (err) {
      console.error('Error saving placement:', err);
      setError(err instanceof Error ? err : new Error('Unknown error saving placement'));
      toast({
        title: "Error",
        description: "Failed to save widget placement. Please try again.",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [draftId]);
  
  // Delete a placement from backend
  const deletePlacement = useCallback(async (placementId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { error: deleteError } = await dashboardService.deleteDraftPlacement(placementId);
      
      if (deleteError) {
        console.error('Error removing placement:', deleteError);
        setError(new Error('Failed to remove widget'));
        toast({
          title: "Error",
          description: "Failed to remove widget.",
          variant: "destructive"
        });
        return false;
      }
      
      return true;
    } catch (err) {
      console.error('Error removing placement:', err);
      setError(err instanceof Error ? err : new Error('Unknown error removing placement'));
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Update a placement in backend
  const updatePlacement = useCallback(async (placementId: string, updateData: any) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { error: updateError } = await dashboardService.updateDraftPlacement(
        placementId, 
        updateData
      );
      
      if (updateError) {
        console.error('Error updating placement:', updateError);
        setError(new Error('Failed to update widget placement'));
        toast({
          title: "Error",
          description: "Failed to update widget placement.",
          variant: "destructive"
        });
        return false;
      }
      
      return true;
    } catch (err) {
      console.error('Error updating placement:', err);
      setError(err instanceof Error ? err : new Error('Unknown error updating placement'));
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Load placements on mount and when dependencies change
  useEffect(() => {
    loadPlacements();
  }, [loadPlacements]);
  
  return {
    isLoading,
    error,
    loadPlacements,
    savePlacement,
    deletePlacement,
    updatePlacement
  };
} 