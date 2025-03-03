// my-app/src/features/widgets/components/widget-library/widget-library.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { useWidgets } from '../../hooks/use-widgets';
import { useWidgetConfiguration } from '../../hooks/use-widget-configuration';
import { WidgetRenderer } from '../widget-renderer';
import { Widget, WidgetCategory, WidgetSizeRatio, WidgetConfigData } from '../../types';
import { useDraggable } from '@dnd-kit/core';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Pagination } from '@/components/ui/pagination';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext } from '@/components/ui/pagination';
import { motion } from 'framer-motion';

interface WidgetLibraryProps {
  userId: string;
  onWidgetSelect?: (widget: Widget) => void;
  categories?: WidgetCategory[];
  className?: string;
}

// Size ratio to pixel dimensions mapping (base size for 1:1)
const SIZE_RATIO_MAP: Record<WidgetSizeRatio, { width: number; height: number }> = {
  '1:1': { width: 120, height: 120 },     // Small square
  '2:1': { width: 240, height: 120 },     // Wide rectangle
  '1:2': { width: 120, height: 240 },     // Tall rectangle
  '3:2': { width: 360, height: 240 },     // Landscape (3:2 ratio)
  '2:3': { width: 240, height: 360 },     // Portrait (2:3 ratio)
  '4:3': { width: 480, height: 360 },     // Standard (4:3 ratio)
  '3:4': { width: 360, height: 480 },     // Vertical (3:4 ratio)
  '2:2': { width: 240, height: 240 },     // Medium square
  '4:4': { width: 480, height: 480 },     // Large square
  '2:4': { width: 240, height: 480 },     // Tall rectangle (2x4)
  '4:2': { width: 480, height: 240 },     // Wide rectangle (4x2)
};

// Widget item that can be dragged
const DraggableWidgetItem: React.FC<{
  widget: Widget;
  onSelect?: (widget: Widget) => void;
}> = ({ widget, onSelect }) => {
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
  
  // Determine the appropriate border radius based on widget shape
  // For circle widgets, use 50% border radius, otherwise use the iOS-style 14px
  const borderRadius = isCircle ? '50%' : '14px';
  
  return (
    <motion.div 
      className="widget-container"
      style={{
        width: `${dimensions.width}px`,
        height: `${dimensions.height}px`,
        overflow: 'hidden',
        margin: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        borderRadius: borderRadius,
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
          'widget-card relative cursor-grab h-full w-full',
          isDragging ? 'opacity-70 z-10' : 'opacity-100'
        )}
        onClick={() => onSelect?.(widget)}
        style={{ 
          backgroundColor: 'transparent',
          borderRadius: borderRadius,
          overflow: 'hidden'
        }}
      >
        <WidgetRenderer
          widget={widget}
          configuration={configData}
          width={dimensions.width}
          height={dimensions.height}
          borderRadius={borderRadius}
          style={{ backgroundColor: 'transparent' }}
        />
      </div>
    </motion.div>
  );
};

export const WidgetLibrary: React.FC<WidgetLibraryProps> = ({
  userId,
  onWidgetSelect,
  categories = [],
  className,
}) => {
  // State for search and pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRatio, setSelectedRatio] = useState<string>('all');
  const itemsPerPage = 12;
  
  // Fetch widgets
  const { widgets, isLoading, error, refetch: _refetch } = useWidgets({
    userId,
    isPublished: true,
  });
  
  // Collect available size ratios from current widgets
  const availableRatios = useMemo(() => {
    const ratioSet = new Set<string>();
    widgets.forEach(widget => {
      if (widget.size_ratio) {
        ratioSet.add(widget.size_ratio as string);
      }
    });
    return Array.from(ratioSet).sort((a, b) => {
      // Sort by area (largest first)
      const dimensionsA = SIZE_RATIO_MAP[a as WidgetSizeRatio] || SIZE_RATIO_MAP['1:1'];
      const dimensionsB = SIZE_RATIO_MAP[b as WidgetSizeRatio] || SIZE_RATIO_MAP['1:1'];
      const areaA = dimensionsA.width * dimensionsA.height;
      const areaB = dimensionsB.width * dimensionsB.height;
      return areaB - areaA;
    });
  }, [widgets]);
  
  // Filter and sort widgets based on search query, selected category, and size
  const filteredWidgets = useMemo(() => {
    // First filter the widgets
    const filtered = widgets.filter(widget => {
      const matchesSearch = 
        searchQuery === '' || 
        widget.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (widget.description && widget.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = 
        selectedCategory === 'all' || 
        widget.category_id === selectedCategory;
      
      const matchesRatio =
        selectedRatio === 'all' ||
        widget.size_ratio === selectedRatio;
      
      return matchesSearch && matchesCategory && matchesRatio;
    });
    
    // Then sort them by size (largest to smallest)
    return filtered.sort((a, b) => {
      // Get dimensions for each widget
      const dimensionsA = SIZE_RATIO_MAP[a.size_ratio as WidgetSizeRatio] || SIZE_RATIO_MAP['1:1'];
      const dimensionsB = SIZE_RATIO_MAP[b.size_ratio as WidgetSizeRatio] || SIZE_RATIO_MAP['1:1'];
      
      // Calculate total area
      const areaA = dimensionsA.width * dimensionsA.height;
      const areaB = dimensionsB.width * dimensionsB.height;
      
      // Sort largest to smallest
      return areaB - areaA;
    });
  }, [widgets, searchQuery, selectedCategory, selectedRatio]);
  
  // Paginate widgets
  const paginatedWidgets = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredWidgets.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredWidgets, currentPage, itemsPerPage]);
  
  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedRatio]);
  
  // Group widgets by category
  const widgetsByCategory = useMemo(() => {
    const grouped: Record<string, Widget[]> = {};
    
    // Initialize with empty arrays for all categories
    categories.forEach(category => {
      grouped[category.id] = [];
    });
    
    // Add uncategorized group
    grouped['uncategorized'] = [];
    
    // Group widgets
    paginatedWidgets.forEach(widget => {
      if (widget.category_id && grouped[widget.category_id]) {
        grouped[widget.category_id].push(widget);
      } else {
        grouped['uncategorized'].push(widget);
      }
    });
    
    return grouped;
  }, [paginatedWidgets, categories]);
  
  // Calculate total pages
  const totalPages = Math.ceil(filteredWidgets.length / itemsPerPage);
  
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
                {categories.map((category) => (
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
      
      <ScrollArea className="flex-1 px-4">
        {isLoading ? (
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
            {paginatedWidgets.map((widget) => (
              <DraggableWidgetItem
                key={widget.id}
                widget={widget}
                onSelect={onWidgetSelect}
              />
            ))}
          </div>
        ) : (
          // Category-based layout
          <div className="space-y-8">
            {Object.entries(widgetsByCategory).map(([categoryId, categoryWidgets]) => {
              if (categoryWidgets.length === 0) return null;
              
              const categoryName = categories.find(c => c.id === categoryId)?.name || 'Uncategorized';
              
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
          </div>
        )}
      </ScrollArea>
      
      {totalPages > 1 && (
        <div className="widget-library-footer p-4 border-t flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                />
              </PaginationItem>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    isActive={page === currentPage}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              
              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};

// Replace the old CSS with iOS-style widget grid and fix border-radius issues
const styles = `
  .widget-library {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }
  
  .ios-widget-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 1px;
    padding: 1px 0;
    justify-content: center;
    background-color: transparent;
  }
  
  .widget-container {
    position: relative;
    background-color: transparent;
  }
  
  .widget-card {
    position: relative;
    background-color: transparent !important; 
  }
  
  .widget-renderer {
    background-color: transparent !important;
  }
  
  /* Ensure all content inside widgets honors the border radius */
  .widget-renderer > div {
    border-radius: inherit;
    overflow: hidden;
  }
  
  .ios-drag-overlay {
    transform: scale(1.05);
    opacity: 0.9;
    box-shadow: 0 8px 20px rgba(0,0,0,0.15);
    pointer-events: none;
    background-color: transparent !important;
  }
  
  .ios-select {
    appearance: none;
    background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
    background-repeat: no-repeat;
    background-position: right 8px center;
    background-size: 16px;
    padding-right: 28px;
  }
  
  .search-input-wrapper:focus-within {
    box-shadow: 0 0 0 2px rgba(0, 122, 255, 0.3);
  }
`;

// Add the styles to the document
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);
} 