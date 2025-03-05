// my-app/src/features/dashboards/components/dashboard-grid.tsx

import { useCallback, useEffect, useState, useRef } from 'react';
import { Widget, WidgetSizeRatio } from '@/features/widgets/types';
import { WidgetRenderer } from '@/features/widgets/components/widget-renderer';
import { dashboardService } from '../services/dashboard-service'; 
import { cn } from '@/lib/utils';
import { useDroppable, useDndMonitor, useDraggable, useDndContext } from '@dnd-kit/core';
import { Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { initializeWidgets } from '@/features/widgets/init-widgets';
import { useWidgetConfiguration } from '@/features/widgets/hooks/use-widget-configuration';

interface GridCell {
  x: number;
  y: number;
  isOccupied: boolean;
  widget?: Widget;
  placementId?: string;
  width?: number;
  height?: number;
  configuration?: any;
}

interface DashboardGridProps {
  layout: 'mobile' | 'desktop';
  rows: number;
  cols: number;
  className?: string;
  dashboardId: string;
  draftId?: string;
  userId?: string;
  readOnly?: boolean;
  onPlacementChange?: () => void;
}

// Size ratio to grid dimensions mapping
const SIZE_RATIO_TO_GRID = {
  '1:1': { width: 1, height: 1 },
  '2:1': { width: 2, height: 1 },
  '1:2': { width: 1, height: 2 },
  '2:2': { width: 2, height: 2 },
  '3:2': { width: 3, height: 2 },
  '2:3': { width: 2, height: 3 },
  '4:2': { width: 4, height: 2 },
  '2:4': { width: 2, height: 4 },
  '4:3': { width: 4, height: 3 },
  '3:4': { width: 3, height: 4 },
  '4:4': { width: 4, height: 4 },
} as const;

// Cell droppable component
interface CellDroppableProps {
  x: number;
  y: number;
  isOccupied: boolean;
  children: React.ReactNode;
  grid: GridCell[][];
  cols: number;
  rows: number;
  cellDimensions: { width: number; height: number };
}

function CellDroppable({ x, y, isOccupied, children, grid, cols, rows, cellDimensions }: CellDroppableProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `cell-${x}-${y}`,
    data: { x, y, isOccupied },
    disabled: isOccupied
  });

  const { active, over } = useDndContext();
  const activeWidget = active?.data?.current?.widget;
  
  // Calculate affected cells when dragging over any cell
  const getAffectedCells = () => {
    if (!activeWidget || !over) return [];
    
    const overData = over.data?.current as { x: number; y: number } | undefined;
    if (!overData) return [];
    
    const sizeRatio = activeWidget.size_ratio || '1:1';
    const dimensions = SIZE_RATIO_TO_GRID[sizeRatio as keyof typeof SIZE_RATIO_TO_GRID];
    
    // Adjust search radius based on widget size
    const findValidPosition = (targetX: number, targetY: number, width: number, height: number) => {
      // Calculate search boundaries with larger radius for bigger widgets
      const searchRadius = Math.max(width, height) * 2; // Increased search radius
      const minX = Math.max(0, targetX - searchRadius);
      const maxX = Math.min(cols - width, targetX + 1); // Allow searching forward
      const minY = Math.max(0, targetY - searchRadius);
      const maxY = Math.min(rows - height, targetY + 1); // Allow searching forward

      // Try the closest positions first
      const positions = [];
      for (let dy = -height + 1; dy <= 1; dy++) {
        for (let dx = -width + 1; dx <= 1; dx++) {
          const checkX = targetX + dx;
          const checkY = targetY + dy;
          if (checkX >= 0 && checkY >= 0 && checkX + width <= cols && checkY + height <= rows) {
            positions.push({
              x: checkX,
              y: checkY,
              distance: Math.abs(dx) + Math.abs(dy)
            });
          }
        }
      }

      // Sort positions by distance and try them in order
      positions.sort((a, b) => a.distance - b.distance);
      
      for (const pos of positions) {
        if (isValidPlacement(pos.x, pos.y, width, height)) {
          return { x: pos.x, y: pos.y };
        }
      }

      // If no close positions work, try the wider search area
      for (let checkY = minY; checkY <= maxY; checkY++) {
        for (let checkX = minX; checkX <= maxX; checkX++) {
          if (isValidPlacement(checkX, checkY, width, height)) {
            return { x: checkX, y: checkY };
          }
        }
      }

      return null;
    };

    const isValidPlacement = (startX: number, startY: number, width: number, height: number) => {
      // Check grid boundaries
      if (startX < 0 || startY < 0 || startX + width > cols || startY + height > rows) {
        return false;
      }

      // Check if all required cells are available
      for (let dy = 0; dy < height; dy++) {
        for (let dx = 0; dx < width; dx++) {
          const cell = grid[startY + dy]?.[startX + dx];
          if (!cell || cell.isOccupied) {
            return false;
          }
        }
      }
      return true;
    };

    // Try to find a valid position
    const validPosition = findValidPosition(
      overData.x, 
      overData.y, 
      dimensions.width, 
      dimensions.height
    );

    // If we found a valid position, return the affected cells
    if (validPosition) {
      const affectedCells: { x: number; y: number }[] = [];
      for (let dy = 0; dy < dimensions.height; dy++) {
        for (let dx = 0; dx < dimensions.width; dx++) {
          affectedCells.push({ 
            x: validPosition.x + dx, 
            y: validPosition.y + dy 
          });
        }
      }
      return affectedCells;
    }

    return [];
  };

  const affectedCells = getAffectedCells();
  const isAffected = affectedCells.some(cell => cell.x === x && cell.y === y);
  const isValid = affectedCells.length > 0;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "relative rounded transition-all duration-200",
        !isOccupied && (
          isValid 
            ? isAffected 
              ? "bg-primary/20 border-primary/50 shadow-inner" 
              : "hover:bg-primary/5"
            : isOver 
              ? "bg-destructive/10 border-destructive/50" 
              : "hover:bg-muted/50"
        ),
        isOccupied ? "border-transparent" : "border-dashed border-2",
      )}
      style={{
        width: `${GRID_CELL_SIZE}px`,
        height: `${GRID_CELL_SIZE}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: isOccupied ? 'default' : 'crosshair',
      }}
    >
      {children}
    </div>
  );
}

// Draggable widget component
interface DraggableWidgetProps {
  widget: Widget;
  placementId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  cellWidth: number;
  cellHeight: number;
  onRemove: () => void;
  readOnly?: boolean;
  configuration?: any; 
}

// Add this constant at the top of the file
const GRID_CELL_SIZE = 74; // Base cell size in pixels
const GRID_GAP = 16; // Gap between cells in pixels

// Add this constant at the top with other constants
const WIDGET_BORDER_RADIUS = '50px';

function DraggableWidget({ 
  widget, 
  placementId, 
  x, 
  y, 
  width, 
  height, 
  cellWidth, 
  cellHeight,
  onRemove,
  readOnly = false,
  configuration
}: DraggableWidgetProps) {
  // Calculate total dimensions including gaps
  const totalWidth = (width * GRID_CELL_SIZE) + ((width - 1) * GRID_GAP);
  const totalHeight = (height * GRID_CELL_SIZE) + ((height - 1) * GRID_GAP);
  
  const isCircle = widget.shape === 'circle';
  const circleSize = isCircle ? Math.min(totalWidth, totalHeight) : null;

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `placement-${placementId}`,
    data: {
      type: 'move',
      widget,
      placementId,
      sourceX: x,
      sourceY: y,
      width,
      height,
      configuration
    },
    disabled: readOnly
  });

  return (
    <div 
      className="absolute inset-0"
      style={{
        width: isCircle ? `${circleSize}px` : `${totalWidth}px`,
        height: isCircle ? `${circleSize}px` : `${totalHeight}px`,
      }}
    >
      {!readOnly && (
        <button
          className="absolute top-1 right-1 z-10 p-1 rounded-full bg-background/50 
                    hover:bg-destructive/80 hover:text-white transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          title="Remove widget"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
      <div 
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        className={cn(
          "w-full h-full cursor-grab",
          isDragging && "opacity-50",
          "widget-card"
        )}
        style={{
          width: isCircle ? `${circleSize}px` : `${totalWidth}px`,
          height: isCircle ? `${circleSize}px` : `${totalHeight}px`,
          borderRadius: isCircle ? '50%' : WIDGET_BORDER_RADIUS,
          overflow: 'hidden',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: isCircle ? `${circleSize}px` : '100%',
            height: isCircle ? `${circleSize}px` : '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <WidgetRenderer
            widget={widget}
            configuration={configuration}
            width={isCircle ? circleSize! : totalWidth}
            height={isCircle ? circleSize! : totalHeight}
            borderRadius={isCircle ? '50%' : WIDGET_BORDER_RADIUS}
            className="placed-widget"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              position: 'relative',
            }}
          />
        </div>
      </div>
    </div>
  );
}

export function DashboardGrid({ 
  layout, 
  rows, 
  cols, 
  className, 
  dashboardId,
  draftId,
  userId,
  readOnly = false,
  onPlacementChange
}: DashboardGridProps) {
  const [grid, setGrid] = useState<GridCell[][]>([]);
  const gridRef = useRef<HTMLDivElement>(null);
  const [cellDimensions] = useState({ 
    width: GRID_CELL_SIZE, 
    height: GRID_CELL_SIZE 
  });
  const [isLoading, setIsLoading] = useState(false);

  // Set up droppable area for the entire grid
  const { setNodeRef } = useDroppable({
    id: `dashboard-grid-${layout}`,
    data: {
      layout,
      rows,
      cols,
    },
  });

  // Initialize grid
  useEffect(() => {
    const newGrid: GridCell[][] = [];
    for (let y = 0; y < rows; y++) {
      newGrid[y] = [];
      for (let x = 0; x < cols; x++) {
        newGrid[y][x] = {
          x,
          y,
          isOccupied: false,
        };
      }
    }
    setGrid(newGrid);
  }, [rows, cols]);

  // Check if a widget can be placed at a specific position
  const canPlaceWidget = useCallback((x: number, y: number, widgetWidth: number, widgetHeight: number) => {
    // Check if position is within grid bounds
    if (x < 0 || y < 0 || x + widgetWidth > cols || y + widgetHeight > rows) {
      return false;
    }
    
    // Check if all cells are unoccupied
    for (let dy = 0; dy < widgetHeight; dy++) {
      for (let dx = 0; dx < widgetWidth; dx++) {
        if (!grid[y + dy] || !grid[y + dy][x + dx] || grid[y + dy][x + dx].isOccupied) {
          return false;
        }
      }
    }
    
    return true;
  }, [grid, cols, rows]);

  // Find the first available position for a widget
  const findAvailablePosition = useCallback((widgetWidth: number, widgetHeight: number) => {
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (canPlaceWidget(x, y, widgetWidth, widgetHeight)) {
          return { x, y };
        }
      }
    }
    return null;
  }, [canPlaceWidget, rows, cols]);

  // Update grid with widget placements
  const updateGridWithPlacements = useCallback((placements: any[]) => {
    // Create a new grid with empty cells
    const newGrid: GridCell[][] = [];
    for (let y = 0; y < rows; y++) {
      newGrid[y] = [];
      for (let x = 0; x < cols; x++) {
        newGrid[y][x] = {
          x,
          y,
          isOccupied: false,
        };
      }
    }
    
    // Place widgets on the grid
    for (const placement of placements) {
      const x = placement.position_x;
      const y = placement.position_y;
      const width = placement.width;
      const height = placement.height;
      
      // Mark all cells covered by this widget as occupied
      for (let dy = 0; dy < height; dy++) {
        for (let dx = 0; dx < width; dx++) {
          if (newGrid[y + dy] && newGrid[y + dy][x + dx]) {
            newGrid[y + dy][x + dx].isOccupied = true;
            
            // Only store widget info in the top-left cell
            if (dx === 0 && dy === 0) {
              // Explicitly set these properties
              const cell = newGrid[y][x];
              cell.widget = placement.widget;
              cell.placementId = placement.id;
              cell.width = width;
              cell.height = height;
              // Store configuration if available in the placement
              if (placement.widget && placement.widget.configuration) {
                cell.configuration = placement.widget.configuration;
              }
            }
          }
        }
      }
    }
    
    setGrid(newGrid);
  }, [rows, cols]);

  // Load placements
  useEffect(() => {
    const loadPlacements = async () => {
      if (!dashboardId || !draftId) return;
      
      setIsLoading(true);
      try {
        // Get current draft with placements
        const { data: draft, error } = await dashboardService.getCurrentDraft(dashboardId);
        
        if (error || !draft) {
          console.error('Error loading draft:', error);
          return;
        }
        
        // Filter placements by layout type
        const layoutPlacements = draft.draft_widget_placements.filter(
          (p: any) => p.layout_type === layout
        );
        
        // Fetch widget data for each placement
        const placementsWithWidgets = await Promise.all(
          layoutPlacements.map(async (placement: any) => {
            const { data: widget } = await dashboardService.getWidgetById(placement.widget_id);
            return { ...placement, widget };
          })
        );
        
        updateGridWithPlacements(placementsWithWidgets);
      } catch (err) {
        console.error('Error loading placements:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadPlacements();
  }, [dashboardId, draftId, layout, updateGridWithPlacements]);

  // Handle widget placement from drag and drop
const handlePlaceWidget = async (widget: Widget, x: number, y: number, widgetConfiguration?: any) => {
  console.log("handlePlaceWidget called with:", {
    widget,
    x,
    y,
    draftId,
    readOnly,
    hasConfiguration: !!widgetConfiguration
  });
  
  if (!draftId || !widget || readOnly) {
    console.log("Early return from handlePlaceWidget - Missing:", { 
      hasDraftId: !!draftId, 
      hasWidget: !!widget, 
      isReadOnly: readOnly 
    });
    return;
  }
    
    // Get widget dimensions from size ratio
    const sizeRatio = widget.size_ratio as WidgetSizeRatio || '1:1';
    const widgetDimensions = SIZE_RATIO_TO_GRID[sizeRatio] || { width: 1, height: 1 };
    
    // Check if widget can be placed at the specified position
    if (!canPlaceWidget(x, y, widgetDimensions.width, widgetDimensions.height)) {
      // Try to find an available position
      const availablePos = findAvailablePosition(widgetDimensions.width, widgetDimensions.height);
      
      if (!availablePos) {
        toast({
          title: "Cannot place widget",
          description: "There is not enough space on the grid for this widget.",
          variant: "destructive"
        });
        return;
      }
      
      // Use the available position instead
      x = availablePos.x;
      y = availablePos.y;
    }
    
    try {
      setIsLoading(true);
      
      // Save placement to database
      const { data: placement, error } = await dashboardService.saveDraftPlacement({
        draft_id: draftId,
        widget_id: widget.id,
        position_x: x,
        position_y: y,
        width: widgetDimensions.width,
        height: widgetDimensions.height,
        layout_type: layout,
        created_by: userId,
      });
      
      if (error) {
        console.error('Error saving placement:', error);
        toast({
          title: "Error",
          description: "Failed to save widget placement.",
          variant: "destructive"
        });
        return;
      }
      
      // Update grid with new placement
      const newGrid = [...grid];
      for (let dy = 0; dy < widgetDimensions.height; dy++) {
        for (let dx = 0; dx < widgetDimensions.width; dx++) {
          if (newGrid[y + dy] && newGrid[y + dy][x + dx]) {
            newGrid[y + dy][x + dx].isOccupied = true;
            
            // Only store widget info in the top-left cell
            if (dx === 0 && dy === 0) {
              newGrid[y][x].widget = widget;
              newGrid[y][x].placementId = placement.id;
              newGrid[y][x].width = widgetDimensions.width;
              newGrid[y][x].height = widgetDimensions.height;
              newGrid[y][x].configuration = widgetConfiguration;
            }
          }
        }
      }
      
      setGrid(newGrid);
      
      // Notify parent component of placement change
      if (onPlacementChange) {
        onPlacementChange();
      }
      
      toast({
        title: "Widget placed",
        description: `${widget.name} has been added to the dashboard.`,
      });
    } catch (err) {
      console.error('Error placing widget:', err);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle removing a widget from the grid
  const handleRemoveWidget = async (placementId: string, x: number, y: number, width: number, height: number) => {
    if (!placementId || readOnly) return;
    
    try {
      setIsLoading(true);
      
      // Delete placement from database
      const { error } = await dashboardService.deleteDraftPlacement(placementId);
      
      if (error) {
        console.error('Error removing placement:', error);
        toast({
          title: "Error",
          description: "Failed to remove widget.",
          variant: "destructive"
        });
        return;
      }
      
      // Update grid by marking cells as unoccupied
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
            }
          }
        }
      }
      
      setGrid(newGrid);
      
      // Notify parent component of placement change
      if (onPlacementChange) {
        onPlacementChange();
      }
      
      toast({
        title: "Widget removed",
        description: "The widget has been removed from the dashboard.",
      });
    } catch (err) {
      console.error('Error removing widget:', err);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle moving a widget within the grid
  const handleMoveWidget = async (
    placementId: string, 
    widget: Widget,
    oldX: number, 
    oldY: number, 
    newX: number, 
    newY: number, 
    width: number, 
    height: number
  ) => {
    if (!placementId || readOnly) return;
    
    // Check if new position is valid
    if (!canPlaceWidget(newX, newY, width, height)) {
      toast({
        title: "Cannot move widget",
        description: "The target position is not available.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Update placement in database
      const { error } = await dashboardService.updateDraftPlacement(placementId, {
        position_x: newX,
        position_y: newY,
      });
      
      if (error) {
        console.error('Error moving placement:', error);
        toast({
          title: "Error",
          description: "Failed to move widget.",
          variant: "destructive"
        });
        return;
      }
      
      // Update grid
      const newGrid = [...grid];
      
      // Clear old position
      for (let dy = 0; dy < height; dy++) {
        for (let dx = 0; dx < width; dx++) {
          if (newGrid[oldY + dy] && newGrid[oldY + dy][oldX + dx]) {
            newGrid[oldY + dy][oldX + dx].isOccupied = false;
            
            // Clear widget info from the top-left cell
            if (dx === 0 && dy === 0) {
              delete newGrid[oldY][oldX].widget;
              delete newGrid[oldY][oldX].placementId;
              delete newGrid[oldY][oldX].width;
              delete newGrid[oldY][oldX].height;
            }
          }
        }
      }
      
      // Set new position
      for (let dy = 0; dy < height; dy++) {
        for (let dx = 0; dx < width; dx++) {
          if (newGrid[newY + dy] && newGrid[newY + dy][newX + dx]) {
            newGrid[newY + dy][newX + dx].isOccupied = true;
            
            // Store widget info in the top-left cell
            if (dx === 0 && dy === 0) {
              newGrid[newY][newX].widget = widget;
              newGrid[newY][newX].placementId = placementId;
              newGrid[newY][newX].width = width;
              newGrid[newY][newX].height = height;


              if (newGrid[oldY][oldX].configuration) {
                newGrid[newY][newX].configuration = newGrid[oldY][oldX].configuration;
              }
            }
          }
        }
      }
      
      setGrid(newGrid);
      
      // Notify parent component of placement change
      if (onPlacementChange) {
        onPlacementChange();
      }
      
      toast({
        title: "Widget moved",
        description: "The widget has been moved to a new position.",
      });
    } catch (err) {
      console.error('Error moving widget:', err);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Monitor drag events
  useDndMonitor({
    onDragEnd: (event) => {
      const { active, over } = event;
      
      console.log("Drag ended - Active:", active);
      console.log("Drag ended - Over:", over);
      
      if (!over || !active) {
        console.log("No over or active target");
        return;
      }
      
      const activeData = active.data.current;
      const overData = over.data.current;
      
      console.log("Active data:", activeData);
      console.log("Over data:", overData);
      
      if (!activeData || !overData) {
        console.log("Missing data in drag operation");
        return;
      }
      
      // Handle widget placement from library
      if (activeData.widget && !activeData.type && overData.x !== undefined && overData.y !== undefined) {
        console.log("Attempting to place widget at:", overData.x, overData.y);
        // Pass configuration to handlePlaceWidget
        handlePlaceWidget(activeData.widget, overData.x, overData.y, activeData.configuration);
        return;
      }
      
      // Handle internal widget movement
      if (activeData.type === 'move' && overData.x !== undefined && overData.y !== undefined) {
        handleMoveWidget(
          activeData.placementId,
          activeData.widget,
          activeData.sourceX,
          activeData.sourceY,
          overData.x,
          overData.y,
          activeData.width,
          activeData.height
        );
      }
    }
  });

  // Add this useEffect for initialization
  useEffect(() => {
    // Initialize widgets when component mounts
    const init = async () => {
      await initializeWidgets();
    };
    init();
  }, []); // Empty dependency array means this runs once on mount

  if (!grid.length) return null;

  return (
    <div 
      ref={(node) => {
        setNodeRef(node);
        if (gridRef.current !== node) {
          gridRef.current = node as HTMLDivElement | null;
        }
      }}
      className={cn(
        "grid bg-muted/30 rounded-lg relative",
        layout === 'desktop' ? 'w-fit' : 'w-[360px]',
        isLoading && "opacity-70 pointer-events-none",
        className
      )}
      style={{
        gridTemplateColumns: `repeat(${cols}, ${GRID_CELL_SIZE}px)`,
        gridTemplateRows: `repeat(${rows}, ${GRID_CELL_SIZE}px)`,
        gap: `${GRID_GAP}px`,
        padding: `${GRID_GAP * 2}px`,
        minWidth: `${(cols * GRID_CELL_SIZE) + ((cols - 1) * GRID_GAP) + (GRID_GAP * 4)}px`,
        minHeight: `${(rows * GRID_CELL_SIZE) + ((rows - 1) * GRID_GAP) + (GRID_GAP * 4)}px`,
      }}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10 rounded-lg">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      )}
      
      {grid.map((row, y) =>
        row.map((cell, x) => (
          <CellDroppable 
            key={`${x}-${y}`} 
            x={x} 
            y={y} 
            isOccupied={cell.isOccupied}
            grid={grid}
            cols={cols}
            rows={rows}
            cellDimensions={cellDimensions}
          >
            {cell.isOccupied && cell.widget && cell.width && cell.height && cell.placementId && (
              <DraggableWidget
                widget={cell.widget}
                placementId={cell.placementId}
                x={x}
                y={y}
                width={cell.width}
                height={cell.height}
                cellWidth={cellDimensions.width}
                cellHeight={cellDimensions.height}
                readOnly={readOnly}
                configuration={cell.configuration}
                onRemove={() => handleRemoveWidget(cell.placementId!, x, y, cell.width!, cell.height!)}
              />
            )}
          </CellDroppable>
        ))
      )}
    </div>
  );
}