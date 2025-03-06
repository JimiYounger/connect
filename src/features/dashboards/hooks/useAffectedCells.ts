// my-app/src/features/dashboards/hooks/useAffectedCells.ts

import { useMemo } from 'react';
import { useDndContext } from '@dnd-kit/core';
import { SIZE_RATIO_TO_GRID, WidgetSizeRatio } from '@/config/uiConfig';
import { 
  GridCell, 
  findValidPosition, 
  validatePlacement, 
} from '@/utils/gridUtils';

// Define the props type (removing isOccupied as it's unused)
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
      return { isAffected: false, isValid: false, affectedCells: [], placementPosition: null };
    }
    
    // Get widget dimensions
    const sizeRatio = activeWidget.size_ratio || '1:1';
    const dimensions = SIZE_RATIO_TO_GRID[sizeRatio as WidgetSizeRatio];
    const { width, height } = dimensions;
    
    // Determine if this is a large widget that needs special handling
    const isLargeWidget = width >= 3 || height >= 3;

    // Track which cell we're directly over (from dnd-kit)
    const overX = over?.data?.current?.x ?? null;
    const overY = over?.data?.current?.y ?? null;
    
    // For moving widgets, use the current cell's position as anchor point
    if (activeDragType === 'move') {
      const activeData = active?.data?.current;
      if (!activeData) {
        return { isAffected: false, isValid: false, affectedCells: [], placementPosition: null };
      }
      
      // If we're not over any cell, exit early
      if (overX === null || overY === null) {
        return { isAffected: false, isValid: false, affectedCells: [], placementPosition: null };
      }
      
      // Calculate centered placement position
      let placementX = Math.max(0, Math.min(overX - Math.floor(activeData.width / 2), cols - activeData.width));
      let placementY = Math.max(0, Math.min(overY - Math.floor(activeData.height / 2), rows - activeData.height));

      // For large widgets, try to snap to even grid positions
      if (isLargeWidget) {
        // Try to snap to even grid positions for better alignment
        if (activeData.width >= 4 || activeData.height >= 4) {
          // For very large widgets, prefer positions divisible by 4
          placementX = Math.floor(placementX / 4) * 4;
          placementY = Math.floor(placementY / 4) * 4;
        } else if (activeData.width >= 2 || activeData.height >= 2) {
          // For medium widgets, prefer positions divisible by 2
          placementX = Math.floor(placementX / 2) * 2;
          placementY = Math.floor(placementY / 2) * 2;
        }
        
        // Make sure we're still in bounds after snapping
        placementX = Math.max(0, Math.min(placementX, cols - activeData.width));
        placementY = Math.max(0, Math.min(placementY, rows - activeData.height));
      }

      // Validate the potential placement
      const { isValid } = validatePlacement(
        placementX, 
        placementY, 
        activeData.width, 
        activeData.height,
        grid,
        cols,
        rows
      );
      
      if (isValid) {
        const cells = [];
        for (let dy = 0; dy < activeData.height; dy++) {
          for (let dx = 0; dx < activeData.width; dx++) {
            cells.push({ x: placementX + dx, y: placementY + dy });
          }
        }
        
        const cellIsAffected = cells.some(cell => cell.x === x && cell.y === y);
        
        return { 
          isAffected: cellIsAffected, 
          isValid: true, 
          affectedCells: cells,
          placementPosition: { x: placementX, y: placementY }
        };
      }
      
      // Try to find another valid position
      const validPosition = findValidPosition(
        overX, 
        overY, 
        activeData.width, 
        activeData.height,
        grid,
        cols,
        rows
      );
      
      if (validPosition) {
        const cells = [];
        for (let dy = 0; dy < activeData.height; dy++) {
          for (let dx = 0; dx < activeData.width; dx++) {
            cells.push({ x: validPosition.x + dx, y: validPosition.y + dy });
          }
        }
        
        const cellIsAffected = cells.some(cell => cell.x === x && cell.y === y);
        
        return { 
          isAffected: cellIsAffected, 
          isValid: true, 
          affectedCells: cells,
          placementPosition: validPosition
        };
      }
    }
    
    // For new widget placement
    if (overX === null || overY === null) {
      return { isAffected: false, isValid: false, affectedCells: [], placementPosition: null };
    }
    
    // Calculate centered placement
    let placementX = Math.max(0, Math.min(overX - Math.floor(width / 2), cols - width));
    let placementY = Math.max(0, Math.min(overY - Math.floor(height / 2), rows - height));
    
    // For large widgets, try to snap to even grid positions
    if (isLargeWidget) {
      // Try to snap to even grid positions for better alignment
      if (width >= 4 || height >= 4) {
        // For very large widgets, prefer positions divisible by 4
        placementX = Math.floor(placementX / 4) * 4;
        placementY = Math.floor(placementY / 4) * 4;
      } else if (width >= 2 || height >= 2) {
        // For medium widgets, prefer positions divisible by 2
        placementX = Math.floor(placementX / 2) * 2;
        placementY = Math.floor(placementY / 2) * 2;
      }
      
      // Make sure we're still in bounds after snapping
      placementX = Math.max(0, Math.min(placementX, cols - width));
      placementY = Math.max(0, Math.min(placementY, rows - height));
    }
    
    // Validate placement
    const { isValid } = validatePlacement(
      placementX, 
      placementY, 
      width, 
      height,
      grid,
      cols,
      rows
    );
    
    if (isValid) {
      const cells = [];
      for (let dy = 0; dy < height; dy++) {
        for (let dx = 0; dx < width; dx++) {
          cells.push({ x: placementX + dx, y: placementY + dy });
        }
      }
      
      const cellIsAffected = cells.some(cell => cell.x === x && cell.y === y);
      
      return { 
        isAffected: cellIsAffected, 
        isValid: true, 
        affectedCells: cells,
        placementPosition: { x: placementX, y: placementY }
      };
    }
    
    // If direct placement is not valid, try to find a valid position
    const validPosition = findValidPosition(
      overX, 
      overY, 
      width, 
      height,
      grid,
      cols,
      rows
    );
    
    if (validPosition) {
      const cells = [];
      for (let dy = 0; dy < height; dy++) {
        for (let dx = 0; dx < width; dx++) {
          cells.push({ x: validPosition.x + dx, y: validPosition.y + dy });
        }
      }
      
      const cellIsAffected = cells.some(cell => cell.x === x && cell.y === y);
      
      return { 
        isAffected: cellIsAffected, 
        isValid: true, 
        affectedCells: cells,
        placementPosition: validPosition
      };
    }
    
    return { isAffected: false, isValid: false, affectedCells: [], placementPosition: null };
  }, [active, over, activeWidget, activeDragType, x, y, grid, cols, rows]);
}