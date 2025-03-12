// my-app/src/features/dashboards/components/dashboard-grid.tsx

import { useEffect, useRef, useState } from 'react';
import { Widget } from '@/features/widgets/types';
import { WidgetRenderer } from '@/features/widgets/components/widget-renderer';
import { cn } from '@/lib/utils';
import { useDroppable, useDraggable, useDndMonitor, DragMoveEvent } from '@dnd-kit/core';
import { Trash2 } from 'lucide-react';
import { initializeWidgets } from '@/features/widgets/init-widgets';
// Import from utility files
import { 
  GRID_CELL_SIZE, 
  GRID_GAP, 
  WIDGET_BORDER_RADIUS,
  SIZE_RATIO_TO_GRID,
  WidgetSizeRatio
} from '@/config/uiConfig';
import {
  GridCell,
} from '@/utils/gridUtils';
// Import the new hooks
import { useAffectedCells } from '../hooks/useAffectedCells';

// Import our new hooks
import { useGridState } from '../hooks/useGridState';
import { useGridDimensions } from '../hooks/useGridDimensions';
import { useGridPersistence } from '../hooks/useGridPersistence';
import { useDashboardDnd } from '../hooks/useDashboardDnd';

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

// Cell droppable component
interface CellDroppableProps {
  x: number;
  y: number;
  isOccupied: boolean;
  children: React.ReactNode;
  grid: GridCell[][];
  cols: number;
  rows: number;
}

function CellDroppable({ x, y, isOccupied, children, grid, cols, rows }: CellDroppableProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `cell-${x}-${y}`,
    data: { x, y, isOccupied },
    disabled: isOccupied
  });

  // Use the hook to detect affected cells
  const { isAffected, isValid } = useAffectedCells({
    x, y, grid, cols, rows
  });

  return (
    <div
      ref={setNodeRef}
      data-cell-id={`cell-${x}-${y}`}
      data-affected={isAffected}
      data-valid={isValid}
      data-x={x}
      data-y={y}
      className={cn(
        "relative rounded transition-all duration-150",
        !isOccupied && (
          isValid 
            ? isAffected 
              ? "bg-primary/20 border-primary/50 shadow-inner" 
              : "hover:bg-primary/5"
            : isOver 
              ? "bg-destructive/10 border-destructive/50" 
              : isAffected
                ? "bg-destructive/10 border-destructive/30"
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
  onRemove: () => void;
  readOnly?: boolean;
  configuration?: any; 
}

function DraggableWidget({ 
  widget, 
  placementId, 
  x, 
  y, 
  width, 
  height, 
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

  // Extract styling from configuration
  const backgroundColor = configuration?.styles?.backgroundColor || 'white';
  const textColor = configuration?.styles?.textColor || 'black';
  
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
          backgroundColor: backgroundColor,
          color: textColor,
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
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
              backgroundColor: 'transparent', // Allow parent's background to show
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
  const gridRef = useRef<HTMLDivElement>(null);
  
  // Use our new hooks
  const { gridStyles, containerClasses } = useGridDimensions({ layout, rows, cols });
  
  const { 
    grid, 
    placeWidget, 
    removeWidget, 
    updateGridWithPlacements 
  } = useGridState({ rows, cols });
  
  const { 
    isLoading, 
    savePlacement, 
    deletePlacement, 
    updatePlacement 
  } = useGridPersistence({ 
    dashboardId, 
    draftId, 
    layout, 
    onPlacementsLoaded: updateGridWithPlacements,
    userId: userId || '' 
  });
  
  const { 
    handlePlaceWidget: _handlePlaceWidget,
    handleRemoveWidget, 
    handleMoveWidget: _handleMoveWidget
  } = useDashboardDnd({
    grid,
    rows,
    cols,
    placeWidget,
    removeWidget,
    savePlacement,
    deletePlacement,
    updatePlacement,
    isLoading,
    userId,
    readOnly,
    layout,
    onPlacementChange
  });

  // Set up droppable area for the entire grid
  const { setNodeRef } = useDroppable({
    id: `dashboard-grid-${layout}`,
    data: {
      layout,
      rows,
      cols,
    },
  });

  // Widget initialization
  useEffect(() => {
    const init = async () => {
      await initializeWidgets();
    };
    init();
  }, []);

  // Enhanced drag preview state with cursor position tracking
  const [dragPreview, setDragPreview] = useState<{
    widget: Widget;
    position: { x: number, y: number } | null;
    cursorPosition: { x: number, y: number } | null;
    width: number;
    height: number;
    isValid: boolean;
    affectedCells: {x: number; y: number}[];
    isOverGrid: boolean;
  } | null>(null);

  // Track mouse position during drag
  const [mousePosition, setMousePosition] = useState<{x: number, y: number} | null>(null);
  const gridBounds = useRef<DOMRect | null>(null);
  
  // Update grid bounds when the component mounts or resizes
  useEffect(() => {
    if (gridRef.current) {
      gridBounds.current = gridRef.current.getBoundingClientRect();
    }
    
    const updateBounds = () => {
      if (gridRef.current) {
        gridBounds.current = gridRef.current.getBoundingClientRect();
      }
    };
    
    window.addEventListener('resize', updateBounds);
    return () => {
      window.removeEventListener('resize', updateBounds);
    };
  }, []);
  
  // Use enhanced useDndMonitor with move tracking
  useDndMonitor({
    onDragStart: (event) => {
      const { active } = event;
      const activeData = active?.data?.current;
      const activeWidget = activeData?.widget;
      
      if (!activeWidget) {
        setDragPreview(null);
        return;
      }
      
      // Get widget dimensions
      const sizeRatio = activeWidget.size_ratio as WidgetSizeRatio || '1:1';
      const dimensions = SIZE_RATIO_TO_GRID[sizeRatio] || { width: 1, height: 1 };
      
      setDragPreview({
        widget: activeWidget,
        position: null, // Will be set during drag
        cursorPosition: null, // Will be set during drag
        width: dimensions.width,
        height: dimensions.height,
        isValid: false,
        affectedCells: [],
        isOverGrid: false
      });
      
      console.log(`[DragStart] Widget: ${activeWidget.name} (${dimensions.width}x${dimensions.height})`);
    },
    onDragMove: (event: DragMoveEvent) => {
      if (!dragPreview?.widget) return;
      
      // Track mouse position
      const { clientX, clientY } = event.activatorEvent as MouseEvent;
      
      if (gridBounds.current) {
        // Convert client coordinates to grid-relative coordinates
        const gridX = clientX - gridBounds.current.left;
        const gridY = clientY - gridBounds.current.top;
        
        // Check if cursor is over the grid
        const isOverGrid = 
          gridX >= 0 && 
          gridX <= gridBounds.current.width && 
          gridY >= 0 && 
          gridY <= gridBounds.current.height;
        
        setMousePosition({ x: gridX, y: gridY });
        
        // Update preview isOverGrid state
        if (dragPreview.isOverGrid !== isOverGrid) {
          setDragPreview(prev => prev ? { ...prev, isOverGrid } : null);
        }
      }
    },
    onDragEnd: () => {
      setDragPreview(null);
      setMousePosition(null);
    },
    onDragCancel: () => {
      setDragPreview(null);
      setMousePosition(null);
    }
  });
  
  // Enhanced preview effect - always shows preview near cursor position
  useEffect(() => {
    if (!dragPreview?.widget || !mousePosition) return;
    
    // Calculate cell coordinates from mouse position
    const cellX = Math.floor(mousePosition.x / (GRID_CELL_SIZE + GRID_GAP));
    const cellY = Math.floor(mousePosition.y / (GRID_CELL_SIZE + GRID_GAP));
    
    // Ensure cell coordinates are within grid bounds
    const boundedCellX = Math.max(0, Math.min(cellX, cols - 1));
    const boundedCellY = Math.max(0, Math.min(cellY, rows - 1));
    
    // Get affected cells from the DOM
    const affectedCells: {x: number; y: number}[] = [];
    let foundValid = false;
    let position = null;
    
    // Find the valid position
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const cellElement = document.querySelector(`[data-cell-id="cell-${x}-${y}"]`);
        if (cellElement?.getAttribute('data-affected') === 'true') {
          affectedCells.push({x, y});
          
          if (cellElement?.getAttribute('data-valid') === 'true' && !position) {
            position = {x, y};
            foundValid = true;
          }
        }
      }
    }
    
    // Calculate cursor-centered position for preview
    // This ensures the preview is always near the cursor
    const centerX = Math.max(0, Math.min(boundedCellX - Math.floor(dragPreview.width / 2), cols - dragPreview.width));
    const centerY = Math.max(0, Math.min(boundedCellY - Math.floor(dragPreview.height / 2), rows - dragPreview.height));
    
    // Use the cell position if valid, otherwise use center position
    const finalPosition = position || { x: centerX, y: centerY };
    
    // Update preview state
    setDragPreview(prev => {
      if (!prev) return null;
      
      // Only update if position has changed to avoid extra renders
      if (!prev.position || 
          !prev.cursorPosition ||
          prev.position.x !== finalPosition.x || 
          prev.position.y !== finalPosition.y ||
          prev.cursorPosition.x !== boundedCellX ||
          prev.cursorPosition.y !== boundedCellY ||
          prev.isValid !== foundValid
      ) {
        return {
          ...prev,
          position: finalPosition,
          cursorPosition: { x: boundedCellX, y: boundedCellY },
          isValid: foundValid,
          affectedCells,
        };
      }
      return prev;
    });
  }, [dragPreview?.widget, mousePosition, cols, rows, dragPreview?.width, dragPreview?.height]);

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
        containerClasses,
        isLoading && "opacity-70 pointer-events-none",
        className,
        "mx-auto"
      )}
      style={{
        ...gridStyles,
        margin: '0 auto',
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
          >
            {cell.isOccupied && cell.widget && cell.width && cell.height && cell.placementId && (
              <DraggableWidget
                widget={cell.widget}
                placementId={cell.placementId}
                x={x}
                y={y}
                width={cell.width}
                height={cell.height}
                readOnly={readOnly}
                configuration={cell.configuration}
                onRemove={() => handleRemoveWidget(cell.placementId!, x, y, cell.width!, cell.height!)}
              />
            )}
          </CellDroppable>
        ))
      )}
      
      {/* Enhanced drag preview overlay - always visible during drag */}
      {dragPreview && mousePosition && dragPreview.isOverGrid && (
        <>
          {/* Preview overlay at placement position */}
          <div 
            className={cn(
              "absolute pointer-events-none z-10 transition-all duration-150",
              dragPreview.isValid 
                ? 'border-2 border-primary/70 bg-primary/10' 
                : 'border-2 border-destructive/70 bg-destructive/10'
            )}
            style={{
              left: `${dragPreview.position?.x! * (GRID_CELL_SIZE + GRID_GAP)}px`,
              top: `${dragPreview.position?.y! * (GRID_CELL_SIZE + GRID_GAP)}px`,
              width: `${dragPreview.width * GRID_CELL_SIZE + (dragPreview.width - 1) * GRID_GAP}px`,
              height: `${dragPreview.height * GRID_CELL_SIZE + (dragPreview.height - 1) * GRID_GAP}px`,
              borderRadius: '8px',
              boxShadow: dragPreview.isValid 
                ? '0 0 20px rgba(var(--primary), 0.3)' 
                : '0 0 20px rgba(var(--destructive), 0.3)',
              opacity: 0.9,
            }}
          >
            {/* Widget info label - always visible */}
            <div className={cn(
              "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2",
              "text-sm font-medium px-3 py-1.5 rounded-full backdrop-blur-sm",
              dragPreview.isValid 
                ? "bg-primary/60 text-primary-foreground" 
                : "bg-destructive/60 text-destructive-foreground"
            )}>
              {dragPreview.widget.name} ({dragPreview.width}×{dragPreview.height})
            </div>
          </div>
          
          {/* Cursor position indicator */}
          <div 
            className="absolute pointer-events-none z-9 rounded-full border-2 border-primary animate-pulse"
            style={{
              left: `${dragPreview.cursorPosition?.x! * (GRID_CELL_SIZE + GRID_GAP)}px`,
              top: `${dragPreview.cursorPosition?.y! * (GRID_CELL_SIZE + GRID_GAP)}px`,
              width: `${GRID_CELL_SIZE}px`,
              height: `${GRID_CELL_SIZE}px`,
              opacity: 0.6,
            }}
          />
        </>
      )}
    </div>
  );
}