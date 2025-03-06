// my-app/src/features/dashboards/hooks/useGridState.ts

import { useState, useCallback, useEffect } from 'react';
import { Widget } from '@/features/widgets/types';
import { GridCell, initializeGrid, placeWidgetOnGrid, removeWidgetFromGrid } from '@/utils/gridUtils';

interface UseGridStateProps {
  rows: number;
  cols: number;
}

export function useGridState({ rows, cols }: UseGridStateProps) {
  const [grid, setGrid] = useState<GridCell[][]>(() => initializeGrid(rows, cols));
  
  // Re-initialize grid when rows/cols change
  useEffect(() => {
    setGrid(initializeGrid(rows, cols));
  }, [rows, cols]);
  
  // Place a widget on the grid
  const placeWidget = useCallback((
    widget: Widget, 
    x: number, 
    y: number, 
    width: number, 
    height: number, 
    placementId: string,
    configuration?: any
  ) => {
    setGrid(prevGrid => 
      placeWidgetOnGrid(prevGrid, x, y, widget, placementId, width, height, configuration)
    );
  }, []);
  
  // Remove a widget from the grid
  const removeWidget = useCallback((
    x: number, 
    y: number, 
    width: number, 
    height: number
  ) => {
    setGrid(prevGrid => removeWidgetFromGrid(prevGrid, x, y, width, height));
  }, []);
  
  // Update grid with multiple placements at once
  const updateGridWithPlacements = useCallback((placements: any[]) => {
    const newGrid = initializeGrid(rows, cols);
    
    for (const placement of placements) {
      const x = placement.position_x;
      const y = placement.position_y;
      const width = placement.width;
      const height = placement.height;
      
      placeWidgetOnGrid(
        newGrid, 
        x, 
        y, 
        placement.widget, 
        placement.id, 
        width, 
        height, 
        placement.widget?.configuration
      );
    }
    
    setGrid(newGrid);
  }, [rows, cols]);
  
  return {
    grid,
    setGrid,
    placeWidget,
    removeWidget,
    updateGridWithPlacements
  };
} 