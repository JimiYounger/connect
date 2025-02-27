// my-app/src/features/widgets/components/admin/widget-palette.tsx

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Widget, 
  WidgetType, 
  WidgetCategory,
  WidgetShape,
  WidgetConfigData
} from '../../types';
import { useWidgets } from '../../hooks/use-widgets';
import { widgetService } from '../../services/widget-service';
import { Search, Filter, Loader2, Grid, LayoutGrid, BarChart3, FileText, Globe, ExternalLink, Box } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { WidgetRenderer } from '../../components/widget-renderer';

interface WidgetPaletteProps {
  userId: string;
  onSelectWidget: (widget: Widget) => void;
  categories?: WidgetCategory[];
  className?: string;
}

/**
 * Widget Palette Component
 * Displays available widgets that can be added to a dashboard
 */
export const WidgetPalette: React.FC<WidgetPaletteProps> = ({
  userId,
  onSelectWidget,
  categories = [],
  className = '',
}) => {
  // State for search and filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTypes, setSelectedTypes] = useState<WidgetType[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<string>('all');
  
  // State for widget configurations
  const [widgetConfigs, setWidgetConfigs] = useState<Record<string, WidgetConfigData>>({});

  // Fetch widgets
  const { widgets, isLoading, error, refetch } = useWidgets({
    userId,
    isPublished: true,
    limit: 100,
  });

  // Fetch widget configurations when widgets load
  useEffect(() => {
    const fetchWidgetConfigurations = async () => {
      if (!widgets.length) return;
      
      const configs: Record<string, WidgetConfigData> = {};
      
      // Fetch configurations for all widgets
      await Promise.all(widgets.map(async (widget) => {
        try {
          const { data, error } = await widgetService.getWidgetConfiguration(widget.id);
          if (!error && data && data.config) {
            configs[widget.id] = data.config as WidgetConfigData;
          }
        } catch (err) {
          console.error(`Error fetching config for widget ${widget.id}:`, err);
        }
      }));
      
      setWidgetConfigs(configs);
    };
    
    fetchWidgetConfigurations();
  }, [widgets]);

  // Group widgets by category - prefixed with _ to indicate intentionally unused
  const _widgetsByCategory = useMemo(() => {
    const grouped = new Map<string, Widget[]>();
    
    // Initialize with empty arrays for all categories
    if (categories.length > 0) {
      categories.forEach(category => {
        grouped.set(category.id, []);
      });
    }
    
    // Add "Uncategorized" category
    grouped.set('uncategorized', []);
    
    // Group widgets
    widgets.forEach(widget => {
      const categoryId = widget.category_id || 'uncategorized';
      if (!grouped.has(categoryId)) {
        grouped.set(categoryId, []);
      }
      grouped.get(categoryId)?.push(widget);
    });
    
    return grouped;
  }, [widgets, categories]);

  // Filter widgets based on search query and filters
  const filteredWidgets = useMemo(() => {
    return widgets.filter(widget => {
      // Filter by search query
      const matchesSearch = searchQuery === '' || 
        widget.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (widget.description && widget.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // Filter by widget type
      const matchesType = selectedTypes.length === 0 || 
        selectedTypes.includes(widget.widget_type as WidgetType);
      
      // Filter by category
      const matchesCategory = selectedCategories.length === 0 || 
        selectedCategories.includes(widget.category_id || 'uncategorized');
      
      return matchesSearch && matchesType && matchesCategory;
    });
  }, [widgets, searchQuery, selectedTypes, selectedCategories]);

  // Get widgets for the active tab
  const activeTabWidgets = useMemo(() => {
    if (activeTab === 'all') {
      return filteredWidgets;
    } else if (activeTab === 'recent') {
      // Sort by created_at date for recent widgets
      return [...filteredWidgets].sort((a, b) => {
        return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
      }).slice(0, 10); // Show only the 10 most recent
    } else {
      // Show widgets for a specific category
      return filteredWidgets.filter(widget => 
        (widget.category_id || 'uncategorized') === activeTab
      );
    }
  }, [activeTab, filteredWidgets]);

  // Toggle widget type filter
  const toggleTypeFilter = (type: WidgetType) => {
    setSelectedTypes(prev => {
      if (prev.includes(type)) {
        return prev.filter(t => t !== type);
      } else {
        return [...prev, type];
      }
    });
  };

  // Toggle category filter
  const toggleCategoryFilter = (categoryId: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTypes([]);
    setSelectedCategories([]);
  };

  // Get category name by ID
  const getCategoryName = (categoryId: string): string => {
    if (categoryId === 'uncategorized') return 'Uncategorized';
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Unknown Category';
  };

  // Get color for widget type (for badge styling)
  const getTypeColor = (type: string): string => {
    switch (type) {
      case WidgetType.DATA_VISUALIZATION:
        return 'bg-blue-100 text-blue-800';
      case WidgetType.INTERACTIVE_TOOL:
        return 'bg-purple-100 text-purple-800';
      case WidgetType.CONTENT:
        return 'bg-green-100 text-green-800';
      case WidgetType.EMBED:
        return 'bg-orange-100 text-orange-800';
      case WidgetType.REDIRECT:
        return 'bg-red-100 text-red-800';
      case WidgetType.CUSTOM:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get the actual color value for the widget type (for background use)
  const getTypeColorValue = (type: string): string => {
    switch (type) {
      case WidgetType.DATA_VISUALIZATION:
        return '#EBF5FF'; // Light blue background
      case WidgetType.INTERACTIVE_TOOL:
        return '#F5F0FF'; // Light purple background
      case WidgetType.CONTENT:
        return '#ECFDF5'; // Light green background
      case WidgetType.EMBED:
        return '#FFF4E5'; // Light orange background
      case WidgetType.REDIRECT:
        return '#FEF2F2'; // Light red background 
      case WidgetType.CUSTOM:
        return '#F9FAFB'; // Light gray background
      default:
        return '#F9FAFB'; // Light gray background
    }
  };

  // Render a preview based on widget type and configuration
  const renderWidgetPreview = (widget: Widget) => {
    // Get widget configuration if available
    const config = widgetConfigs[widget.id];
    
    // Determine the shape
    const shape = widget.shape as WidgetShape || WidgetShape.SQUARE;
    const isCircle = shape === WidgetShape.CIRCLE;
    
    // Get styling from configuration
    const backgroundColor = config?.styles?.backgroundColor || getTypeColorValue(widget.widget_type);
    const borderRadius = config?.styles?.borderRadius || (isCircle ? '50%' : '8px');
    const padding = config?.styles?.padding || '12px';
    
    // Get content styling
    const titleColor = config?.styles?.titleColor || '#000000';
    const textColor = config?.styles?.textColor || '#333333';
    
    // Base styles for all widgets
    const containerStyle: React.CSSProperties = {
      position: 'relative',
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      borderRadius: borderRadius,
      backgroundColor: backgroundColor,
      boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
      transition: 'transform 0.2s, box-shadow 0.2s',
    };
    
    // For thumbnail images
    if (widget.thumbnail_url) {
      return (
        <div style={containerStyle} className="hover:shadow-md hover:scale-[1.02]">
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${widget.thumbnail_url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }} />
        </div>
      );
    }
    
    // For content-based widgets
    return (
      <div style={containerStyle} className="hover:shadow-md hover:scale-[1.02]">
        <div style={{
          position: 'absolute', 
          inset: 0,
          padding: padding,
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Widget title if available */}
          {(config?.title || widget.name) && (
            <div style={{
              fontWeight: 500,
              color: titleColor,
              textAlign: 'center',
              marginBottom: '4px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontSize: '0.85rem',
            }}>
              {config?.title || widget.name}
            </div>
          )}
          
          {/* Content based on widget type */}
          <div style={{flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            {widget.widget_type === WidgetType.REDIRECT && (
              <ExternalLink style={{color: titleColor}} size={24} />
            )}
            
            {widget.widget_type === WidgetType.DATA_VISUALIZATION && (
              <BarChart3 style={{color: titleColor}} size={24} />
            )}
            
            {widget.widget_type === WidgetType.CONTENT && (
              <FileText style={{color: titleColor}} size={24} />
            )}
            
            {widget.widget_type === WidgetType.EMBED && (
              <Globe style={{color: titleColor}} size={24} />
            )}
            
            {widget.widget_type === WidgetType.INTERACTIVE_TOOL && (
              <Box style={{color: titleColor}} size={24} />
            )}
            
            {widget.widget_type === WidgetType.CUSTOM && (
              <Box style={{color: titleColor}} size={24} />
            )}
          </div>
          
          {/* Widget subtitle if available - only show in a simplified form */}
          {config?.subtitle && (
            <div style={{
              fontSize: '0.7rem',
              color: textColor,
              textAlign: 'center',
              marginTop: '4px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {config.subtitle}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render widget card with more realistic preview
  const renderWidgetCard = (widget: Widget) => {
    // Get the size ratio
    const sizeRatio = widget.size_ratio || '1:1';
    const [width, height] = sizeRatio.split(':').map(Number);
    const aspectRatio = (height / width) * 100;
    
    return (
      <div 
        key={widget.id}
        className="cursor-pointer transition-all hover:opacity-95"
        onClick={() => onSelectWidget(widget)}
        title={widget.name}
      >
        <div className="relative mb-1 shadow-sm hover:shadow-md transition-all">
          {/* Use padding-bottom trick to maintain aspect ratio */}
          <div style={{paddingBottom: `${aspectRatio}%`, position: 'relative'}} className="widget-preview-container">
            <div className="absolute inset-0">
              {renderWidgetPreview(widget)}
            </div>
          </div>
        </div>
        
        {/* Only show the widget name, with no additional metadata */}
        <h3 className="text-xs font-medium truncate text-center">{widget.name}</h3>
      </div>
    );
  };

  // Render widget list item with more realistic preview 
  const renderWidgetListItem = (widget: Widget) => {
    // Get the size ratio
    const sizeRatio = widget.size_ratio || '1:1';
    const [width, height] = sizeRatio.split(':').map(Number);
    
    return (
      <div 
        key={widget.id}
        className="flex items-center px-2 py-2 cursor-pointer hover:bg-gray-50 border-b"
        onClick={() => onSelectWidget(widget)}
      >
        <div className="w-12 h-12 flex-shrink-0 overflow-hidden mr-2 relative">
          {renderWidgetPreview(widget)}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium truncate">{widget.name}</h3>
          <Badge className={`${getTypeColor(widget.widget_type)} text-xs`}>
            {widget.widget_type.split('_')[0]}
          </Badge>
        </div>
      </div>
    );
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Search and filters */}
      <div className="p-4 border-b">
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search widgets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="p-2 font-medium">Widget Types</div>
              {Object.values(WidgetType).map((type) => (
                <DropdownMenuCheckboxItem
                  key={type}
                  checked={selectedTypes.includes(type)}
                  onCheckedChange={() => toggleTypeFilter(type)}
                >
                  {type}
                </DropdownMenuCheckboxItem>
              ))}
              
              <div className="p-2 font-medium border-t mt-2">Categories</div>
              {categories.map((category) => (
                <DropdownMenuCheckboxItem
                  key={category.id}
                  checked={selectedCategories.includes(category.id)}
                  onCheckedChange={() => toggleCategoryFilter(category.id)}
                >
                  {category.name}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuCheckboxItem
                checked={selectedCategories.includes('uncategorized')}
                onCheckedChange={() => toggleCategoryFilter('uncategorized')}
              >
                Uncategorized
              </DropdownMenuCheckboxItem>
              
              <div className="p-2 border-t">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full"
                  onClick={clearFilters}
                >
                  Clear Filters
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            {viewMode === 'grid' ? (
              <LayoutGrid className="h-4 w-4" />
            ) : (
              <Grid className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        <div className="flex justify-between items-center">
          <Tabs 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="w-full">
              <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
              <TabsTrigger value="recent" className="flex-1">Recent</TabsTrigger>
              {categories.slice(0, 3).map((category) => (
                <TabsTrigger 
                  key={category.id} 
                  value={category.id}
                  className="flex-1"
                >
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>
      
      {/* Widget list */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : error ? (
          <div className="p-4 text-center text-red-500">
            Error loading widgets. Please try again.
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetch()}
              className="mt-2"
            >
              Retry
            </Button>
          </div>
        ) : activeTabWidgets.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No widgets found. Try adjusting your filters.
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 p-3" 
            : "divide-y"
          }>
            {activeTabWidgets.map((widget) => (
              viewMode === 'grid' 
                ? renderWidgetCard(widget) 
                : renderWidgetListItem(widget)
            ))}
          </div>
        )}
      </ScrollArea>
      
      {/* Status bar */}
      <div className="px-2 py-1 border-t text-xs text-gray-500">
        {filteredWidgets.length} widgets
        {selectedTypes.length > 0 && ` • ${selectedTypes.length} types filtered`}
        {selectedCategories.length > 0 && ` • ${selectedCategories.length} categories filtered`}
      </div>
    </div>
  );
};

export default WidgetPalette; 