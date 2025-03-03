// my-app/src/features/widgets/components/widget-library/widget-dnd-context.tsx

import React, { createContext, useContext, useState, ReactNode } from 'react';
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
        borderRadius: activeWidget.shape === 'circle' ? '50%' : '50px', // Match the 50px border-radius
        backgroundColor: 'white', // Set explicit background color
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