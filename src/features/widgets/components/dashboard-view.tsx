// my-app/src/features/widgets/components/dashboard-view.tsx

'use client';

import React, { useEffect, useState } from 'react';
import { useWidgets } from '../hooks/use-widgets';
import { WidgetGrid } from './widget-grid';
import { widgetService } from '../services/widget-service';
import { Widget } from '../types';
import { useAuth } from '@/features/auth/context/auth-context';
import { Layout } from 'react-grid-layout';

interface DashboardViewProps {
  dashboardId: string;
  isDraft?: boolean;
  className?: string;
}

type PublishedWidgetPlacement = {
  created_at: string | null;
  dashboard_version_id: string;
  height: number;
  id: string;
  layout_type: string;
  position_x: number;
  position_y: number;
  widget_id: string;
  width: number;
};

type DraftWidgetPlacement = {
  created_at: string | null;
  draft_id: string;
  height: number;
  id: string;
  layout_type: string;
  position_x: number;
  position_y: number;
  widget_id: string;
  width: number;
};

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
        const { data, error } = await widgetService.getWidgetPlacementsForDashboard(
          dashboardId, 
          isDraft
        );
        
        if (error) throw error;
        
        // Just set the data directly, no type assertion needed with any[] type
        setPlacements(data || []);
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
      widgetService.saveDashboardLayout(dashboardId, currentLayout, userId);
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
        isDraggable={!isDraft}
        isResizable={!isDraft}
        saveLayout={true}
        userId={userId}
      />
    </div>
  );
} 