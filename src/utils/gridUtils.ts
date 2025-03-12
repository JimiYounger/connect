// my-app/src/utils/gridUtils.ts

import { 
  GRID_CELL_SIZE, 
  GRID_GAP, 
  SIZE_RATIO_TO_GRID, 
  WidgetSizeRatio 
} from '@/config/uiConfig';
import { Widget } from '@/features/widgets/types';

export interface GridCell {
  x: number;
  y: number;
  isOccupied: boolean;
  widget?: Widget;
  placementId?: string;
  width?: number;
  height?: number;
  configuration?: any;
}

interface _Position {
  x: number;
  y: number;
  distance: number;
}

// Caches
const dimensionsCache = new Map<string, { width: number; height: number }>();
const initialGridCache = new Map<string, GridCell[][]>();
const totalDimensionsCache = new Map<string, { totalWidth: number; totalHeight: number }>();

/**
 * Calculate dimensions based on grid units and gap
 */
export const getWidgetDimensions = (widthUnits: number, heightUnits: number) => {
  const cacheKey = `${widthUnits}:${heightUnits}`;
  
  if (dimensionsCache.has(cacheKey)) {
    // Return a copy to prevent mutation of cached values
    const cached = dimensionsCache.get(cacheKey)!;
    return { ...cached };
  }
  
  const width = (GRID_CELL_SIZE * widthUnits) + (GRID_GAP * (widthUnits - 1));
  const height = (GRID_CELL_SIZE * heightUnits) + (GRID_GAP * (heightUnits - 1));
  
  const result = { width, height };
  dimensionsCache.set(cacheKey, result);
  return { ...result };
};

/**
 * Calculates the Manhattan distance between two points
 */
export const calculateDistance = (x1: number, y1: number, x2: number, y2: number): number => {
  return Math.abs(x1 - x2) + Math.abs(y1 - y2);
};

/**
 * Validates if a widget can be placed at a specific position
 */
export const validatePlacement = (
  x: number,
  y: number,
  width: number,
  height: number,
  grid: GridCell[][],
  cols: number,
  rows: number
): { isValid: boolean; message?: string } => {
  // Early return for boundary checks
  if (x < 0 || y < 0 || x + width > cols || y + height > rows) {
    return { 
      isValid: false, 
      message: `Out of bounds: (${x},${y}) size ${width}x${height} exceeds grid size ${cols}x${rows}` 
    };
  }
  
  // Check if any cell within the widget area is already occupied
  for (let dy = 0; dy < height; dy++) {
    for (let dx = 0; dx < width; dx++) {
      // Skip out of bounds checks since we already did that
      if (grid[y + dy] && grid[y + dy][x + dx] && grid[y + dy][x + dx].isOccupied) {
        return { 
          isValid: false,   
          message: `Cell at (${x+dx},${y+dy}) is already occupied` 
        };
      }
    }
  }
  
  // If we get here, placement is valid
  return { isValid: true };
};

/**
 * Simplified finding of a valid position using a spiral search pattern
 */
export const findValidPosition = (
  targetX: number,
  targetY: number,
  width: number,
  height: number,
  grid: GridCell[][],
  cols: number,
  rows: number
): { x: number; y: number } | null => {
  // First try the exact target position (cursor-centered)
  const centerX = Math.max(0, Math.min(targetX - Math.floor(width / 2), cols - width));
  const centerY = Math.max(0, Math.min(targetY - Math.floor(height / 2), rows - height));
  
  const exactValid = validatePlacement(centerX, centerY, width, height, grid, cols, rows);
  if (exactValid.isValid) {
    return { x: centerX, y: centerY };
  }
  
  // If that fails, use a simple spiral search
  const maxRadius = Math.max(cols, rows);
  
  // Search in a spiral pattern starting from cursor position
  for (let radius = 1; radius <= maxRadius; radius++) {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        // Only check positions at current radius (Manhattan distance)
        if (Math.abs(dx) + Math.abs(dy) !== radius) continue;
        
        const x = Math.max(0, Math.min(centerX + dx, cols - width));
        const y = Math.max(0, Math.min(centerY + dy, rows - height));
        
        // Skip if it's the same as the center position we already checked
        if (x === centerX && y === centerY) continue;
        
        const { isValid } = validatePlacement(x, y, width, height, grid, cols, rows);
        if (isValid) {
          return { x, y };
        }
      }
    }
  }
  
  // If no valid position found, return null
  return null;
};

/**
 * Get widget dimensions from size ratio
 */
export const getWidgetGridDimensions = (sizeRatio: WidgetSizeRatio) => {
  return SIZE_RATIO_TO_GRID[sizeRatio] || SIZE_RATIO_TO_GRID['1:1'];
};

/**
 * Initialize an empty grid with caching
 */
export const initializeGrid = (rows: number, cols: number): GridCell[][] => {
  const cacheKey = `${rows}:${cols}`;
  
  if (initialGridCache.has(cacheKey)) {
    // Return a deep copy to prevent mutations of cached data
    return JSON.parse(JSON.stringify(initialGridCache.get(cacheKey)));
  }
  
  const grid: GridCell[][] = [];
  for (let y = 0; y < rows; y++) {
    grid[y] = [];
    for (let x = 0; x < cols; x++) {
      grid[y][x] = {
        x,
        y,
        isOccupied: false,
      };
    }
  }
  
  // Store a copy in the cache
  initialGridCache.set(cacheKey, JSON.parse(JSON.stringify(grid)));
  
  return grid;
};

// Add these interfaces if they don't exist
export interface WidgetDimensions {
  width: number;
  height: number;
}

export interface CircularDimensions extends WidgetDimensions {
  circleSize: number | null;
}

// Add this helper function for circular widgets with caching
export const getCircularWidgetDimensions = (width: number, height: number): CircularDimensions => {
  const cacheKey = `circular:${width}:${height}`;
  
  if (dimensionsCache.has(cacheKey)) {
    return { ...dimensionsCache.get(cacheKey) } as CircularDimensions;
  }
  
  const dimensions = getWidgetDimensions(width, height);
  const circleSize = Math.min(dimensions.width, dimensions.height);
  
  const result = {
    ...dimensions,
    circleSize
  };
  
  dimensionsCache.set(cacheKey, result);
  return { ...result };
};

/**
 * Calculates total width and height including gaps with caching
 */
export const calculateTotalDimensions = (width: number, height: number) => {
  const cacheKey = `total:${width}:${height}`;
  
  if (totalDimensionsCache.has(cacheKey)) {
    return { ...totalDimensionsCache.get(cacheKey) };
  }
  
  const totalWidth = (width * GRID_CELL_SIZE) + ((width - 1) * GRID_GAP);
  const totalHeight = (height * GRID_CELL_SIZE) + ((height - 1) * GRID_GAP);
  
  const result = { totalWidth, totalHeight };
  totalDimensionsCache.set(cacheKey, result);
  
  return { ...result };
};

/**
 * Update the grid when placing a new widget
 */
export const placeWidgetOnGrid = (
  grid: GridCell[][],
  x: number,
  y: number,
  widget: Widget,
  placementId: string,
  width: number,
  height: number,
  configuration?: any
): GridCell[][] => {
  const newGrid = [...grid];
  
  for (let dy = 0; dy < height; dy++) {
    for (let dx = 0; dx < width; dx++) {
      if (newGrid[y + dy] && newGrid[y + dy][x + dx]) {
        newGrid[y + dy][x + dx].isOccupied = true;
        
        // Only store widget info in the top-left cell
        if (dx === 0 && dy === 0) {
          newGrid[y][x].widget = widget;
          newGrid[y][x].placementId = placementId;
          newGrid[y][x].width = width;
          newGrid[y][x].height = height;
          newGrid[y][x].configuration = configuration;
        }
      }
    }
  }
  
  return newGrid;
};

/**
 * Remove a widget from the grid
 */
export const removeWidgetFromGrid = (
  grid: GridCell[][],
  x: number,
  y: number,
  width: number,
  height: number
): GridCell[][] => {
  const newGrid = [...grid];
  
  for (let dy = 0; dy < height; dy++) {
    for (let dx = 0; dx < width; dx++) {
      if (newGrid[y + dy] && newGrid[y + dy][x + dx]) {
        newGrid[y + dy][x + dx].isOccupied = false;
        
        // Clear widget info from the top-left cell
        if (dx === 0 && dy === 0) {
          delete newGrid[y][x].widget;
          delete newGrid[y][x].placementId;
          delete newGrid[y][x].width;
          delete newGrid[y][x].height;
          delete newGrid[y][x].configuration;
        }
      }
    }
  }
  
  return newGrid;
};

/**
 * Validates that a set of cells forms a complete rectangle of the expected dimensions
 */
export const validateCellsFormRectangle = (
  cells: { x: number; y: number }[],
  expectedWidth: number,
  expectedHeight: number
): boolean => {
  // Quick check that we have the right number of cells
  if (cells.length !== expectedWidth * expectedHeight) {
    return false;
  }
  
  // Find the boundaries of the cells
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  
  for (const cell of cells) {
    minX = Math.min(minX, cell.x);
    minY = Math.min(minY, cell.y);
    maxX = Math.max(maxX, cell.x);
    maxY = Math.max(maxY, cell.y);
  }
  
  // Calculate dimensions based on boundaries
  const actualWidth = maxX - minX + 1;
  const actualHeight = maxY - minY + 1;
  
  // Check if dimensions match expected values
  if (actualWidth !== expectedWidth || actualHeight !== expectedHeight) {
    return false;
  }
  
  // Check that every cell in the rectangle exists
  const cellMap = new Map();
  for (const cell of cells) {
    cellMap.set(`${cell.x},${cell.y}`, true);
  }
  
  // Ensure every position in the rectangle is present
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      if (!cellMap.has(`${x},${y}`)) {
        return false;
      }
    }
  }
  
  return true;
}; 