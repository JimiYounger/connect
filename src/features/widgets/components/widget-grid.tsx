// my-app/src/features/widgets/components/widget-grid.tsx

import React, { useState, useEffect } from 'react';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { WidgetPlacement, Widget } from '../types';
import { DefaultWidget, withStandardWidget } from './base-widget';

// Widget renderer component that handles the onRender callback
function WidgetRenderer({ 
  widget, 
  placement, 
  onRender, 
  onInteraction 
}: { 
  widget: Widget; 
  placement: WidgetPlacement; 
  onRender: () => void; 
  onInteraction: (type: string) => void; 
}) {
  const EnhancedDefaultWidget = withStandardWidget(DefaultWidget);
  
  // Call onRender when the component mounts
  useEffect(() => {
    onRender();
  }, [onRender]);
  
  return (
    <EnhancedDefaultWidget
      id={widget.id}
      widget={widget}
      width={placement.width * 100}  // Approximate pixel width
      height={placement.height * 100} // Approximate pixel height
      onInteraction={onInteraction}
    />
  );
}

// Enable responsive features with width provider
const ResponsiveGridLayout = WidthProvider(Responsive);

export interface WidgetGridProps {
  placements: WidgetPlacement[];
  widgets: Record<string, Widget>;
  onWidgetRender?: (widgetId: string) => void;
  onWidgetInteraction?: (widgetId: string, interactionType: string) => void;
  onLayoutChange?: (layout: Layout[], allLayouts: { [breakpoint: string]: Layout[] }) => void;
  isLoading?: boolean;
  className?: string;
  isDraggable?: boolean;
  isResizable?: boolean;
  saveLayout?: boolean;
  userId?: string;
}

/**
 * React Grid Layout-based widget grid component with drag-and-drop support
 */
export function WidgetGrid({
  placements,
  widgets,
  onWidgetRender,
  onWidgetInteraction,
  onLayoutChange,
  isLoading,
  className,
  isDraggable = true,
  isResizable = true,
  saveLayout = true,
  userId
}: WidgetGridProps) {
  // Convert placements to react-grid-layout format
  const createLayoutFromPlacements = (placements: WidgetPlacement[]): { [breakpoint: string]: Layout[] } => {
    // Create layouts for different breakpoints
    const layouts: { [breakpoint: string]: Layout[] } = {
      lg: [],
      md: [],
      sm: [],
      xs: []
    };

    placements.forEach(placement => {
      // Base layout (for large screens)
      const baseLayout: Layout = {
        i: placement.id,
        x: placement.position_x,
        y: placement.position_y,
        w: placement.width,
        h: placement.height,
        minW: 1,
        minH: 1
      };

      // Add to large layout
      layouts.lg.push({...baseLayout});

      // Medium screens: Keep same position but potentially reduce size
      layouts.md.push({
        ...baseLayout,
        w: Math.min(placement.width, 6) // Max 6 columns on medium
      });

      // Small screens: Stack vertically, 4 columns max
      layouts.sm.push({
        ...baseLayout,
        w: Math.min(placement.width, 4), // Max 4 columns on small
        x: placement.position_x % 4, // Wrap to 4-column grid
      });

      // Extra small: Full width, stacked vertically
      layouts.xs.push({
        ...baseLayout,
        x: 0,
        w: 2, // Full width on mobile
      });
    });

    return layouts;
  };

  // Create initial layouts
  const [layouts, setLayouts] = useState(() => createLayoutFromPlacements(placements));

  // Update layouts when placements change
  useEffect(() => {
    setLayouts(createLayoutFromPlacements(placements));
  }, [placements]);

  // Load saved layouts if available
  useEffect(() => {
    if (saveLayout && userId) {
      const savedLayouts = localStorage.getItem(`dashboard-layout-${userId}`);
      if (savedLayouts) {
        try {
          setLayouts(JSON.parse(savedLayouts));
        } catch (e) {
          console.error('Failed to parse saved layout', e);
        }
      }
    }
  }, [saveLayout, userId]);

  // Handle layout changes
  const handleLayoutChange = (currentLayout: Layout[], allLayouts: { [breakpoint: string]: Layout[] }) => {
    // Save to state
    setLayouts(allLayouts);
    
    // Save to localStorage if enabled
    if (saveLayout && userId) {
      localStorage.setItem(`dashboard-layout-${userId}`, JSON.stringify(allLayouts));
    }
    
    // Call external handler if provided
    if (onLayoutChange) {
      onLayoutChange(currentLayout, allLayouts);
    }
  };

  // Handle widget interaction that happens during drag
  const handleDragStart = (widgetId: string) => {
    if (onWidgetInteraction) {
      onWidgetInteraction(widgetId, 'drag-start');
    }
  };

  // Handle widget interaction that happens after drag ends
  const handleDragStop = (widgetId: string) => {
    if (onWidgetInteraction) {
      onWidgetInteraction(widgetId, 'drag-stop');
    }
  };

  return (
    <div className={`widget-grid-container ${className || ''}`}>
      {isLoading ? (
        <div className="flex justify-center p-8">
          <div className="animate-pulse flex space-x-4">
            <div className="h-12 w-12 bg-slate-200 rounded-full"></div>
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-slate-200 rounded w-3/4"></div>
              <div className="h-4 bg-slate-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      ) : placements.length === 0 ? (
        <div className="text-center p-8 text-gray-500">
          No widgets available for this dashboard.
        </div>
      ) : (
        <ResponsiveGridLayout
          className="layout"
          layouts={layouts}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480 }}
          cols={{ lg: 12, md: 8, sm: 6, xs: 2 }}
          rowHeight={100}
          margin={[16, 16]}
          containerPadding={[16, 16]}
          isDraggable={isDraggable}
          isResizable={isResizable}
          onLayoutChange={handleLayoutChange}
          onDragStart={(layout, oldItem, newItem) => handleDragStart(newItem.i)}
          onDragStop={(layout, oldItem, newItem) => handleDragStop(newItem.i)}
          draggableHandle=".widget-drag-handle"
        >
          {placements.map(placement => {
            const widget = widgets[placement.widget_id];
            
            if (!widget) return null;
            
            return (
              <div 
                key={placement.id} 
                className="bg-white rounded-lg shadow overflow-hidden"
              >
                <div className="widget-drag-handle px-4 py-2 bg-gray-50 cursor-move border-b flex justify-between items-center">
                  <h3 className="text-sm font-medium text-gray-700">{widget.name}</h3>
                  <div className="flex space-x-1">
                    <button className="text-gray-400 hover:text-gray-600 p-1" title="More options">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="1"></circle>
                        <circle cx="19" cy="12" r="1"></circle>
                        <circle cx="5" cy="12" r="1"></circle>
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <WidgetRenderer
                    widget={widget}
                    placement={placement}
                    onRender={() => onWidgetRender?.(widget.id)}
                    onInteraction={(type: string) => onWidgetInteraction?.(widget.id, type)}
                  />
                </div>
              </div>
            );
          })}
        </ResponsiveGridLayout>
      )}
    </div>
  );
} 