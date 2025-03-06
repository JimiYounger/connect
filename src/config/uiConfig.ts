// my-app/src/config/uiConfig.ts

export const GRID_BASE_UNIT = 74;
export const GRID_GAP = 16;
export const WIDGET_BORDER_RADIUS = '50px';
export const GRID_CELL_SIZE = GRID_BASE_UNIT;

// Define the size ratios as literal strings
export type WidgetSizeRatio = 
  | '1:1' | '2:1' | '1:2' | '2:2' 
  | '3:2' | '2:3' | '4:3' | '3:4' 
  | '4:4' | '2:4' | '4:2';

// Size ratio to grid dimensions mapping
export const SIZE_RATIO_TO_GRID: Record<WidgetSizeRatio, { width: number; height: number }> = {
  '1:1': { width: 1, height: 1 },
  '2:1': { width: 2, height: 1 },
  '1:2': { width: 1, height: 2 },
  '2:2': { width: 2, height: 2 },
  '3:2': { width: 3, height: 2 },
  '2:3': { width: 2, height: 3 },
  '4:3': { width: 4, height: 3 },
  '3:4': { width: 3, height: 4 },
  '4:4': { width: 4, height: 4 },
  '2:4': { width: 2, height: 4 },
  '4:2': { width: 4, height: 2 },
}; 