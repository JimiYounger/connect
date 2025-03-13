// src/features/homepage/components/Dashboard/Dashboard.tsx
'use client'

import { useUserDashboard } from '@/features/content/hooks/useUserContent'
import { useMediaQuery } from '@/hooks/use-media-query'
import { 
  GRID_CELL_SIZE, 
  GRID_GAP,
  WIDGET_BORDER_RADIUS
} from '@/config/uiConfig'
import { WidgetRenderer } from '@/features/widgets/components/widget-renderer'
import { useEffect } from 'react'
import { initializeWidgets } from '@/features/widgets/init-widgets'
import '@/features/widgets/styles/widget-library.css'

// Grid dimensions matching the dashboard editor
const DESKTOP_GRID = { rows: 4, cols: 11 };
const MOBILE_GRID = { rows: 11, cols: 4 };

export function Dashboard() {
  const { data: dashboard, isLoading, error } = useUserDashboard()
  // Use the same breakpoint as the dashboard editor (1024px)
  const isMobile = useMediaQuery('(max-width: 1023px)')
  
  // Initialize widgets on component mount
  useEffect(() => {
    const init = async () => {
      await initializeWidgets()
    }
    init()
  }, [])
  
  if (isLoading) {
    return (
      <div className="w-full p-8 bg-accent/10 animate-pulse rounded-lg flex items-center justify-center">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="w-full p-8 bg-destructive/10 rounded-lg flex items-center justify-center">
        <p className="text-destructive">Error loading dashboard</p>
      </div>
    )
  }
  
  if (!dashboard?.widgets || dashboard.widgets.length === 0) {
    return (
      <div className="w-full p-8 bg-accent/10 rounded-lg flex items-center justify-center">
        <p className="text-muted-foreground">No dashboard widgets available</p>
      </div>
    )
  }

  // Get widgets for the current layout
  const layoutType = isMobile ? 'mobile' : 'desktop';
  
  // Filter widgets based on layout_type
  const filteredWidgets = dashboard.widgets.filter(widget => {
    if (!widget.placement) return false;
    
    // If widget has a specific layout_type, check if it matches current layout
    if (widget.placement.layout_type) {
      return widget.placement.layout_type === layoutType;
    }
    
    // If no layout_type specified, show on desktop by default
    return layoutType === 'desktop';
  });

  return (
    <div>
      {/* Grid Container Wrapper */}
      <div className="flex justify-center w-full">
        <div className="dashboard-grid-container" style={{
          width: isMobile ? '100%' : 'fit-content',
          maxWidth: '100%',
          padding: '1rem',
        }}>
          {/* Desktop Layout */}
          {!isMobile && (
            <div 
              className="ios-widget-grid dashboard-grid" 
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${DESKTOP_GRID.cols}, ${GRID_CELL_SIZE}px)`,
                gridAutoRows: `${GRID_CELL_SIZE}px`,
                gap: `${GRID_GAP}px`,
              }}
            >
              {filteredWidgets.map((widget) => {
                if (!widget.placement) return null;
                
                const position_x = widget.placement.position_x || 0;
                const position_y = widget.placement.position_y || 0;
                const width = widget.placement.width || 1;
                const height = widget.placement.height || 1;
                
                const isCircle = widget.shape === 'circle';
                
                // Calculate dimensions including gaps
                const totalWidth = (width * GRID_CELL_SIZE) + ((width - 1) * GRID_GAP);
                const totalHeight = (height * GRID_CELL_SIZE) + ((height - 1) * GRID_GAP);
                
                return (
                  <div 
                    key={widget.id}
                    className="widget-container"
                    style={{
                      gridColumnStart: position_x + 1,
                      gridColumnEnd: position_x + width + 1,
                      gridRowStart: position_y + 1,
                      gridRowEnd: position_y + height + 1,
                      borderRadius: isCircle ? '50%' : WIDGET_BORDER_RADIUS,
                    }}
                  >
                    <div 
                      className="widget-card placed-widget"
                      style={{
                        width: isCircle ? Math.min(totalWidth, totalHeight) : totalWidth,
                        height: isCircle ? Math.min(totalWidth, totalHeight) : totalHeight,
                        borderRadius: isCircle ? '50%' : WIDGET_BORDER_RADIUS,
                      }}
                    >
                      <WidgetRenderer
                        widget={widget}
                        configuration={widget.config}
                        width={isCircle ? Math.min(totalWidth, totalHeight) : totalWidth}
                        height={isCircle ? Math.min(totalWidth, totalHeight) : totalHeight}
                        borderRadius={isCircle ? '50%' : WIDGET_BORDER_RADIUS}
                        className="widget-renderer"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Mobile Layout */}
          {isMobile && (
            <div 
              className="ios-widget-grid dashboard-grid" 
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${MOBILE_GRID.cols}, ${GRID_CELL_SIZE}px)`,
                gridAutoRows: `${GRID_CELL_SIZE}px`,
                gap: `${GRID_GAP}px`,
                margin: '0 auto',
              }}
            >
              {filteredWidgets.map((widget) => {
                if (!widget.placement) return null;
                
                const position_x = widget.placement.position_x || 0;
                const position_y = widget.placement.position_y || 0;
                const width = widget.placement.width || 1;
                const height = widget.placement.height || 1;
                
                const isCircle = widget.shape === 'circle';
                
                // Calculate dimensions including gaps
                const totalWidth = (width * GRID_CELL_SIZE) + ((width - 1) * GRID_GAP);
                const totalHeight = (height * GRID_CELL_SIZE) + ((height - 1) * GRID_GAP);
                
                return (
                  <div 
                    key={widget.id}
                    className="widget-container"
                    style={{
                      gridColumnStart: position_x + 1,
                      gridColumnEnd: position_x + width + 1,
                      gridRowStart: position_y + 1,
                      gridRowEnd: position_y + height + 1,
                      borderRadius: isCircle ? '50%' : WIDGET_BORDER_RADIUS,
                      // Add these for circle widgets:
                      ...(isCircle && {
                        aspectRatio: '1 / 1',
                        justifySelf: 'center', // Center in grid cell
                        alignSelf: 'center',
                      }),
                    }}
                  >
                    <div 
                      className="widget-card placed-widget"
                      style={{
                        width: isCircle ? Math.min(totalWidth, totalHeight) : totalWidth,
                        height: isCircle ? Math.min(totalWidth, totalHeight) : totalHeight,
                        borderRadius: isCircle ? '50%' : WIDGET_BORDER_RADIUS,
                      }}
                    >
                      <WidgetRenderer
                        widget={widget}
                        configuration={widget.config}
                        width={isCircle ? Math.min(totalWidth, totalHeight) : totalWidth}
                        height={isCircle ? Math.min(totalWidth, totalHeight) : totalHeight}
                        borderRadius={isCircle ? '50%' : WIDGET_BORDER_RADIUS}
                        className="widget-renderer"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}