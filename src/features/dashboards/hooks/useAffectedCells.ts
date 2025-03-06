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
  
  // Use useMemo to prevent unnecessary recalculations
  return useMemo(() => {
    // If no active widget or no over data, return empty state
    if (!activeWidget) {
      return { isAffected: false, isValid: false, affectedCells: [], placementPosition: null, cursorPosition: null };
    }
    
    // Get widget dimensions
    const sizeRatio = activeWidget.size_ratio || '1:1';
    const dimensions = SIZE_RATIO_TO_GRID[sizeRatio as WidgetSizeRatio];
    const { width, height } = dimensions;
    
    // Track which cell we're directly over (from dnd-kit)
    const overX = over?.data?.current?.x ?? null;
    const overY = over?.data?.current?.y ?? null;
    
    // If we're not over any cell, exit early
    if (overX === null || overY === null) {
      return { isAffected: false, isValid: false, affectedCells: [], placementPosition: null, cursorPosition: null };
    }
    
    // Store the cursor position (where user is currently hovering)
    const cursorPosition = { x: overX, y: overY };
    
    // Calculate centered placement position - consistent for all widget sizes
    // This centers the widget on the cursor for more intuitive placement
    const placementX = Math.max(0, Math.min(overX - Math.floor(width / 2), cols - width));
    const placementY = Math.max(0, Math.min(overY - Math.floor(height / 2), rows - height));
    
    // For moving widgets, use the provided dimensions
    const activeWidth = activeDragType === 'move' ? active?.data?.current?.width || width : width;
    const activeHeight = activeDragType === 'move' ? active?.data?.current?.height || height : height;
    
    // Validate the potential placement
    const { isValid } = validatePlacement(
      placementX, 
      placementY, 
      activeWidth, 
      activeHeight,
      grid,
      cols,
      rows
    );
    
    // Always calculate affected cells based on cursor position for consistency
    // This makes the preview responsive to cursor movement
    const affectedCells = [];
    for (let dy = 0; dy < activeHeight; dy++) {
      for (let dx = 0; dx < activeWidth; dx++) {
        const cellX = placementX + dx;
        const cellY = placementY + dy;
        
        // Ensure we're within grid boundaries
        if (cellX >= 0 && cellX < cols && cellY >= 0 && cellY < rows) {
          affectedCells.push({ x: cellX, y: cellY });
        }
      }
    }
    
    // Check if this specific cell is affected
    const cellIsAffected = affectedCells.some(cell => cell.x === x && cell.y === y);
    
    // If the initial placement is valid, use it
    if (isValid) {
      return { 
        isAffected: cellIsAffected, 
        isValid: true, 
        affectedCells,
        placementPosition: { x: placementX, y: placementY },
        cursorPosition
      };
    }
    
    // If direct placement is not valid, try to find a valid position nearby
    const validPosition = findValidPosition(
      overX, 
      overY, 
      activeWidth, 
      activeHeight,
      grid,
      cols,
      rows
    );
    
    if (validPosition) {
      // Calculate new affected cells for the valid position
      const newAffectedCells = [];
      for (let dy = 0; dy < activeHeight; dy++) {
        for (let dx = 0; dx < activeWidth; dx++) {
          const cellX = validPosition.x + dx;
          const cellY = validPosition.y + dy;
          
          // Ensure we're within grid boundaries
          if (cellX >= 0 && cellX < cols && cellY >= 0 && cellY < rows) {
            newAffectedCells.push({ x: cellX, y: cellY });
          }
        }
      }
      
      // Check if this specific cell is affected by the valid position
      const newCellIsAffected = newAffectedCells.some(cell => cell.x === x && cell.y === y);
      
      return { 
        isAffected: newCellIsAffected, 
        isValid: true, 
        affectedCells: newAffectedCells,
        placementPosition: validPosition,
        cursorPosition
      };
    }
    
    // If no valid position found, still return cursor-centered placement for preview
    // but mark it as invalid for visual feedback
    return { 
      isAffected: cellIsAffected, 
      isValid: false, 
      affectedCells,
      placementPosition: { x: placementX, y: placementY },
      cursorPosition
    };
  }, [active, over, activeWidget, activeDragType, x, y, grid, cols, rows]);
}