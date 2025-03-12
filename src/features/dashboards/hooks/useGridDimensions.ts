// my-app/src/features/dashboards/hooks/useGridDimensions.ts

import { useMemo } from 'react';
import { GRID_CELL_SIZE, GRID_GAP } from '@/config/uiConfig';

interface UseGridDimensionsProps {
  layout: 'mobile' | 'desktop';
  rows: number;
  cols: number;
}

export function useGridDimensions({ layout, rows, cols }: UseGridDimensionsProps) {
  // Calculate grid styles
  const gridStyles = useMemo(() => ({
    gridTemplateColumns: `repeat(${cols}, ${GRID_CELL_SIZE}px)`,
    gridTemplateRows: `repeat(${rows}, ${GRID_CELL_SIZE}px)`,
    gap: `${GRID_GAP}px`,
    padding: `${GRID_GAP * 2}px`,
    minWidth: `${(cols * GRID_CELL_SIZE) + ((cols - 1) * GRID_GAP) + (GRID_GAP * 4)}px`,
    minHeight: `${(rows * GRID_CELL_SIZE) + ((rows - 1) * GRID_GAP) + (GRID_GAP * 4)}px`,
  }), [rows, cols]);
  
  // Calculate container classes
  const containerClasses = useMemo(() => 
    `grid bg-muted/30 rounded-lg relative ${layout === 'desktop' ? 'w-fit' : 'w-[360px]'}`
  , [layout]);
  
  return {
    gridStyles,
    containerClasses,
    isDesktop: layout === 'desktop',
    isMobile: layout === 'mobile'
  };
} 