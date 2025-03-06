// my-app/src/features/dashboards/hooks/useDashboardDnd.ts

import { useState, useCallback } from 'react';
import { useDndMonitor } from '@dnd-kit/core';
import { Widget } from '@/features/widgets/types';
import { toast } from '@/hooks/use-toast';
import { SIZE_RATIO_TO_GRID, WidgetSizeRatio } from '@/config/uiConfig';
import { GridCell, validatePlacement, findValidPosition } from '@/utils/gridUtils';
import { dashboardService } from '@/features/dashboards/services/dashboard-service';

interface UseDashboardDndProps {
  grid: GridCell[][];
  rows: number;
  cols: number;
  placeWidget: (widget: Widget, x: number, y: number, width: number, height: number, placementId: string, configuration?: any) => void;
  removeWidget: (x: number, y: number, width: number, height: number) => void;
  savePlacement: (placementData: any) => Promise<any>;
  deletePlacement: (placementId: string) => Promise<boolean>;
  updatePlacement: (placementId: string, updateData: any) => Promise<boolean>;
  isLoading: boolean;
  userId?: string;
  readOnly?: boolean;
  layout: 'mobile' | 'desktop';
  onPlacementChange?: () => void;
}

/**
 * Hook for handling dashboard DND operations
 */
export function useDashboardDnd({
  grid,
  rows,
  cols,
  placeWidget,
  removeWidget,
  savePlacement,
  deletePlacement,
  updatePlacement,
  isLoading: externalIsLoading,
  userId,
  readOnly = false,
  layout,
  onPlacementChange
}: UseDashboardDndProps) {
  // Replace boolean state with a counter for tracking multiple concurrent operations
  const [loadingCounter, setLoadingCounter] = useState(0);

  // Helper functions to manage loading state
  const startLoading = useCallback(() => {
    setLoadingCounter(prev => prev + 1);
  }, []);

  const endLoading = useCallback(() => {
    setLoadingCounter(prev => Math.max(0, prev - 1));
  }, []);

  // Check if a widget can be placed at a specific position
  const canPlaceWidget = useCallback((x: number, y: number, widgetWidth: number, widgetHeight: number) => {
    const { isValid } = validatePlacement(x, y, widgetWidth, widgetHeight, grid, cols, rows);
    return isValid;
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

  // Handle widget placement from drag and drop
  const handlePlaceWidget = useCallback(async (widget: Widget, x: number, y: number, widgetConfiguration?: any) => {
    if (readOnly) {
      console.log("[handlePlaceWidget] Cancelled due to readOnly mode");
      return;
    }
    
    // Log the placement attempt
    console.log(`[handlePlaceWidget] Attempting to place widget ${widget.id} (${widget.name}) at position (${x}, ${y})`, {
      widget,
      position: { x, y },
      config: widgetConfiguration,
      layout
    });
    
    // Increment loading counter at start of operation
    startLoading();
    
    try {
      // Get widget dimensions from size ratio
      const sizeRatio = widget.size_ratio as WidgetSizeRatio || '1:1';
      const widgetDimensions = SIZE_RATIO_TO_GRID[sizeRatio] || { width: 1, height: 1 };
      
      console.log("[handlePlaceWidget] Widget dimensions:", {
        sizeRatio: widget.size_ratio,
        widgetDimensions,
        gridSize: { rows, cols },
        dropPosition: { x, y }
      });
      
      // Check if widget can be placed at the specified position
      if (!canPlaceWidget(x, y, widgetDimensions.width, widgetDimensions.height)) {
        console.log("[handlePlaceWidget] Widget placement failed validation check", {
          x, y, 
          width: widgetDimensions.width, 
          height: widgetDimensions.height,
          gridSize: { rows, cols }
        });
        
        toast({
          title: "Cannot place widget",
          description: "The selected position is not available.",
          variant: "destructive"
        });
        return;
      }
      
      // Prepare placement data
      const placementData = {
        widget_id: widget.id,
        position_x: x,
        position_y: y,
        width: widgetDimensions.width,
        height: widgetDimensions.height,
        layout_type: layout,
        created_by: userId || null,
      };
      
      console.log("[handlePlaceWidget] Saving placement with data:", placementData);
      
      // Save placement to database
      const placement = await savePlacement(placementData);
      
      console.log("[handlePlaceWidget] Placement saved result:", placement);
      
      // Verify we have all needed data
      if (!placement) {
        console.error("[handlePlaceWidget] Failed to create placement - no placement returned from server");
        toast({
          title: "Error",
          description: "Failed to save widget placement to the server.",
          variant: "destructive"
        });
        return;
      }
      
      if (!placement.id) {
        console.error("[handlePlaceWidget] Placement missing ID:", placement);
        toast({
          title: "Error",
          description: "Invalid placement data returned from server.",
          variant: "destructive"
        });
        return;
      }
      
      if (!widget) {
        console.error("[handlePlaceWidget] Widget missing");
        return;
      }
      
      console.log("[handlePlaceWidget] Placement created successfully with ID:", placement.id);
      
      // If we have widget configuration and placement was saved successfully,
      // save the configuration separately
      if (widgetConfiguration && placement) {
        try {
          console.log("[handlePlaceWidget] Saving widget configuration:", {
            widgetId: widget.id,
            config: widgetConfiguration
          });
          
          await dashboardService.saveWidgetConfiguration(
            widget.id,
            widgetConfiguration,
            userId
          );
          
          console.log("[handlePlaceWidget] Widget configuration saved successfully");
        } catch (configErr) {
          console.error('[handlePlaceWidget] Error saving widget configuration:', configErr);
          // Continue anyway since the placement was saved
        }
      }
      
      // Update the UI with the placed widget
      console.log("[handlePlaceWidget] Updating UI with placed widget");
      placeWidget(
        widget, 
        x, 
        y, 
        widgetDimensions.width, 
        widgetDimensions.height, 
        placement.id, 
        widgetConfiguration
      );
      
      // Notify parent component of placement change
      if (onPlacementChange) {
        console.log("[handlePlaceWidget] Notifying parent of placement change");
        onPlacementChange();
      }
      
      console.log("[handlePlaceWidget] Widget placement completed successfully");
      toast({
        title: "Widget placed",
        description: `${widget.name} has been added to the dashboard.`,
      });

      // Inside handlePlaceWidget, add after checking if widget can be placed:
      console.log(`[handlePlaceWidget] Creating rectangular placement for ${widgetDimensions.width}x${widgetDimensions.height} widget at (${x},${y})`);

      // Add a visualization for large widgets
      if (widgetDimensions.width >= 3 || widgetDimensions.height >= 3) {
        let visualPlacement = '';
        for (let y = 0; y < widgetDimensions.height; y++) {
          let row = '';
          for (let x = 0; x < widgetDimensions.width; x++) {
            row += '◼︎ ';
          }
          visualPlacement += row + '\n';
        }
        console.log('Widget placement shape:');
        console.log(visualPlacement);
      }
    } catch (err) {
      console.error('[handlePlaceWidget] Error placing widget:', err);
      
      // Log more detailed error information
      if (err instanceof Error) {
        console.error('[handlePlaceWidget] Error details:', {
          message: err.message,
          stack: err.stack,
          name: err.name
        });
      }
      
      toast({
        title: "Error",
        description: "An unexpected error occurred while placing the widget.",
        variant: "destructive"
      });
    } finally {
      // Always decrement loading counter in finally block
      endLoading();
    }
  }, [
    canPlaceWidget, 
    layout, 
    onPlacementChange, 
    placeWidget, 
    readOnly, 
    savePlacement, 
    userId,
    cols,
    rows,
    startLoading,
    endLoading,
    dashboardService
  ]);

  // Handle removing a widget from the grid
  const handleRemoveWidget = useCallback(async (placementId: string, x: number, y: number, width: number, height: number) => {
    if (readOnly) return;
    
    // Increment loading counter
    startLoading();
    
    try {
      // Delete placement from database
      const success = await deletePlacement(placementId);
      
      if (!success) {
        console.error('Error removing placement');
        return;
      }
      
      // Update the UI by removing the widget
      removeWidget(x, y, width, height);
      
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
      // Always decrement loading counter in finally block
      endLoading();
    }
  }, [deletePlacement, onPlacementChange, readOnly, removeWidget, startLoading, endLoading]);

  // Handle moving a widget within the grid
  const handleMoveWidget = useCallback(async (
    placementId: string,
    widget: Widget,
    sourceX: number,
    sourceY: number,
    newX: number,
    newY: number,
    width: number,
    height: number,
    configuration?: any
  ) => {
    if (readOnly) {
      console.log("[handleMoveWidget] Cancelled due to readOnly mode");
      return;
    }
    
    console.log(`[handleMoveWidget] Moving widget from (${sourceX},${sourceY}) to (${newX},${newY})`, {
      placementId,
      widget,
      dimensions: { width, height },
      hasConfig: !!configuration
    });
    
    // Increment loading counter
    startLoading();
    
    try {
      // If the position hasn't changed, do nothing
      if (sourceX === newX && sourceY === newY) {
        console.log("[handleMoveWidget] Position unchanged, skipping move");
        return;
      }
      
      // First ensure we can place at the target position
      if (!canPlaceWidget(newX, newY, width, height)) {
        console.error("[handleMoveWidget] Cannot move widget - target position not valid", {
          position: { x: newX, y: newY },
          dimensions: { width, height }
        });
        toast({
          title: "Cannot move widget",
          description: "The selected position is not available.",
          variant: "destructive"
        });
        return;
      }
      
      // Prepare update data
      const updateData = {
        position_x: newX,
        position_y: newY,
        // Keep same width/height
        width,
        height,
        // Keep same layout
        layout_type: layout,
        // Update timestamp
        updated_at: new Date().toISOString()
      };
      
      console.log("[handleMoveWidget] Updating placement with data:", updateData);
      
      // Update placement in database
      const success = await updatePlacement(placementId, updateData);
      
      if (!success) {
        console.error("[handleMoveWidget] Failed to update placement on server");
        toast({
          title: "Error",
          description: "Failed to update widget placement on the server.",
          variant: "destructive"
        });
        return;
      }
      
      console.log("[handleMoveWidget] Placement updated successfully");
      
      // First remove from source
      removeWidget(sourceX, sourceY, width, height);
      
      // Then place at new position
      placeWidget(widget, newX, newY, width, height, placementId, configuration);
      
      // Notify parent component
      if (onPlacementChange) {
        console.log("[handleMoveWidget] Notifying parent of placement change");
        onPlacementChange();
      }
      
      console.log("[handleMoveWidget] Widget moved successfully");
      toast({
        title: "Widget moved",
        description: "The widget has been moved to a new position.",
      });
    } catch (err) {
      console.error('[handleMoveWidget] Error moving widget:', err);
      
      // Log more detailed error information
      if (err instanceof Error) {
        console.error('[handleMoveWidget] Error details:', {
          message: err.message,
          stack: err.stack,
          name: err.name
        });
      }
      
      toast({
        title: "Error",
        description: "An unexpected error occurred while moving the widget.",
        variant: "destructive"
      });
    } finally {
      // Always decrement loading counter in finally block
      endLoading();
    }
  }, [
    canPlaceWidget,
    onPlacementChange, 
    placeWidget, 
    readOnly, 
    removeWidget, 
    updatePlacement,
    layout,
    startLoading,
    endLoading
  ]);

  // Use the monitor directly in the hook, not inside a callback
  useDndMonitor({
    onDragEnd: (event) => {
      const { active, over } = event;
      
      if (!over || !active) return;
      
      const activeData = active.data.current;
      const overData = over.data.current;
      
      if (!activeData || !overData) return;
      
      // Handle widget placement from library
      if (activeData.widget && !activeData.type && overData.x !== undefined && overData.y !== undefined) {
        // Get widget dimensions
        const widget = activeData.widget;
        const sizeRatio = widget.size_ratio as WidgetSizeRatio || '1:1';
        const dimensions = SIZE_RATIO_TO_GRID[sizeRatio] || { width: 1, height: 1 };
        
        console.log(`[DragEnd] Attempting to place widget: ${widget.name} (${dimensions.width}x${dimensions.height}) at cursor (${overData.x}, ${overData.y})`);
        
        // For all widgets, use the same consistent placement strategy
        // Calculate a centered placement position based on cursor
        let finalX = Math.max(0, Math.min(overData.x - Math.floor(dimensions.width / 2), cols - dimensions.width));
        let finalY = Math.max(0, Math.min(overData.y - Math.floor(dimensions.height / 2), rows - dimensions.height));
        
        // Verify if this position is valid
        const isCenteredValid = canPlaceWidget(finalX, finalY, dimensions.width, dimensions.height);
        
        if (!isCenteredValid) {
          console.log(`[DragEnd] Centered position not valid, finding alternative position`);
          
          // Try finding a valid position near the cursor
          const validPosition = findValidPosition(
            overData.x, 
            overData.y, 
            dimensions.width, 
            dimensions.height,
            grid,
            cols,
            rows
          );
          
          if (validPosition) {
            console.log(`[DragEnd] Found valid position at (${validPosition.x},${validPosition.y})`);
            finalX = validPosition.x;
            finalY = validPosition.y;
          } else {
            console.log(`[DragEnd] No valid positions available for widget`);
            toast({
              title: "Cannot place widget",
              description: "There is no available space for this widget on the dashboard.",
              variant: "destructive"
            });
            return;
          }
        }
        
        console.log(`[DragEnd] Final placement position: (${finalX},${finalY})`);
        handlePlaceWidget(widget, finalX, finalY, activeData.configuration);
        return;
      }
      
      // For internal widget movement
      if (activeData.type === 'move' && overData.x !== undefined && overData.y !== undefined) {
        console.log(`[DragEnd] Moving widget from (${activeData.sourceX},${activeData.sourceY}) to (${overData.x},${overData.y})`);
        
        // Use the same consistent placement strategy for all widget sizes
        // Calculate a centered placement position based on cursor
        let finalX = Math.max(0, Math.min(overData.x - Math.floor(activeData.width / 2), cols - activeData.width));
        let finalY = Math.max(0, Math.min(overData.y - Math.floor(activeData.height / 2), rows - activeData.height));
        
        // Verify if this position is valid
        const isCenteredValid = canPlaceWidget(finalX, finalY, activeData.width, activeData.height);
        
        if (!isCenteredValid) {
          console.log(`[DragEnd] Centered position not valid, finding alternative position`);
          
          // Try finding a valid position near the cursor
          const validPosition = findValidPosition(
            overData.x, 
            overData.y, 
            activeData.width, 
            activeData.height,
            grid,
            cols,
            rows
          );
          
          if (validPosition) {
            console.log(`[DragEnd] Found valid position at (${validPosition.x},${validPosition.y})`);
            finalX = validPosition.x;
            finalY = validPosition.y;
          } else {
            console.log(`[DragEnd] No valid position found, keeping widget at original position`);
            toast({
              title: "Cannot move widget",
              description: "There is no available space for this widget on the dashboard.",
              variant: "destructive"
            });
            return;
          }
        }
        
        console.log(`[DragEnd] Moving widget to final position: (${finalX},${finalY})`);
        handleMoveWidget(
          activeData.placementId,
          activeData.widget,
          activeData.sourceX,
          activeData.sourceY,
          finalX,
          finalY,
          activeData.width,
          activeData.height,
          activeData.configuration
        );
      }
    }
  });

  // Diagnostic function to identify position bias
  const analyzeGridPositions = useCallback(() => {
    console.log(`[Grid Analysis] Analyzing available positions for different widget sizes...`);
    
    // Define widget sizes to test
    const sizesToTest = [
      { width: 1, height: 1, name: "1x1" },
      { width: 2, height: 2, name: "2x2" },
      { width: 3, height: 3, name: "3x3" },
      { width: 4, height: 4, name: "4x4" }
    ];
    
    for (const size of sizesToTest) {
      let validCount = 0;
      let visualGrid = '';
      
      // Maximum 10x10 for visual output
      const maxVisualRows = Math.min(10, rows);
      const maxVisualCols = Math.min(10, cols);
      
      for (let y = 0; y < maxVisualRows; y++) {
        let rowStr = '';
        for (let x = 0; x < maxVisualCols; x++) {
          if (x + size.width <= cols && y + size.height <= rows) {
            const result = canPlaceWidget(x, y, size.width, size.height);
            if (result) {
              validCount++;
              rowStr += '✓ ';
            } else {
              rowStr += '× ';
            }
          } else {
            rowStr += '· ';
          }
        }
        visualGrid += rowStr + '\n';
      }
      
      console.log(`Widget size ${size.name}:`);
      console.log(visualGrid);
      console.log(`Valid positions: ${validCount} for ${size.name} widgets`);
    }
  }, [rows, cols, canPlaceWidget]);

  // Call this function when debugging placement issues
  // Uncomment the following line when investigating placement bias:
  // analyzeGridPositions(); 

  return {
    // Calculate isLoading based on counter > 0 or external loading state
    isLoading: loadingCounter > 0 || externalIsLoading,
    setIsLoading: startLoading, // Keep for compatibility
    startLoading,
    endLoading,
    canPlaceWidget,
    findAvailablePosition,
    handlePlaceWidget,
    handleRemoveWidget,
    handleMoveWidget,
    analyzeGridPositions // Add this to the return object
  };
} 