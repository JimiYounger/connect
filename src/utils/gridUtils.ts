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

interface Position {
  x: number;
  y: number;
  distance: number;
}

// Caches
const dimensionsCache = new Map<string, { width: number; height: number }>();
const initialGridCache = new Map<string, GridCell[][]>();
const totalDimensionsCache = new Map<string, { totalWidth: number; totalHeight: number }>();
const possiblePositionsCache = new Map<string, Position[]>();

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
 * Gets all possible positions for a widget sorted by distance from target
 */
const getAllPossiblePositions = (
  targetX: number,
  targetY: number,
  width: number,
  height: number,
  cols: number,
  rows: number,
  isLargeWidget = false
): Position[] => {
  const cacheKey = `${targetX}:${targetY}:${width}:${height}:${cols}:${rows}:${isLargeWidget}`;
  
  if (possiblePositionsCache.has(cacheKey)) {
    // Return a deep copy to prevent mutations
    return JSON.parse(JSON.stringify(possiblePositionsCache.get(cacheKey)));
  }
  
  const positions: Position[] = [];
  
  // Direct position - always try the exact location first
  if (targetX >= 0 && targetY >= 0 && targetX + width <= cols && targetY + height <= rows) {
    positions.push({
      x: targetX,
      y: targetY,
      distance: 0
    });
  }
  
  // For large widgets, divide the grid into placement zones
  if (isLargeWidget) {
    // Add key points like corners and centers as priority positions
    const zonePositions = [
      { x: 0, y: 0 }, // Top left
      { x: Math.max(0, cols - width), y: 0 }, // Top right
      { x: 0, y: Math.max(0, rows - height) }, // Bottom left
      { x: Math.max(0, cols - width), y: Math.max(0, rows - height) }, // Bottom right
      { x: Math.max(0, Math.floor((cols - width) / 2)), y: Math.max(0, Math.floor((rows - height) / 2)) }, // Center
    ];
    
    // Add these positions with a special distance metric that prioritizes them
    for (const zone of zonePositions) {
      // Skip if this is the direct position we already added
      if (zone.x === targetX && zone.y === targetY) continue;
      
      // Add with distance based on cursor position but with bonus for key positions
      const distance = calculateDistance(targetX, targetY, zone.x, zone.y);
      positions.push({
        x: zone.x,
        y: zone.y,
        // Slight preference for these key positions
        distance: Math.max(1, distance - 3)
      });
    }
  }
  
  // Calculate maximum possible search radius
  const maxSearchRadius = Math.max(cols, rows);
  
  // For larger widgets, use adaptive search patterns
  const searchIncrementBase = isLargeWidget ? 1 : 1;
  
  // Generate spiral pattern of positions from center outward
  for (let radius = 1; radius <= maxSearchRadius; radius++) {
    // Adaptive search increment - more aggressive for large widgets to cover more area
    const searchIncrement = isLargeWidget && radius > 2 ? 2 : searchIncrementBase;
    
    for (let dy = -radius; dy <= radius; dy += searchIncrement) {
      for (let dx = -radius; dx <= radius; dx += searchIncrement) {
        // Only check positions at current radius (Manhattan distance)
        if (Math.abs(dx) + Math.abs(dy) >= radius - (searchIncrement - 1) &&
            Math.abs(dx) + Math.abs(dy) <= radius + (searchIncrement - 1)) {
          const x = targetX + dx;
          const y = targetY + dy;
          
          // Skip if already added (the direct position)
          if (dx === 0 && dy === 0) continue;
          
          // Skip if we already added this key position from zonePositions
          if (isLargeWidget && positions.some(p => p.x === x && p.y === y)) continue;
          
          // Check if position would keep widget within grid bounds
          if (x >= 0 && y >= 0 && x + width <= cols && y + height <= rows) {
            positions.push({
              x,
              y,
              distance: Math.abs(dx) + Math.abs(dy)
            });
          }
        }
      }
    }
  }
  
  // Sort positions by distance from target
  const result = positions.sort((a, b) => a.distance - b.distance);
  
  // Store in cache
  possiblePositionsCache.set(cacheKey, JSON.parse(JSON.stringify(result)));
  
  return result;
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
 * Finds the optimal placement position for a widget with magnetic snap
 * behavior especially for larger widgets
 */
export const findOptimalPlacement = (
  cursorX: number,
  cursorY: number,
  width: number,
  height: number,
  grid: GridCell[][],
  cols: number,
  rows: number
): { x: number; y: number } | null => {
  // If widget won't fit at all on the grid, return null immediately
  if (width > cols || height > rows) {
    return null;
  }
  
  // Extra logging for large widgets
  const isLargeWidget = width >= 4 || height >= 4;
  if (isLargeWidget) {
    console.log(`[findOptimalPlacement] Attempting to place large ${width}x${height} widget at cursor (${cursorX},${cursorY})`);
    console.log(`[findOptimalPlacement] Grid dimensions: ${cols}x${rows}`);
  }
  
  // Setup positions to try, prioritizing cursor position
  const positions: { x: number; y: number; distance: number }[] = [];
  
  // First try direct cursor position (top-left corner at cursor)
  const directX = Math.max(0, Math.min(cursorX, cols - width));
  const directY = Math.max(0, Math.min(cursorY, rows - height));
  positions.push({ x: directX, y: directY, distance: 0 });
  
  // Then try cursor-centered position
  const centerX = Math.max(0, Math.min(cursorX - Math.floor(width / 2), cols - width));
  const centerY = Math.max(0, Math.min(cursorY - Math.floor(height / 2), rows - height));
  
  // Only add if different from direct position
  if (centerX !== directX || centerY !== directY) {
    positions.push({ x: centerX, y: centerY, distance: 1 });
  }
  
  // For large widgets, try all possible positions along cursor row and column
  if (isLargeWidget) {
    // Try positions horizontally along cursor row
    for (let x = 0; x <= cols - width; x++) {
      if (x !== directX && x !== centerX) {
        const distance = Math.abs(x - cursorX);
        positions.push({ x, y: cursorY, distance: distance + 2 });
      }
    }
    
    // Try positions vertically along cursor column
    for (let y = 0; y <= rows - height; y++) {
      if (y !== directY && y !== centerY) {
        const distance = Math.abs(y - cursorY);
        positions.push({ x: cursorX, y, distance: distance + 2 });
      }
    }
  }
  
  // Add positions in a wider spiral pattern around the cursor
  const maxRadius = Math.max(cols, rows);
  for (let radius = 1; radius <= maxRadius; radius++) {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        // Only check positions at current radius (Manhattan distance)
        if (Math.abs(dx) + Math.abs(dy) !== radius) continue;
        
        const x = Math.max(0, Math.min(cursorX + dx, cols - width));
        const y = Math.max(0, Math.min(cursorY + dy, rows - height));
        
        // Skip if we already added this position
        if (positions.some(p => p.x === x && p.y === y)) continue;
        
        positions.push({
          x,
          y,
          distance: radius + 5 // Higher base distance to prioritize cursor row/column
        });
      }
    }
    
    // For large widgets, we need to try more positions
    const positionLimit = isLargeWidget ? 100 : 50;
    if (positions.length >= positionLimit) break;
  }
  
  // As a fallback, try positions along grid divisions
  if (isLargeWidget && cols >= width * 2) {
    // For 4x4, try placing at x positions divisible by 4
    for (let x = 0; x <= cols - width; x += width) {
      for (let y = 0; y <= rows - height; y += height) {
        // Skip if we already added this position
        if (positions.some(p => p.x === x && p.y === y)) continue;
        
        positions.push({
          x,
          y,
          distance: 100 + calculateDistance(cursorX, cursorY, x, y)
        });
      }
    }
  }
  
  // Last resort: add a few key positions with lowest priority
  const fallbackPositions = [
    { x: 0, y: 0 }, // Top left
    { x: Math.max(0, cols - width), y: 0 }, // Top right
    { x: 0, y: Math.max(0, rows - height) }, // Bottom left
    { x: Math.max(0, cols - width), y: Math.max(0, rows - height) }, // Bottom right
  ];
  
  for (const pos of fallbackPositions) {
    // Skip if we already added this position
    if (positions.some(p => p.x === pos.x && p.y === pos.y)) continue;
    
    // Add with higher distance to indicate lower priority
    positions.push({
      x: pos.x,
      y: pos.y,
      distance: 200 + calculateDistance(cursorX, cursorY, pos.x, pos.y)
    });
  }
  
  // Sort by distance (priority)
  positions.sort((a, b) => a.distance - b.distance);
  
  if (isLargeWidget) {
    console.log(`[findOptimalPlacement] Trying ${positions.length} potential positions`);
    console.log(`[findOptimalPlacement] Top 5 positions:`, positions.slice(0, 5).map(p => `(${p.x},${p.y})`));
  }
  
  // Try each position in order until we find a valid one
  for (const pos of positions) {
    const { isValid } = validatePlacement(
      pos.x,
      pos.y,
      width,
      height,
      grid,
      cols,
      rows
    );
    
    if (isValid) {
      if (isLargeWidget) {
        console.log(`[findOptimalPlacement] Found valid position at (${pos.x},${pos.y})`);
      }
      return { x: pos.x, y: pos.y };
    }
  }
  
  if (isLargeWidget) {
    console.log(`[findOptimalPlacement] Failed to find valid position for ${width}x${height} widget`);
  }
  
  // If no valid position found, return null
  return null;
};

/**
 * Enhanced findValidPosition with better search algorithm
 * that uses the more comprehensive findOptimalPlacement
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
  // For large widgets, use our enhanced placement algorithm
  if (width >= 3 || height >= 3) {
    return findOptimalPlacement(targetX, targetY, width, height, grid, cols, rows);
  }
  
  // For small widgets, use a simpler algorithm
  // First try the exact position
  const exactValid = validatePlacement(targetX, targetY, width, height, grid, cols, rows);
  if (exactValid.isValid) {
    return { x: targetX, y: targetY };
  }
  
  // Then try a centered position
  const centerX = Math.max(0, Math.min(targetX - Math.floor(width / 2), cols - width));
  const centerY = Math.max(0, Math.min(targetY - Math.floor(height / 2), rows - height));
  
  if (centerX !== targetX || centerY !== targetY) {
    const centerValid = validatePlacement(centerX, centerY, width, height, grid, cols, rows);
    if (centerValid.isValid) {
      return { x: centerX, y: centerY };
    }
  }
  
  // Fall back to the simpler spiral search for small widgets
  const maxRadius = Math.max(cols, rows);
  for (let radius = 1; radius <= maxRadius; radius++) {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (Math.abs(dx) + Math.abs(dy) === radius) {
          const x = targetX + dx;
          const y = targetY + dy;
          
          if (x >= 0 && y >= 0 && x + width <= cols && y + height <= rows) {
            const { isValid } = validatePlacement(x, y, width, height, grid, cols, rows);
            if (isValid) {
              return { x, y };
            }
          }
        }
      }
    }
  }
  
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