// my-app/src/features/widgets/components/dashboard-view.tsx

'use client';

import React, { useEffect, useState } from 'react';
import { useWidgets } from '../hooks/use-widgets';
import { WidgetGrid } from './widget-grid';
import { widgetService } from '../services/widget-service';
import { dashboardService } from '../services/dashboard-service';
import { 
  Widget, 
  WidgetPlacement as _ImportedWidgetPlacement,
  DraftWidgetPlacement as ImportedDraftWidgetPlacement,
  PublishedWidgetPlacement as ImportedPublishedWidgetPlacement
} from '../types';
import { useAuth } from '@/features/auth/context/auth-context';
import { Layout } from 'react-grid-layout';

interface DashboardViewProps {
  dashboardId: string;
  isDraft?: boolean;
  className?: string;
}

// Update the type to match the new schema
type PublishedWidgetPlacement = ImportedPublishedWidgetPlacement & {
  version_id: string; // Add this to match our DB schema
};

type DraftWidgetPlacement = ImportedDraftWidgetPlacement;

type WidgetPlacement = PublishedWidgetPlacement | DraftWidgetPlacement;

export function DashboardView({ dashboardId, isDraft = false, className }: DashboardViewProps) {
  const { session, profile: _profile } = useAuth();
  const userId = session?.user.id;
  
  const [placements, setPlacements] = useState<WidgetPlacement[]>([]);
  const [placementsLoading, setPlacementsLoading] = useState(true);
  const [placementsError, setPlacementsError] = useState<Error | null>(null);
  
  // Track rendered widgets to prevent duplicate tracking
  const renderedWidgets = React.useRef(new Set<string>());
  
  // Fetch widgets available to this user
  const { 
    widgets, 
    isLoading: widgetsLoading, 
    error: widgetsError 
  } = useWidgets({
    userId: userId || '',
    enabled: !!userId,
  });
  
  // Create a map of widgets by ID for easy lookup
  const widgetsById = widgets.reduce<Record<string, Widget>>((acc, widget) => {
    acc[widget.id] = widget;
    return acc;
  }, {});
  
  // Fetch widget placements for this dashboard
  useEffect(() => {
    if (!dashboardId || !userId) return;
    
    async function fetchPlacements() {
      setPlacementsLoading(true);
      setPlacementsError(null);
      
      try {
        if (isDraft) {
          // For draft view, first get the draft then its placements
          const { data: drafts, error: draftError } = await dashboardService.getDraftsForDashboard(dashboardId);
          
          if (draftError) throw draftError;
          if (!drafts || drafts.length === 0) {
            throw new Error(`No drafts found for dashboard ${dashboardId}`);
          }
          
          // Use the first draft (or we could look for the "current" draft)
          const currentDraft = drafts[0];
          
          // Now get placements for this draft
          const { data, error } = await dashboardService.getDraftWidgetPlacements(currentDraft.id);
          
          if (error) throw error;
          setPlacements(data || [] as unknown as WidgetPlacement[]);
        } else {
          // For published view, first get the active version
          const { data: version, error: versionError } = await dashboardService.getActiveDashboardVersion(dashboardId);
          
          if (versionError) throw versionError;
          if (!version) {
            throw new Error(`No active version found for dashboard ${dashboardId}`);
          }
          
          // Now get placements for this version
          const { data, error } = await dashboardService.getWidgetPlacementsForVersion(version.id);
          
          if (error) throw error;
          setPlacements(data || [] as unknown as WidgetPlacement[]);
        }
      } catch (err) {
        console.error('Error fetching dashboard placements:', err);
        setPlacementsError(err as Error);
      } finally {
        setPlacementsLoading(false);
      }
    }
    
    fetchPlacements();
  }, [dashboardId, userId, isDraft]);
  
  // Track widget view when it is rendered
  const handleWidgetRender = (widgetId: string) => {
    if (!userId || renderedWidgets.current.has(widgetId)) return;
    
    renderedWidgets.current.add(widgetId);
    widgetService.trackWidgetInteraction(widgetId, userId, 'view');
  };
  
  // Track widget interactions
  const handleWidgetInteraction = (widgetId: string, interactionType: string) => {
    if (!userId) return;
    
    widgetService.trackWidgetInteraction(widgetId, userId, interactionType);
  };
  
  // Handle layout changes
  const handleLayoutChange = (currentLayout: Layout[]) => {
    // Optionally save layout changes to the backend
    console.log('Layout changed', currentLayout);
    
    // Here you could implement persistence to your backend
    // if you want server-side layout storage:
    /*
    if (userId && dashboardId) {
      dashboardService.saveLayout(dashboardId, currentLayout, userId, isDraft);
    }
    */
  };
  
  // Handle loading states
  const isLoading = widgetsLoading || placementsLoading;
  
  // Handle errors
  const error = widgetsError || placementsError;
  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md text-red-800">
        <h3 className="text-lg font-semibold">Error Loading Dashboard</h3>
        <p>{error.message}</p>
      </div>
    );
  }
  
  // Show message if user doesn't have access to any widgets
  if (!isLoading && (!widgets.length || !placements.length)) {
    return (
      <div className="bg-gray-50 p-8 rounded-lg text-center">
        <h3 className="text-xl font-semibold text-gray-700">No Dashboard Content</h3>
        <p className="text-gray-500 mt-2">
          {!widgets.length 
            ? "You don't have access to any widgets."
            : "This dashboard doesn't have any widgets configured."}
        </p>
      </div>
    );
  }
  
  return (
    <div className={`dashboard-view ${className || ''}`}>
      <WidgetGrid
        placements={placements}
        widgets={widgetsById}
        onWidgetRender={handleWidgetRender}
        onWidgetInteraction={handleWidgetInteraction}
        onLayoutChange={handleLayoutChange}
        isLoading={isLoading}
        className="py-4"
        isDraggable={false} // Set to false for both draft & published views (read-only)
        isResizable={false} // Set to false for both draft & published views (read-only)
        saveLayout={false}  // Don't save layout changes from the viewer
        userId={userId}
      />
    </div>
  );
} 