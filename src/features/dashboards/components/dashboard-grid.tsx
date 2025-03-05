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
  '4:3': { width: 4, height: 3 },
  '3:4': { width: 3, height: 4 },
  '4:4': { width: 4, height: 4 },
  '2:4': { width: 2, height: 4 },
  '4:2': { width: 4, height: 2 },
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
  const activeConfig = active?.data?.current?.configuration;
  
  // Calculate affected cells when dragging over any cell
  const getAffectedCells = () => {
    if (!activeWidget || !over) return [];
    
    const overData = over.data?.current as { x: number; y: number } | undefined;
    if (!overData) return [];
    
    const sizeRatio = activeWidget.size_ratio || '1:1';
    const dimensions = SIZE_RATIO_TO_GRID[sizeRatio as keyof typeof SIZE_RATIO_TO_GRID];
    
    const affectedCells: { x: number; y: number }[] = [];
    
    // Check if placement would be valid
    const isValidPlacement = (startX: number, startY: number, width: number, height: number) => {
      if (startX + width > cols || startY + height > rows) return false;
      
      for (let dy = 0; dy < height; dy++) {
        for (let dx = 0; dx < width; dx++) {
          if (!grid[startY + dy] || !grid[startY + dy][startX + dx] || grid[startY + dy][startX + dx].isOccupied) {
            return false;
          }
        }
      }
      return true;
    };

    // If placement is valid, collect affected cells
    if (isValidPlacement(overData.x, overData.y, dimensions.width, dimensions.height)) {
      for (let dy = 0; dy < dimensions.height; dy++) {
        for (let dx = 0; dx < dimensions.width; dx++) {
          affectedCells.push({ x: overData.x + dx, y: overData.y + dy });
        }
      }
    }

    return affectedCells;
  };

  const affectedCells = getAffectedCells();
  const isAffected = affectedCells.some(cell => cell.x === x && cell.y === y);
  const isValid = affectedCells.length > 0;
  
  // Only show preview if this is the top-left cell of the affected area
  const isPreviewCell = isAffected && x === affectedCells[0]?.x && y === affectedCells[0]?.y;
  
  return (
    <div 
      ref={setNodeRef}
      className={cn(
        "relative rounded transition-colors duration-200",
        !isOccupied && (
          isValid 
            ? isAffected ? "bg-primary/5 border-primary/30" : ""
            : isOver ? "bg-destructive/10 border-destructive/50" : ""
        ),
        isOccupied ? "border-transparent" : "border-dashed border-2",
        "min-h-[100px]"
      )}
      style={{
        width: '100%',
        height: '100%',
        minHeight: '100px'
      }}
    >
      {children}
      
      {/* Widget Preview */}
      {isPreviewCell && activeWidget && !isOccupied && isValid && (
        <div className="absolute inset-0 pointer-events-none opacity-80">
          <WidgetRenderer
            widget={activeWidget}
            configuration={activeConfig}
            width={cellDimensions.width * (SIZE_RATIO_TO_GRID[activeWidget.size_ratio as keyof typeof SIZE_RATIO_TO_GRID]?.width || 1)}
            height={cellDimensions.height * (SIZE_RATIO_TO_GRID[activeWidget.size_ratio as keyof typeof SIZE_RATIO_TO_GRID]?.height || 1)}
            borderRadius={activeWidget.shape === 'circle' ? '50%' : '12px'}
            className="widget-preview"
          />
        </div>
      )}
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
}

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
  readOnly = false
}: DraggableWidgetProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `placement-${placementId}`,
    data: {
      type: 'move',
      widget,
      placementId,
      sourceX: x,
      sourceY: y,
      width,
      height
    },
    disabled: readOnly
  });

  const { configuration } = useWidgetConfiguration({
    widgetId: widget.id,
    type: widget.widget_type,
  });
  
  return (
    <div className="absolute inset-0">
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
      >
        <WidgetRenderer
          widget={widget}
          configuration={configuration?.config}
          width={cellWidth * width}
          height={cellHeight * height}
          borderRadius={widget.shape === 'circle' ? '50%' : '12px'}
          className="placed-widget"
        />
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
  const [cellDimensions, setCellDimensions] = useState({ width: 0, height: 0 });
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

  // Calculate cell dimensions when grid size changes
  useEffect(() => {
    const updateCellDimensions = () => {
      if (!gridRef.current) return;
      
      const gridElement = gridRef.current;
      const totalWidth = gridElement.clientWidth;
      const totalHeight = gridElement.clientHeight;
      
      // Subtract total gap space
      const horizontalGaps = (cols - 1) * 16; // 16px gap
      const verticalGaps = (rows - 1) * 16;
      
      const cellWidth = (totalWidth - horizontalGaps) / cols;
      const cellHeight = (totalHeight - verticalGaps) / rows;
      
      setCellDimensions({ width: cellWidth, height: cellHeight });
    };

    updateCellDimensions();
    
    // Add resize observer for more reliable dimension updates
    const resizeObserver = new ResizeObserver(updateCellDimensions);
    if (gridRef.current) {
      resizeObserver.observe(gridRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [cols, rows, layout]);

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
  const handlePlaceWidget = async (widget: Widget, x: number, y: number) => {
    console.log("handlePlaceWidget called with:", {
      widget,
      x,
      y,
      draftId,
      readOnly
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
        handlePlaceWidget(activeData.widget, overData.x, overData.y);
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
        // Set both refs
        setNodeRef(node);
        if (gridRef.current !== node) {
          gridRef.current = node as HTMLDivElement | null;
        }
      }}
      className={cn(
        "grid gap-4 p-4 bg-muted/30 rounded-lg relative",
        layout === 'desktop' ? 'w-full aspect-[11/4]' : 'w-[360px] aspect-[4/11]',
        isLoading && "opacity-70 pointer-events-none",
        className
      )}
      style={{
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
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
                onRemove={() => handleRemoveWidget(cell.placementId!, x, y, cell.width!, cell.height!)}
              />
            )}
          </CellDroppable>
        ))
      )}
    </div>
  );
}