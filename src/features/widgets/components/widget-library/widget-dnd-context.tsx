// my-app/src/features/widgets/components/widget-library/widget-dnd-context.tsx

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { Widget, WidgetConfigData, WidgetSizeRatio } from '../../types';
import { WidgetRenderer } from '../widget-renderer';

// Size ratio to pixel dimensions mapping (base size for 1:1)
const SIZE_RATIO_MAP: Record<WidgetSizeRatio, { width: number; height: number }> = {
  '1:1': { width: 86, height: 86 },       // Small square
  '2:1': { width: 172, height: 86 },      // Wide rectangle
  '1:2': { width: 86, height: 172 },      // Tall rectangle
  '3:2': { width: 257, height: 172 },     // Landscape (3:2 ratio)
  '2:3': { width: 172, height: 257 },     // Portrait (2:3 ratio)
  '4:3': { width: 343, height: 257 },     // Standard (4:3 ratio)
  '3:4': { width: 257, height: 343 },     // Vertical (3:4 ratio)
  '2:2': { width: 172, height: 172 },     // Medium square
  '4:4': { width: 343, height: 343 },     // Large square
  '2:4': { width: 172, height: 343 },     // Tall rectangle (2x4)
  '4:2': { width: 343, height: 172 },     // Wide rectangle (4x2)
};

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

const DND_STYLES = `
  .widget-library {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }
  
  .ios-widget-grid {
    display: grid;
    grid-template-rows: repeat(4, 74px);
    grid-auto-flow: column;
    grid-auto-columns: 74px;
    gap: 10px;
    padding: 0;
    justify-content: start;
    background-color: transparent;
    width: max-content;
  }
  
  .widget-container {
    position: relative;
    background-color: transparent;
  }
  
  /* Size classes - Updated for horizontal flow (rows and columns swapped) */
  .widget-size-1-1 { grid-row: span 1; grid-column: span 1; }
  .widget-size-2-1 { grid-row: span 1; grid-column: span 2; }
  .widget-size-1-2 { grid-row: span 2; grid-column: span 1; }
  .widget-size-2-2 { grid-row: span 2; grid-column: span 2; }
  .widget-size-3-2 { grid-row: span 2; grid-column: span 3; }
  .widget-size-2-3 { grid-row: span 3; grid-column: span 2; }
  .widget-size-4-2 { grid-row: span 2; grid-column: span 4; }
  .widget-size-2-4 { grid-row: span 4; grid-column: span 2; }
  .widget-size-4-3 { grid-row: span 3; grid-column: span 4; }
  .widget-size-3-4 { grid-row: span 4; grid-column: span 3; }
  .widget-size-4-4 { grid-row: span 4; grid-column: span 4; }
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
        
        <DragOverlay>
          {activeWidget && activeConfiguration && (
            <div className="ios-drag-overlay" style={{
              overflow: 'hidden',
              borderRadius: activeWidget.shape === 'circle' ? '50%' : '50px',
              backgroundColor: 'white',
              width: SIZE_RATIO_MAP[activeWidget.size_ratio as WidgetSizeRatio]?.width || 120,
              height: SIZE_RATIO_MAP[activeWidget.size_ratio as WidgetSizeRatio]?.height || 120,
            }}
            >
              <WidgetRenderer
                widget={activeWidget}
                configuration={activeConfiguration}
                width={SIZE_RATIO_MAP[activeWidget.size_ratio as WidgetSizeRatio]?.width || 120}
                height={SIZE_RATIO_MAP[activeWidget.size_ratio as WidgetSizeRatio]?.height || 120}
                borderRadius={activeWidget.shape === 'circle' ? '50%' : '50px'}
                style={{ backgroundColor: 'white' }}
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </WidgetDndContext.Provider>
  );
};

// Update the dragStyles
const dragStyles = `
  .ios-drag-overlay {
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