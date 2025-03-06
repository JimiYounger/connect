// my-app/src/features/dashboards/components/dashboard-grid.tsx

import { useEffect, useRef, useState } from 'react';
import { Widget } from '@/features/widgets/types';
import { WidgetRenderer } from '@/features/widgets/components/widget-renderer';
import { cn } from '@/lib/utils';
import { useDroppable, useDraggable } from '@dnd-kit/core';
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
import { useDndMonitor } from '@dnd-kit/core';

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

  // Use the hook to detect affected cells - remove isOccupied parameter
  const { isAffected, isValid } = useAffectedCells({
    x, y, grid, cols, rows
  });

  return (
    <div
      ref={setNodeRef}
      data-cell-id={`cell-${x}-${y}`}
      data-affected={isAffected}
      data-valid={isValid}
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

// Add this helper function at the top of the file
const isLargeWidget = (width: number, height: number) => 
  width >= 4 || height >= 4 || (width * height) >= 8;

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
    onPlacementsLoaded: updateGridWithPlacements 
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

  // Enhanced drag preview state
  const [dragPreview, setDragPreview] = useState<{
    widget: Widget;
    position: { x: number, y: number } | null;
    width: number;
    height: number;
    isValid: boolean;
    affectedCells: {x: number; y: number}[];
  } | null>(null);
  
  // Use enhanced useDndMonitor
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
        width: dimensions.width,
        height: dimensions.height,
        isValid: false,
        affectedCells: []
      });
      
      console.log(`[DragStart] Widget: ${activeWidget.name} (${dimensions.width}x${dimensions.height})`);
    },
    onDragEnd: () => {
      setDragPreview(null);
    },
    onDragCancel: () => {
      setDragPreview(null);
    }
  });
  
  // Update the preview effect
  useEffect(() => {
    if (!dragPreview?.widget) return;
    
    const affectedCells: {x: number; y: number}[] = [];
    let foundValid = false;
    let position = null;
    
    // Check if this is a large widget
    const isLarge = isLargeWidget(dragPreview.width, dragPreview.height);
    
    // For large widgets, we'll be more lenient with preview positions
    const checkRadius = isLarge ? 2 : 0;
    
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const cellElement = document.querySelector(`[data-cell-id="cell-${x}-${y}"]`);
        if (cellElement?.getAttribute('data-affected') === 'true') {
          affectedCells.push({x, y});
          
          if (cellElement?.getAttribute('data-valid') === 'true') {
            // For large widgets, prefer positions aligned to grid boundaries
            if (isLarge) {
              // Prefer positions that align with grid boundaries
              const isAligned = x % 2 === 0 && y % 2 === 0;
              if (isAligned && !position) {
                position = {x, y};
                foundValid = true;
              }
            } else if (!position) {
              position = {x, y};
              foundValid = true;
            }
          }
        }
        
        // For large widgets, also check nearby cells
        if (isLarge && !position) {
          for (let dy = -checkRadius; dy <= checkRadius; dy++) {
            for (let dx = -checkRadius; dx <= checkRadius; dx++) {
              const nearbyX = x + dx;
              const nearbyY = y + dy;
              if (nearbyX >= 0 && nearbyX < cols && nearbyY >= 0 && nearbyY < rows) {
                const nearbyCellElement = document.querySelector(
                  `[data-cell-id="cell-${nearbyX}-${nearbyY}"]`
                );
                if (nearbyCellElement?.getAttribute('data-valid') === 'true') {
                  position = {x: nearbyX, y: nearbyY};
                  foundValid = true;
                  break;
                }
              }
            }
            if (position) break;
          }
        }
      }
      if (position && !isLarge) break; // For small widgets, stop at first valid position
    }
    
    // Update preview state
    setDragPreview(prev => {
      if (!prev?.position || prev.position.x !== position?.x || prev.position.y !== position?.y) {
        return {
          ...prev!,
          position: position || null,
          isValid: foundValid,
          affectedCells,
        };
      }
      return prev;
    });
  }, [dragPreview?.widget, cols, rows]);

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
        className
      )}
      style={gridStyles}
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
      
      {/* Enhanced drag preview overlay */}
      {dragPreview && dragPreview.position && (
        <div 
          className={cn(
            "absolute pointer-events-none z-10 transition-all duration-150",
            dragPreview.isValid 
              ? 'border-2 border-primary/70 bg-primary/10' 
              : 'border-2 border-destructive/70 bg-destructive/10'
          )}
          style={{
            left: `${dragPreview.position.x * (GRID_CELL_SIZE + GRID_GAP)}px`,
            top: `${dragPreview.position.y * (GRID_CELL_SIZE + GRID_GAP)}px`,
            width: `${dragPreview.width * GRID_CELL_SIZE + (dragPreview.width - 1) * GRID_GAP}px`,
            height: `${dragPreview.height * GRID_CELL_SIZE + (dragPreview.height - 1) * GRID_GAP}px`,
            borderRadius: '8px',
            boxShadow: dragPreview.isValid 
              ? '0 0 20px rgba(var(--primary), 0.3)' 
              : '0 0 20px rgba(var(--destructive), 0.3)',
          }}
        >
          {/* Enhanced label for larger widgets */}
          {isLargeWidget(dragPreview.width, dragPreview.height) && (
            <div className={cn(
              "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2",
              "text-sm font-medium px-3 py-1.5 rounded-full backdrop-blur-sm",
              dragPreview.isValid 
                ? "bg-primary/40 text-primary-foreground" 
                : "bg-destructive/40 text-destructive-foreground"
            )}>
              {dragPreview.widget.name} ({dragPreview.width}×{dragPreview.height})
            </div>
          )}
        </div>
      )}
    </div>
  );
}