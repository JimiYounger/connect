// my-app/src/features/widgets/components/admin/dashboard-editor.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { useRouter } from 'next/navigation';
import { 
  Widget, 
  WidgetType,
  DraftWidgetPlacement,
  WidgetPlacement as _WidgetPlacement
} from '../../types';
import { widgetService } from '../../services/widget-service';
import { widgetRegistry } from '../../registry';
import { useWidgets } from '../../hooks/use-widgets';
import { Button } from '@/components/ui/button';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Plus, Save, Send, Trash2, Settings } from 'lucide-react';
import { useAuth } from '@/features/auth/context/auth-context';
import { dashboardService } from '../../services/dashboard-service';

// Responsive grid layout with width provider
const ResponsiveGridLayout = WidthProvider(Responsive);

// Breakpoints for responsive layouts
const BREAKPOINTS = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };
const COLS = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 };

interface DashboardEditorProps {
  dashboardId: string;
  initialLayout?: DraftWidgetPlacement[];
  onSave?: (layout: DraftWidgetPlacement[]) => void;
  onPublish?: (layout: DraftWidgetPlacement[]) => void;
}

/**
 * Dashboard Editor Component
 * Allows for drag/drop arrangement of widgets on a grid
 */
export const DashboardEditor: React.FC<DashboardEditorProps> = ({
  dashboardId,
  initialLayout = [],
  onSave,
  onPublish
}) => {
  const _router = useRouter();
  // Replace placeholder session with actual auth
  const { profile } = useAuth();
  const userId = profile?.id || '';
  
  // Add authentication check
  const [authError, setAuthError] = useState<boolean>(false);
  
  // State for layouts
  const [layouts, setLayouts] = useState<{ [key: string]: any[] }>({});
  const [currentBreakpoint, setCurrentBreakpoint] = useState<string>('lg');
  const [placedWidgets, setPlacedWidgets] = useState<Map<string, Widget>>(new Map());
  
  // State for editor modes
  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(false);
  const [_isEditing, _setIsEditing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [showWidgetPalette, setShowWidgetPalette] = useState<boolean>(false);
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
  const [draftId, setDraftId] = useState<string>('');
  
  // Fetch available widgets for the palette
  const { widgets: availableWidgets, isLoading: isLoadingWidgets } = useWidgets({
    userId,
    isPublished: true,
    limit: 50
  });
  
  // Filter widgets by type for the palette
  const [widgetTypeFilter, _setWidgetTypeFilter] = useState<WidgetType | 'all'>('all');
  
  const filteredWidgets = useMemo(() => {
    if (widgetTypeFilter === 'all') return availableWidgets;
    return availableWidgets.filter(widget => widget.widget_type === widgetTypeFilter);
  }, [availableWidgets, widgetTypeFilter]);
  
  // Initialize layouts from initial data
  useEffect(() => {
    if (initialLayout.length > 0) {
      const widgetMap = new Map<string, Widget>();
      const layoutItems = initialLayout.map(placement => {
        // Fix the widget property access - use type assertion or optional chaining
        const widget = (placement as any).widget as Widget;
        if (widget) {
          widgetMap.set(placement.widget_id, widget);
        }
        
        return {
          i: placement.widget_id,
          x: placement.position_x || 0,
          y: placement.position_y || 0,
          w: placement.width || 3,
          h: placement.height || 2,
          minW: 2,
          minH: 1
        };
      });
      
      setPlacedWidgets(widgetMap);
      setLayouts({ lg: layoutItems });
      setDraftId(initialLayout[0]?.draft_id || '');
    }
  }, [initialLayout]);
  
  // Load draft layout from the server
  const loadDraftLayout = useCallback(async () => {
    if (!dashboardId) return;
    
    try {
      const { data, error } = await widgetService.getWidgetPlacementsForDashboard(
        dashboardId,
        true // isDraft
      );
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        const widgetMap = new Map<string, Widget>();
        const layoutItems = data.map(placement => {
          const widget = (placement as any).widget as Widget;
          if (widget) {
            widgetMap.set(placement.widget_id, widget);
          }
          
          return {
            i: placement.widget_id,
            x: placement.position_x || 0,
            y: placement.position_y || 0,
            w: placement.width || 3,
            h: placement.height || 2,
            minW: 2,
            minH: 1
          };
        });
        
        setPlacedWidgets(widgetMap);
        setLayouts({ lg: layoutItems });
        setDraftId((data[0] as DraftWidgetPlacement).draft_id || '');
      }
    } catch (error) {
      console.error('Error loading draft layout:', error);
    }
  }, [dashboardId]);
  
  // Load layout on component mount if no initial layout provided
  useEffect(() => {
    if (initialLayout.length === 0 && dashboardId) {
      loadDraftLayout();
    }
  }, [dashboardId, initialLayout, loadDraftLayout]);
  
  // Handle layout change
  const handleLayoutChange = (currentLayout: any[], allLayouts: { [key: string]: any[] }) => {
    setLayouts(allLayouts);
  };
  
  // Handle breakpoint change
  const handleBreakpointChange = (newBreakpoint: string) => {
    setCurrentBreakpoint(newBreakpoint);
  };
  
  // Add a widget to the layout
  const addWidget = (widget: Widget) => {
    const currentLayout = layouts[currentBreakpoint] || [];
    const newWidgetId = widget.id;
    
    // Check if widget is already in the layout
    if (currentLayout.some(item => item.i === newWidgetId)) {
      return;
    }
    
    // Add widget to the layout
    const newLayoutItem = {
      i: newWidgetId,
      x: 0,
      y: 0, // Will be placed at the top
      w: 3,
      h: 2,
      minW: 2,
      minH: 1
    };
    
    // Update layouts
    const updatedLayout = [...currentLayout, newLayoutItem];
    setLayouts({
      ...layouts,
      [currentBreakpoint]: updatedLayout
    });
    
    // Update placed widgets map
    setPlacedWidgets(new Map(placedWidgets.set(newWidgetId, widget)));
    
    // Close the widget palette
    setShowWidgetPalette(false);
  };
  
  // Remove a widget from the layout
  const removeWidget = (widgetId: string) => {
    const currentLayout = layouts[currentBreakpoint] || [];
    const updatedLayout = currentLayout.filter(item => item.i !== widgetId);
    
    // Update layouts
    setLayouts({
      ...layouts,
      [currentBreakpoint]: updatedLayout
    });
    
    // Update placed widgets map
    const updatedWidgets = new Map(placedWidgets);
    updatedWidgets.delete(widgetId);
    setPlacedWidgets(updatedWidgets);
    
    // Clear selected widget if it was removed
    if (selectedWidgetId === widgetId) {
      setSelectedWidgetId(null);
    }
  };
  
  // Convert layout to widget placements
  const layoutToWidgetPlacements = (): DraftWidgetPlacement[] => {
    const currentLayout = layouts[currentBreakpoint] || [];
    
    return currentLayout.map(item => ({
      id: `draft_${item.i}_${Date.now()}`,
      draft_id: draftId || `draft_${dashboardId}_${Date.now()}`,
      widget_id: item.i,
      position_x: item.x,
      position_y: item.y,
      width: item.w,
      height: item.h,
      layout_type: currentBreakpoint,
      created_at: new Date().toISOString()
    }));
  };
  
  // Save the current layout as a draft
  const saveDraft = async () => {
    if (!dashboardId) {
      alert('No dashboard ID provided');
      return;
    }
    
    if (!userId) {
      alert('Authentication required');
      return;
    }

    setIsSaving(true);
    
    try {
      const widgetPlacements = layoutToWidgetPlacements();
      
      // If no draftId yet, create one
      if (!draftId) {
        const newDraftId = `draft_${dashboardId}_${Date.now()}`;
        setDraftId(newDraftId);
        widgetPlacements.forEach(placement => {
          placement.draft_id = newDraftId;
        });
      }
      
      // Call dashboard service to save draft
      const { data: _data, error } = await dashboardService.replaceDraftWidgetPlacements(
        draftId || `draft_${dashboardId}_${Date.now()}`, 
        widgetPlacements.map(p => ({
          draft_id: p.draft_id,
          widget_id: p.widget_id,
          position_x: p.position_x,
          position_y: p.position_y,
          width: p.width,
          height: p.height,
          layout_type: p.layout_type,
          created_by: userId
        }))
      );
      
      if (error) throw error;
      
      // Call onSave callback if provided
      if (onSave) {
        onSave(widgetPlacements);
      }
      
      // Show success message
      alert('Draft saved successfully!');
    } catch (error) {
      console.error('Error saving draft:', error);
      alert(`Error saving draft: ${(error as Error).message}`);
    } finally {
      setIsSaving(false);
    }
  };
  
  // Publish the current layout
  const publishLayout = async () => {
    if (!dashboardId) return;
    
    setIsPublishing(true);
    
    try {
      const widgetPlacements = layoutToWidgetPlacements();
      
      // Call API to publish layout
      // This is a placeholder - implement the actual API call
      // await widgetService.publishDashboard(dashboardId, widgetPlacements);
      
      // Call onPublish callback if provided
      if (onPublish) {
        onPublish(widgetPlacements);
      }
      
      // Show success message
      alert('Dashboard published successfully!');
    } catch (error) {
      console.error('Error publishing layout:', error);
      alert('Error publishing layout. Please try again.');
    } finally {
      setIsPublishing(false);
    }
  };
  
  // Render widget component
  const renderWidget = (widgetId: string) => {
    const widget = placedWidgets.get(widgetId);
    
    if (!widget) {
      return (
        <div className="bg-red-100 p-4 rounded-md">
          <p className="text-red-500">Widget not found</p>
        </div>
      );
    }
    
    // Get the component from the registry
    const WidgetComponent = widgetRegistry.getComponent(widget.widget_type);
    
    // In preview mode, render the actual widget
    if (isPreviewMode) {
      return (
        <div className="w-full h-full overflow-hidden">
          <WidgetComponent
            id={widget.id}
            widget={widget}
            width={100}
            height={100}
          />
        </div>
      );
    }
    
    // In edit mode, render a placeholder with controls
    return (
      <div 
        className={`
          w-full h-full p-2 border-2 rounded-md overflow-hidden
          ${selectedWidgetId === widgetId ? 'border-blue-500' : 'border-gray-200'}
          bg-white
        `}
        onClick={() => setSelectedWidgetId(widgetId)}
      >
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-medium truncate">{widget.name}</h3>
          <div className="flex space-x-1">
            <button 
              className="p-1 text-gray-500 hover:text-gray-700"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedWidgetId(widgetId);
              }}
            >
              <Settings size={14} />
            </button>
            <button 
              className="p-1 text-red-500 hover:text-red-700"
              onClick={(e) => {
                e.stopPropagation();
                removeWidget(widgetId);
              }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
        <div className="text-xs text-gray-500 mb-1">Type: {widget.widget_type}</div>
        <div className="bg-gray-100 rounded p-2 text-xs overflow-hidden h-[calc(100%-4rem)]">
          {widget.description || 'No description'}
        </div>
      </div>
    );
  };
  
  // Check for authentication
  useEffect(() => {
    if (!profile && !isLoadingWidgets) {
      setAuthError(true);
    } else {
      setAuthError(false);
    }
  }, [profile, isLoadingWidgets]);
  
  // Add this to handle the case where there's no data yet
  useEffect(() => {
    // Display a message to the user when the component first loads
    if (isLoadingWidgets) {
      console.log('Loading widgets...');
    } else if (initialLayout.length === 0 && dashboardId) {
      console.log(`No initial layout provided for dashboard ${dashboardId}, attempting to load draft`);
      loadDraftLayout();
    }
  }, [isLoadingWidgets, initialLayout, dashboardId, loadDraftLayout]);
  
  // Return auth error if no user
  if (authError) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 bg-gray-50">
        <div className="text-center bg-white p-6 rounded-lg shadow-md max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-4">Authentication Required</h2>
          <p className="mb-4">You need to be logged in to access the dashboard editor.</p>
          <Button 
            onClick={() => _router.push('/auth/login')}
            variant="default"
          >
            Log In
          </Button>
        </div>
      </div>
    );
  }
  
  // Add a loading state indicator to the component
  const renderLoadingState = () => (
    <div className="flex flex-col items-center justify-center h-64 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 p-8">
      <Loader2 className="h-8 w-8 animate-spin text-gray-400 mb-4" />
      <p className="text-gray-500">Loading dashboard...</p>
    </div>
  );
  
  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex justify-between items-center p-4 bg-white border-b">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-bold">Dashboard Editor</h2>
          <div className="flex items-center space-x-2">
            <Switch
              checked={isPreviewMode}
              onCheckedChange={setIsPreviewMode}
              id="preview-mode"
            />
            <Label htmlFor="preview-mode">Preview Mode</Label>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setShowWidgetPalette(true)}
            disabled={isPreviewMode}
          >
            <Plus className="mr-2 h-4 w-4" /> Add Widget
          </Button>
          
          <Button
            variant="outline"
            onClick={saveDraft}
            disabled={isSaving || isPreviewMode}
          >
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Draft
          </Button>
          
          <Button
            variant="default"
            onClick={publishLayout}
            disabled={isPublishing}
          >
            {isPublishing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Publish
          </Button>
        </div>
      </div>
      
      {/* Main editor area */}
      <div className="flex-1 overflow-auto p-4 bg-gray-50">
        {isLoadingWidgets ? (
          renderLoadingState()
        ) : (
          <>
            <ResponsiveGridLayout
              className="layout"
              layouts={layouts}
              breakpoints={BREAKPOINTS}
              cols={COLS}
              rowHeight={100}
              onLayoutChange={handleLayoutChange}
              onBreakpointChange={handleBreakpointChange}
              isDraggable={!isPreviewMode}
              isResizable={!isPreviewMode}
              compactType="vertical"
              margin={[16, 16]}
            >
              {layouts[currentBreakpoint]?.map(item => (
                <div key={item.i} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  {renderWidget(item.i)}
                </div>
              ))}
            </ResponsiveGridLayout>
            
            {/* Empty state */}
            {(!layouts[currentBreakpoint] || layouts[currentBreakpoint].length === 0) && (
              <div className="flex flex-col items-center justify-center h-64 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 p-8">
                <p className="text-gray-500 mb-4">No widgets added to this dashboard yet.</p>
                <Button
                  variant="outline"
                  onClick={() => setShowWidgetPalette(true)}
                  disabled={isPreviewMode}
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Widget
                </Button>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Widget palette dialog */}
      <Dialog open={showWidgetPalette} onOpenChange={setShowWidgetPalette}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add Widget</DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="all">
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value={WidgetType.DATA_VISUALIZATION}>Data</TabsTrigger>
                <TabsTrigger value={WidgetType.CONTENT}>Content</TabsTrigger>
                <TabsTrigger value={WidgetType.INTERACTIVE_TOOL}>Interactive</TabsTrigger>
                <TabsTrigger value={WidgetType.EMBED}>Embed</TabsTrigger>
              </TabsList>
              
              <Input 
                placeholder="Search widgets..." 
                className="w-[200px]" 
              />
            </div>
            
            <TabsContent value="all" className="mt-0">
              <div className="grid grid-cols-2 gap-4 max-h-[400px] overflow-y-auto p-2">
                {isLoadingWidgets ? (
                  <div className="col-span-2 flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  </div>
                ) : filteredWidgets.length === 0 ? (
                  <div className="col-span-2 text-center py-8 text-gray-500">
                    No widgets found
                  </div>
                ) : (
                  filteredWidgets.map(widget => (
                    <div 
                      key={widget.id}
                      className="border rounded-md p-3 cursor-pointer hover:bg-gray-50"
                      onClick={() => addWidget(widget)}
                    >
                      <h3 className="font-medium">{widget.name}</h3>
                      <p className="text-xs text-gray-500 mb-2">Type: {widget.widget_type}</p>
                      <p className="text-sm text-gray-700 line-clamp-2">
                        {widget.description || 'No description'}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
            
            {Object.values(WidgetType).map(type => (
              <TabsContent key={type} value={type} className="mt-0">
                <div className="grid grid-cols-2 gap-4 max-h-[400px] overflow-y-auto p-2">
                  {isLoadingWidgets ? (
                    <div className="col-span-2 flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                  ) : availableWidgets.filter(w => w.widget_type === type).length === 0 ? (
                    <div className="col-span-2 text-center py-8 text-gray-500">
                      No {type} widgets found
                    </div>
                  ) : (
                    availableWidgets
                      .filter(w => w.widget_type === type)
                      .map(widget => (
                        <div 
                          key={widget.id}
                          className="border rounded-md p-3 cursor-pointer hover:bg-gray-50"
                          onClick={() => addWidget(widget)}
                        >
                          <h3 className="font-medium">{widget.name}</h3>
                          <p className="text-xs text-gray-500 mb-2">Type: {widget.widget_type}</p>
                          <p className="text-sm text-gray-700 line-clamp-2">
                            {widget.description || 'No description'}
                          </p>
                        </div>
                      ))
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Widget settings dialog */}
      {selectedWidgetId && (
        <Dialog 
          open={!!selectedWidgetId} 
          onOpenChange={(open) => !open && setSelectedWidgetId(null)}
        >
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Widget Settings</DialogTitle>
            </DialogHeader>
            
            <div className="py-4">
              <h3 className="font-medium mb-2">
                {placedWidgets.get(selectedWidgetId)?.name || 'Widget'}
              </h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="widget-width">Width</Label>
                    <Input 
                      id="widget-width" 
                      type="number" 
                      min="1"
                      max="12"
                      value={layouts[currentBreakpoint]?.find(item => item.i === selectedWidgetId)?.w || 3}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        if (isNaN(value)) return;
                        
                        const currentLayout = layouts[currentBreakpoint] || [];
                        const updatedLayout = currentLayout.map(item => {
                          if (item.i === selectedWidgetId) {
                            return { ...item, w: value };
                          }
                          return item;
                        });
                        
                        setLayouts({
                          ...layouts,
                          [currentBreakpoint]: updatedLayout
                        });
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="widget-height">Height</Label>
                    <Input 
                      id="widget-height" 
                      type="number"
                      min="1"
                      value={layouts[currentBreakpoint]?.find(item => item.i === selectedWidgetId)?.h || 2}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        if (isNaN(value)) return;
                        
                        const currentLayout = layouts[currentBreakpoint] || [];
                        const updatedLayout = currentLayout.map(item => {
                          if (item.i === selectedWidgetId) {
                            return { ...item, h: value };
                          }
                          return item;
                        });
                        
                        setLayouts({
                          ...layouts,
                          [currentBreakpoint]: updatedLayout
                        });
                      }}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="widget-position">Position</Label>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <Label htmlFor="widget-x" className="text-xs">X Position</Label>
                      <Input 
                        id="widget-x" 
                        type="number"
                        min="0"
                        max={COLS[currentBreakpoint as keyof typeof COLS] - 1}
                        value={layouts[currentBreakpoint]?.find(item => item.i === selectedWidgetId)?.x || 0}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          if (isNaN(value)) return;
                          
                          const currentLayout = layouts[currentBreakpoint] || [];
                          const updatedLayout = currentLayout.map(item => {
                            if (item.i === selectedWidgetId) {
                              return { ...item, x: value };
                            }
                            return item;
                          });
                          
                          setLayouts({
                            ...layouts,
                            [currentBreakpoint]: updatedLayout
                          });
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor="widget-y" className="text-xs">Y Position</Label>
                      <Input 
                        id="widget-y" 
                        type="number"
                        min="0"
                        value={layouts[currentBreakpoint]?.find(item => item.i === selectedWidgetId)?.y || 0}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          if (isNaN(value)) return;
                          
                          const currentLayout = layouts[currentBreakpoint] || [];
                          const updatedLayout = currentLayout.map(item => {
                            if (item.i === selectedWidgetId) {
                              return { ...item, y: value };
                            }
                            return item;
                          });
                          
                          setLayouts({
                            ...layouts,
                            [currentBreakpoint]: updatedLayout
                          });
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <DialogFooter className="flex justify-between">
              <Button 
                variant="destructive" 
                onClick={() => {
                  removeWidget(selectedWidgetId);
                  setSelectedWidgetId(null);
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Remove Widget
              </Button>
              <DialogClose asChild>
                <Button>Done</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default DashboardEditor; 