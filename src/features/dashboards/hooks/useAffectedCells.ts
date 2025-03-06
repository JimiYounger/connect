// my-app/src/features/dashboards/hooks/useAffectedCells.ts

import { useMemo } from 'react';
import { useDndContext } from '@dnd-kit/core';
import { SIZE_RATIO_TO_GRID, WidgetSizeRatio } from '@/config/uiConfig';
import { 
  GridCell, 
  findValidPosition, 
  validatePlacement, 
} from '@/utils/gridUtils';

// Define the props type
interface UseCellDroppableProps {
  x: number;
  y: number;
  grid: GridCell[][];
  cols: number;
  rows: number;
}

export function useAffectedCells({ x, y, grid, cols, rows }: UseCellDroppableProps) {
  const { active, over } = useDndContext();
  const activeWidget = active?.data?.current?.widget;
  const activeDragType = active?.data?.current?.type;
  
  return useMemo(() => {
    // If no active widget, return empty state
    if (!activeWidget) {
      return { isAffected: false, isValid: false, affectedCells: [] };
    }
    
    // Get widget dimensions
    const sizeRatio = activeWidget.size_ratio || '1:1';
    const dimensions = SIZE_RATIO_TO_GRID[sizeRatio as WidgetSizeRatio];
    const { width, height } = dimensions;
    
    // Track which cell we're directly over (from dnd-kit)
    const overX = over?.data?.current?.x ?? null;
    const overY = over?.data?.current?.y ?? null;
    
    if (overX === null || overY === null) {
      return { isAffected: false, isValid: false, affectedCells: [] };
    }
    
    // Simple approach: Check if this cell would be part of the widget if placed at cursor
    // For both new placement and moving widgets
    
    // Is this cell within the widget area if the widget's top-left is at the cursor?
    const topLeftX = Math.min(overX, cols - width); // Adjust if would go off grid
    const topLeftY = Math.min(overY, rows - height); // Adjust if would go off grid
    
    // Check if our current cell (x,y) is within the widget's area
    const isWithinWidget = 
      x >= topLeftX && x < topLeftX + width &&
      y >= topLeftY && y < topLeftY + height;
    
    // If this cell is affected, check if placement would be valid
    if (isWithinWidget) {
      // Validate placement at cursor position (adjusted for grid boundaries)
      const { isValid } = validatePlacement(
        topLeftX, topLeftY, width, height, grid, cols, rows
      );
      
      return { 
        isAffected: true, 
        isValid: isValid,
        affectedCells: []  // We don't need to calculate all affected cells here
      };
    }
    
    return { isAffected: false, isValid: false, affectedCells: [] };
  }, [active, over, activeWidget, activeDragType, x, y, grid, cols, rows]);
}