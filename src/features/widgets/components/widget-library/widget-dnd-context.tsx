// my-app/src/features/widgets/components/widget-library/widget-dnd-context.tsx

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { Widget, WidgetConfigData, WidgetSizeRatio } from '../../types';
import { WidgetRenderer } from '../widget-renderer';
import { SIZE_RATIO_TO_GRID, GRID_CELL_SIZE, GRID_GAP, WIDGET_BORDER_RADIUS } from '@/config/uiConfig';

// Function to calculate dimensions including gaps
const calculateDimensions = (widthUnits: number, heightUnits: number) => {
  const width = (GRID_CELL_SIZE * widthUnits) + (GRID_GAP * (widthUnits - 1));
  const height = (GRID_CELL_SIZE * heightUnits) + (GRID_GAP * (heightUnits - 1));
  return { width, height };
};

// Create your SIZE_RATIO_MAP based on the shared SIZE_RATIO_TO_GRID
const SIZE_RATIO_MAP: Record<WidgetSizeRatio, { width: number; height: number }> = Object.entries(SIZE_RATIO_TO_GRID).reduce(
  (acc, [ratio, dimensions]) => ({
    ...acc,
    [ratio]: calculateDimensions(
      dimensions.width, 
      dimensions.height
    )
  }), 
  {} as Record<WidgetSizeRatio, { width: number; height: number }>
);

interface WidgetDndContextProps {
  children: ReactNode;
  onDragEnd?: (widget: Widget, configuration: WidgetConfigData) => void;
}

interface WidgetDndContextValue {
  activeWidget: Widget | null;
  activeConfiguration: WidgetConfigData | null;
}

const WidgetDndContext = createContext<WidgetDndContextValue>({
  activeWidget: null,
  activeConfiguration: null,
});

export const useWidgetDnd = () => useContext(WidgetDndContext);

// Enhanced DND_STYLES with better feedback
const DND_STYLES = `
  .widget-library {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }
  
  .ios-widget-grid {
    display: grid;
    grid-template-rows: repeat(4, ${GRID_CELL_SIZE}px);
    grid-auto-flow: column;
    grid-auto-columns: ${GRID_CELL_SIZE}px;
    gap: ${GRID_GAP}px;
    padding: 0;
    justify-content: start;
    background-color: transparent;
    width: max-content;
  }
  
  .widget-container {
    position: relative;
    background-color: transparent;
    transition: transform 0.15s ease-in-out, opacity 0.15s ease-in-out;
  }
  
  .widget-container:hover {
    transform: translateY(-2px);
    opacity: 0.95;
  }
  
  /* Draggable widget styles */
  .widget-draggable {
    cursor: grab;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  
  .widget-draggable:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(0,0,0,0.1);
  }
  
  .widget-draggable:active {
    cursor: grabbing;
  }
  
  /* Size classes with exact dimensions */
  .widget-size-1-1 { 
    grid-row: span 1; 
    grid-column: span 1;
    width: ${GRID_CELL_SIZE}px !important;
    height: ${GRID_CELL_SIZE}px !important;
  }
  
  .widget-size-2-2 { 
    grid-row: span 2; 
    grid-column: span 2;
    width: ${calculateDimensions(2, 2).width}px !important;
    height: ${calculateDimensions(2, 2).height}px !important;
  }
  
  /* Overlay styles */
  .ios-drag-overlay {
    transform: scale(1.05);
    opacity: 0.9;
    box-shadow: 0 8px 25px rgba(0,0,0,0.2);
    pointer-events: none;
    transition: transform 0.15s ease-out;
    position: relative;
  }
  
  .widget-label {
    position: absolute;
    bottom: 8px;
    left: 50%;
    transform: translateX(-50%);
    background-color: rgba(0,0,0,0.7);
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    white-space: nowrap;
    z-index: 10;
    opacity: 0.9;
    pointer-events: none;
  }
`;

export const WidgetDndProvider: React.FC<WidgetDndContextProps> = ({
  children,
  onDragEnd,
}) => {
  const [activeWidget, setActiveWidget] = useState<Widget | null>(null);
  const [activeConfiguration, setActiveConfiguration] = useState<WidgetConfigData | null>(null);
  
  // Configure sensors with improved sensitivity
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Reduced from 8px to make dragging more responsive
      },
    })
  );
  
  const handleDragStart = (event: DragStartEvent) => {
    const { widget, configuration } = event.active.data.current || {};
    setActiveWidget(widget || null);
    setActiveConfiguration(configuration || null);
  };
  
  const handleDragEnd = (_event: DragEndEvent) => {
    if (activeWidget && activeConfiguration && onDragEnd) {
      onDragEnd(activeWidget, activeConfiguration);
    }
    
    // Reset active widget
    setActiveWidget(null);
    setActiveConfiguration(null);
  };
  
  // Add useEffect to inject styles
  useEffect(() => {
    const styleId = 'widget-dnd-styles';
    if (!document.getElementById(styleId)) {
      const styleElement = document.createElement('style');
      styleElement.id = styleId;
      styleElement.textContent = DND_STYLES;
      document.head.appendChild(styleElement);
    }

    return () => {
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);
  
  return (
    <WidgetDndContext.Provider value={{ activeWidget, activeConfiguration }}>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {children}
        
        <DragOverlay dropAnimation={null}>
          {activeWidget && activeConfiguration && (
            <div 
              className="ios-drag-overlay" 
              style={{
                opacity: 0.85,
                transform: 'scale(1.05)',
                pointerEvents: 'none',
                overflow: 'hidden',
                borderRadius: activeWidget.shape === 'circle' ? '50%' : WIDGET_BORDER_RADIUS,
                backgroundColor: 'white',
                width: activeWidget.shape === 'circle' 
                  ? `${Math.min(
                      SIZE_RATIO_MAP[activeWidget.size_ratio as WidgetSizeRatio]?.width || 120,
                      SIZE_RATIO_MAP[activeWidget.size_ratio as WidgetSizeRatio]?.height || 120
                    )}px`
                  : `${SIZE_RATIO_MAP[activeWidget.size_ratio as WidgetSizeRatio]?.width || 120}px`,
                height: activeWidget.shape === 'circle'
                  ? `${Math.min(
                      SIZE_RATIO_MAP[activeWidget.size_ratio as WidgetSizeRatio]?.width || 120,
                      SIZE_RATIO_MAP[activeWidget.size_ratio as WidgetSizeRatio]?.height || 120
                    )}px`
                  : `${SIZE_RATIO_MAP[activeWidget.size_ratio as WidgetSizeRatio]?.height || 120}px`,
                boxShadow: '0 10px 25px rgba(0,0,0,0.15), 0 0 0 2px rgba(var(--primary), 0.3)',
                transition: 'transform 100ms ease',
              }}
            >
              {/* Always show size label for clearer feedback */}
              <div 
                className="widget-label"
                style={{ zIndex: 10 }}
              >
                {activeWidget.name} ({activeWidget.size_ratio.replace(':', '×')})
              </div>
              
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                aspectRatio: activeWidget.shape === 'circle' ? '1 / 1' : undefined,
              }}>
                <WidgetRenderer
                  widget={activeWidget}
                  configuration={activeConfiguration}
                  width={activeWidget.shape === 'circle' 
                    ? Math.min(
                        SIZE_RATIO_MAP[activeWidget.size_ratio as WidgetSizeRatio]?.width || 120,
                        SIZE_RATIO_MAP[activeWidget.size_ratio as WidgetSizeRatio]?.height || 120
                      )
                    : SIZE_RATIO_MAP[activeWidget.size_ratio as WidgetSizeRatio]?.width || 120}
                  height={activeWidget.shape === 'circle'
                    ? Math.min(
                        SIZE_RATIO_MAP[activeWidget.size_ratio as WidgetSizeRatio]?.width || 120,
                        SIZE_RATIO_MAP[activeWidget.size_ratio as WidgetSizeRatio]?.height || 120
                      )
                    : SIZE_RATIO_MAP[activeWidget.size_ratio as WidgetSizeRatio]?.height || 120}
                  borderRadius={activeWidget.shape === 'circle' ? '50%' : WIDGET_BORDER_RADIUS}
                  style={{ 
                    backgroundColor: 'white',
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    position: 'relative',
                    aspectRatio: activeWidget.shape === 'circle' ? '1 / 1' : undefined,
                  }}
                />
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </WidgetDndContext.Provider>
  );
};

// Update the dragStyles with enhanced visual feedback
const dragStyles = `
  .ios-drag-overlay {
    transform: scale(1.05);
    opacity: 0.95;
    box-shadow: 0 8px 25px rgba(0,0,0,0.15), 0 0 0 2px rgba(var(--primary), 0.3);
    pointer-events: none;
    background-color: white;
    overflow: hidden;
    z-index: 1000;
  }
  
  .ios-drag-overlay::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(to bottom right, rgba(var(--primary), 0.05), transparent);
    pointer-events: none;
  }
`;

// Add the styles to the document
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = dragStyles;
  document.head.appendChild(styleElement);
} 
