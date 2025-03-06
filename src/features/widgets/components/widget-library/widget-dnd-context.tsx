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

// Update the DND_STYLES
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
  
  /* Add similar rules for other sizes */
`;

export const WidgetDndProvider: React.FC<WidgetDndContextProps> = ({
  children,
  onDragEnd,
}) => {
  const [activeWidget, setActiveWidget] = useState<Widget | null>(null);
  const [activeConfiguration, setActiveConfiguration] = useState<WidgetConfigData | null>(null);
  
  // Configure sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px of movement required before drag starts
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
                opacity: 0.8,
                transform: 'scale(1.02)',
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
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                transition: 'transform 100ms ease',
              }}
            >
              {(activeWidget.size_ratio === '4:4' || 
                activeWidget.size_ratio === '4:2' || 
                activeWidget.size_ratio === '2:4') && (
                <div 
                  className="absolute top-2 right-2 px-2 py-1 bg-black/50 text-white text-xs rounded-full"
                  style={{ zIndex: 10 }}
                >
                  {activeWidget.size_ratio.replace(':', '×')}
                </div>
              )}
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

// Update the dragStyles
const dragStyles = `  .ios-drag-overlay {
    transform: scale(1.05);
    opacity: 0.9;
    box-shadow: 0 8px 20px rgba(0,0,0,0.15);
    pointer-events: none;
    background-color: white;
    overflow: hidden;
  }
`;

// Add the styles to the document
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = dragStyles;
  document.head.appendChild(styleElement);
} 
