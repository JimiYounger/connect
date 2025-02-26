// my-app/src/features/widgets/components/admin/widget-palette.tsx

import React, { useState, useMemo } from 'react';
import { 
  Widget, 
  WidgetType, 
  WidgetCategory 
} from '../../types';
import { useWidgets } from '../../hooks/use-widgets';
import { Search, Filter, Loader2, Grid, LayoutGrid } from 'lucide-react';
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
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

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

  // Fetch widgets
  const { widgets, isLoading, error, refetch } = useWidgets({
    userId,
    isPublished: true,
    limit: 100,
  });

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

  // Get color for widget type
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

  // Render widget card
  const renderWidgetCard = (widget: Widget) => {
    return (
      <Card 
        key={widget.id}
        className="cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => onSelectWidget(widget)}
      >
        <CardHeader className="p-4 pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-sm font-medium truncate">{widget.name}</CardTitle>
            <Badge className={`${getTypeColor(widget.widget_type)} text-xs`}>
              {widget.widget_type}
            </Badge>
          </div>
          <CardDescription className="text-xs line-clamp-2">
            {widget.description || 'No description'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="w-full h-24 bg-gray-100 rounded-md flex items-center justify-center">
            {/* Widget thumbnail or preview would go here */}
            <div className="text-gray-400 text-xs">Widget Preview</div>
          </div>
        </CardContent>
        <CardFooter className="p-2 text-xs text-gray-500 border-t">
          {getCategoryName(widget.category_id || 'uncategorized')}
        </CardFooter>
      </Card>
    );
  };

  // Render widget list item
  const renderWidgetListItem = (widget: Widget) => {
    return (
      <div 
        key={widget.id}
        className="flex items-center p-3 border-b cursor-pointer hover:bg-gray-50"
        onClick={() => onSelectWidget(widget)}
      >
        <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center mr-3">
          {/* Widget icon would go here */}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium truncate">{widget.name}</h3>
            <Badge className={`${getTypeColor(widget.widget_type)} text-xs ml-2`}>
              {widget.widget_type}
            </Badge>
          </div>
          <p className="text-xs text-gray-500 truncate">
            {widget.description || 'No description'}
          </p>
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
            ? "grid grid-cols-2 gap-4 p-4" 
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
      <div className="p-2 border-t text-xs text-gray-500">
        {filteredWidgets.length} widgets • 
        {selectedTypes.length > 0 && ` ${selectedTypes.length} types filtered •`}
        {selectedCategories.length > 0 && ` ${selectedCategories.length} categories filtered •`}
        {searchQuery && ` Search: "${searchQuery}" •`}
      </div>
    </div>
  );
};

export default WidgetPalette; 