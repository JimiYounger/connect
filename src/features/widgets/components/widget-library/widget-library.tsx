// my-app/src/features/widgets/components/widget-library/widget-library.tsx

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useWidgets } from '../../hooks/use-widgets';
import { useWidgetConfiguration } from '../../hooks/use-widget-configuration';
import { WidgetRenderer } from '../widget-renderer';
import { Widget, WidgetCategory, WidgetSizeRatio, WidgetConfigData } from '../../types';
import { useDraggable } from '@dnd-kit/core';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext } from '@/components/ui/pagination';
import { motion } from 'framer-motion';
import '@/features/widgets/styles/widget-library.css';

interface WidgetLibraryProps {
  userId: string;
  onWidgetSelect?: (widget: Widget) => void;
  categories?: WidgetCategory[];
  className?: string;
}

// Constants for the grid system
const _GRID_COLUMNS = 4;           // Number of columns in the grid
const GRID_BASE_UNIT = 74;        // Base unit size in pixels
const GRID_GAP = 16;              // Gap between widgets

// Add this constant at the top with other constants
const WIDGET_BORDER_RADIUS = '50px';

// Calculate dimensions based on grid units
const getWidgetDimensions = (widthUnits: number, heightUnits: number) => {
  const width = (GRID_BASE_UNIT * widthUnits) + (GRID_GAP * (widthUnits - 1));
  const height = (GRID_BASE_UNIT * heightUnits) + (GRID_GAP * (heightUnits - 1));
  return { width, height };
};

// Updated SIZE_RATIO_MAP with precise iOS-style dimensions
const SIZE_RATIO_MAP: Record<WidgetSizeRatio, { width: number; height: number }> = {
  '1:1': getWidgetDimensions(1, 1),
  '2:1': getWidgetDimensions(2, 1),
  '1:2': getWidgetDimensions(1, 2),
  '2:2': getWidgetDimensions(2, 2),
  '3:2': getWidgetDimensions(3, 2),
  '2:3': getWidgetDimensions(2, 3),
  '4:3': getWidgetDimensions(4, 3),
  '3:4': getWidgetDimensions(3, 4),
  '4:4': getWidgetDimensions(4, 4),
  '2:4': getWidgetDimensions(2, 4),
  '4:2': getWidgetDimensions(4, 2),
};

// Widget item that can be dragged
const DraggableWidgetItem: React.FC<{
  widget: Widget;
  onSelect?: (widget: Widget) => void;
  className?: string;
}> = ({ widget, onSelect, className }) => {
  const { configuration } = useWidgetConfiguration({
    widgetId: widget.id,
    type: widget.widget_type,
  });
  
  // Ensure configData is of type WidgetConfigData
  const configData = configuration?.config as WidgetConfigData || {};
  
  // Set up draggable
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: widget.id,
    data: {
      widget,
      configuration: configData,
    },
  });
  
  // Get dimensions based on size ratio
  const dimensions = SIZE_RATIO_MAP[widget.size_ratio as WidgetSizeRatio] || SIZE_RATIO_MAP['1:1'];
  const isCircle = widget.shape === 'circle';
  
  // For circles, ensure width and height are equal using the smaller dimension
  const circleSize = isCircle ? Math.min(dimensions.width, dimensions.height) : null;
  
  const sizeClass = `widget-size-${widget.size_ratio?.replace(':', '-')}`;
  
  return (
    <motion.div 
      className={cn("widget-container", sizeClass, className)}
      style={{
        width: isCircle ? `${circleSize}px` : `${dimensions.width}px`,
        height: isCircle ? `${circleSize}px` : `${dimensions.height}px`,
        overflow: 'hidden',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        borderRadius: isCircle ? '50%' : WIDGET_BORDER_RADIUS,
        position: 'relative',
        backgroundColor: 'transparent',
      }}
      whileHover={{ scale: 1.02, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
      whileTap={{ scale: 0.98 }}
    >
      <div
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        className={cn(
          'widget-card relative cursor-grab',
          isDragging ? 'opacity-70 z-10' : 'opacity-100'
        )}
        style={{ 
          backgroundColor: 'transparent',
          borderRadius: isCircle ? '50%' : WIDGET_BORDER_RADIUS,
          overflow: 'hidden',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
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
            configuration={configData}
            width={isCircle ? circleSize! : dimensions.width}
            height={isCircle ? circleSize! : dimensions.height}
            borderRadius={isCircle ? '50%' : WIDGET_BORDER_RADIUS}
            style={{ 
              backgroundColor: 'transparent',
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              position: 'relative',
            }}
          />
        </div>
      </div>
    </motion.div>
  );
};

export const WidgetLibrary: React.FC<WidgetLibraryProps> = ({
  userId,
  onWidgetSelect,
  categories: propCategories = [],
  className,
}) => {
  // State for search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRatio, setSelectedRatio] = useState<string>('all');
  
  // Fetch widgets with infinite scroll
  const { widgets, isLoading, error, hasMore, loadMore } = useWidgets({
    userId,
    isPublished: true,
  });
  
  // Use provided categories or create a memoized empty array
  const categories = useMemo(() => propCategories || [], [propCategories]);
  
  // Collect available size ratios from current widgets
  const availableRatios = useMemo(() => {
    const ratioSet = new Set<string>();
    widgets?.forEach(widget => {
      if (widget.size_ratio) {
        ratioSet.add(widget.size_ratio as string);
      }
    });
    return Array.from(ratioSet).sort();
  }, [widgets]);
  
  // Filter widgets based on search and category
  const filteredWidgets = useMemo(() => {
    if (!widgets) return [];
    
    return widgets.filter(widget => {
      // Filter by search query
      const matchesSearch = 
        searchQuery === '' || 
        widget.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (widget.description && widget.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // Filter by category
      const matchesCategory = 
        selectedCategory === 'all' || 
        widget.category_id === selectedCategory;
      
      // Filter by size ratio
      const matchesRatio = 
        selectedRatio === 'all' || 
        widget.size_ratio === selectedRatio;
      
      return matchesSearch && matchesCategory && matchesRatio;
    });
  }, [widgets, searchQuery, selectedCategory, selectedRatio]);

  // Add a ref to access the scroll container
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Handle scroll for infinite loading
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (
        container.scrollLeft + container.clientWidth >= container.scrollWidth - 20 && // 20px threshold
        !isLoading &&
        hasMore
      ) {
        loadMore();
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [isLoading, hasMore, loadMore]);
  
  // Handle wheel events to enable horizontal scrolling with the mouse wheel
  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    
    if (scrollContainerRef.current) {
      // Scroll horizontally by the vertical scroll amount (with some multiplier for better feel)
      scrollContainerRef.current.scrollLeft += event.deltaY * 0.5;
    }
  };
  
  // Group widgets by category
  const widgetsByCategory = useMemo(() => {
    const grouped: Record<string, Widget[]> = {};
    
    // Initialize with empty arrays for all categories
    categories.forEach((category: WidgetCategory) => {
      grouped[category.id] = [];
    });
    
    // Add uncategorized group
    grouped['uncategorized'] = [];
    
    // Group widgets
    filteredWidgets.forEach(widget => {
      if (widget.category_id && grouped[widget.category_id]) {
        grouped[widget.category_id].push(widget);
      } else {
        grouped['uncategorized'].push(widget);
      }
    });
    
    return grouped;
  }, [filteredWidgets, categories]);
  
  return (
    <div className={cn('widget-library flex flex-col h-full font-sans', className)}>
      <div className="widget-library-header p-4 flex flex-col items-center">
        <h2 className="text-xl font-semibold mb-4">Widget Library</h2>
        
        <div className="search-container w-full max-w-md mb-4">
          <div className="relative flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:items-center">
            <div className="search-input-wrapper bg-[#F2F2F7] rounded-full flex items-center px-3 py-2 w-full">
              <Search className="text-gray-400 h-4 w-4 mr-2 flex-shrink-0" />
              <Input
                placeholder="Search widgets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 h-8 px-0"
              />
            </div>
            
            <div className="filter-container sm:ml-2 flex space-x-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="ios-select bg-[#F2F2F7] rounded-full px-3 py-2 text-sm border-0 focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                {categories.map((category: WidgetCategory) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              
              <select
                value={selectedRatio}
                onChange={(e) => setSelectedRatio(e.target.value)}
                className="ios-select bg-[#F2F2F7] rounded-full px-3 py-2 text-sm border-0 focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Sizes</option>
                {availableRatios.map((ratio) => (
                  <option key={ratio} value={ratio}>
                    {ratio}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
      
      <div 
        className="flex-1 px-4 overflow-hidden relative" 
        onWheel={handleWheel}
        ref={scrollContainerRef}
      >
        <div className="overflow-x-auto overflow-y-hidden h-full" style={{ width: "100%" }}>
          {isLoading && widgets.length === 0 ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-pulse flex space-x-2">
                <div className="h-2 w-2 bg-gray-300 rounded-full"></div>
                <div className="h-2 w-2 bg-gray-300 rounded-full"></div>
                <div className="h-2 w-2 bg-gray-300 rounded-full"></div>
              </div>
            </div>
          ) : error ? (
            <div className="text-red-500 p-4">
              Error loading widgets: {error.message}
            </div>
          ) : filteredWidgets.length === 0 ? (
            <div className="text-gray-500 p-4 text-center">
              No widgets found. Try adjusting your search.
            </div>
          ) : selectedCategory === 'all' ? (
            // iOS-style grid layout for all widgets
            <div className="ios-widget-grid">
              {filteredWidgets.map((widget) => (
                <DraggableWidgetItem
                  key={widget.id}
                  widget={widget}
                  onSelect={onWidgetSelect}
                />
              ))}
              {isLoading && (
                <div className="col-span-full flex justify-center p-4">
                  <div className="animate-pulse flex space-x-2">
                    <div className="h-2 w-2 bg-gray-300 rounded-full"></div>
                    <div className="h-2 w-2 bg-gray-300 rounded-full"></div>
                    <div className="h-2 w-2 bg-gray-300 rounded-full"></div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Category-based layout
            <div className="space-y-8 w-max">
              {Object.entries(widgetsByCategory).map(([categoryId, categoryWidgets]) => {
                if (categoryWidgets.length === 0) return null;
                
                const categoryName = categories.find((c: WidgetCategory) => c.id === categoryId)?.name || 'Uncategorized';
                
                return (
                  <div key={categoryId} className="widget-category">
                    <h3 className="text-lg font-medium mb-4">{categoryName}</h3>
                    <div className="ios-widget-grid">
                      {categoryWidgets.map((widget) => (
                        <DraggableWidgetItem
                          key={widget.id}
                          widget={widget}
                          onSelect={onWidgetSelect}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
              {isLoading && (
                <div className="flex justify-center p-4">
                  <div className="animate-pulse flex space-x-2">
                    <div className="h-2 w-2 bg-gray-300 rounded-full"></div>
                    <div className="h-2 w-2 bg-gray-300 rounded-full"></div>
                    <div className="h-2 w-2 bg-gray-300 rounded-full"></div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};