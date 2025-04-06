// my-app/src/app/(auth)/admin/navigation/[id]/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, ChevronRight, ChevronDown, GripVertical } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useNavigation } from '@/features/navigation/hooks/useNavigation'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { NavigationItemForm } from '@/features/navigation/components/admin/NavigationItemForm'
import { deleteRolesByItemId, } from '@/features/navigation/services/navigation-service'
import type { NavigationItemWithChildren, RoleType } from '@/features/navigation/types'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Users, MapPin, Globe, Eye, Info, FolderTree } from 'lucide-react'

// Component for showing navigation item visibility
const NavigationItemVisibility = ({ item }: { item: NavigationItemWithChildren }) => {
  // Check if item is a folder (has children but no URL)
  const isFolder = item.children && item.children.length > 0 && (!item.url || item.url === '#' || item.url === 'javascript:void(0)');
  
  // If it's a folder, show the folder indicator
  if (isFolder) {
    return (
      <div className="flex gap-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="secondary" className="flex items-center gap-1 bg-indigo-600/20 text-indigo-400 border border-indigo-600/30 hover:bg-indigo-600/30">
                <FolderTree className="h-3 w-3" />
                <span>Folder</span>
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <div className="text-sm">This is a folder for organizing child links</div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        {/* Show visibility badge alongside folder badge */}
        {renderVisibilityBadge()}
      </div>
    );
  }
  
  // For non-folders, just show the regular visibility badge
  return renderVisibilityBadge();
  
  // Helper function to render visibility badges
  function renderVisibilityBadge() {
  // If item is public, show a simple indicator
  if (item.is_public) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="secondary" className="flex items-center gap-1 bg-green-600/20 text-green-400 border border-green-600/30 hover:bg-green-600/30">
              <Eye className="h-3 w-3" />
              <span>Public</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="text-sm">Visible to all users</div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  // If not active, show inactive indicator
  if (!item.is_active) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="secondary" className="flex items-center gap-1 bg-red-600/20 text-red-400 border border-red-600/30 hover:bg-red-600/30">
              <Info className="h-3 w-3" />
              <span>Inactive</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="text-sm">This item is currently inactive and not visible to any users</div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  // Extract unique values from roles
  const roleTypes = new Set<string>();
  const teams = new Set<string>();
  const areas = new Set<string>();
  const regions = new Set<string>();
  
  // Process role details
  item.roles?.forEach(role => {
    if (role.role_type && role.role_type !== 'Any') {
      roleTypes.add(role.role_type);
    }
    if (role.team) teams.add(role.team);
    if (role.area) areas.add(role.area);
    if (role.region) regions.add(role.region);
  });
  
  // If no specific assignments and not public, show restricted indicator
  if (roleTypes.size === 0 && teams.size === 0 && areas.size === 0 && regions.size === 0) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="secondary" className="flex items-center gap-1 bg-yellow-600/20 text-yellow-400 border border-yellow-600/30 hover:bg-yellow-600/30">
              <Info className="h-3 w-3" />
              <span>Limited Access</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="text-sm">Visibility is limited but no specific roles are assigned</div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
    return (
      <div className="flex gap-1 flex-wrap">
        {roleTypes.size > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="secondary" className="flex items-center gap-1 bg-blue-600/20 text-blue-400 border border-blue-600/30 hover:bg-blue-600/30">
                  <Users className="h-3 w-3" />
                  <span>{roleTypes.size}</span>
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="top" className="p-0 overflow-hidden">
                <div className="bg-zinc-950 text-white p-3 rounded-md max-w-xs">
                  <div className="font-medium mb-2">Visible to roles:</div>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(roleTypes).map(role => (
                      <Badge key={`role-${role}`} variant="outline" className="border-white/30 text-white">
                        {role}
                      </Badge>
                    ))}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        
        {teams.size > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="secondary" className="flex items-center gap-1 bg-purple-600/20 text-purple-400 border border-purple-600/30 hover:bg-purple-600/30">
                  <Users className="h-3 w-3" />
                  <span>{teams.size}</span>
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="top" className="p-0 overflow-hidden">
                <div className="bg-zinc-950 text-white p-3 rounded-md max-w-xs">
                  <div className="font-medium mb-2">Visible to teams:</div>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(teams).map(team => (
                      <Badge key={`team-${team}`} variant="outline" className="border-white/30 text-white">
                        {team}
                      </Badge>
                    ))}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        
        {areas.size > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="secondary" className="flex items-center gap-1 bg-amber-600/20 text-amber-400 border border-amber-600/30 hover:bg-amber-600/30">
                  <MapPin className="h-3 w-3" />
                  <span>{areas.size}</span>
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="top" className="p-0 overflow-hidden">
                <div className="bg-zinc-950 text-white p-3 rounded-md max-w-xs">
                  <div className="font-medium mb-2">Visible to areas:</div>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(areas).map(area => (
                      <Badge key={`area-${area}`} variant="outline" className="border-white/30 text-white">
                        {area}
                      </Badge>
                    ))}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        
        {regions.size > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="secondary" className="flex items-center gap-1 bg-teal-600/20 text-teal-400 border border-teal-600/30 hover:bg-teal-600/30">
                  <Globe className="h-3 w-3" />
                  <span>{regions.size}</span>
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="top" className="p-0 overflow-hidden">
                <div className="bg-zinc-950 text-white p-3 rounded-md max-w-xs">
                  <div className="font-medium mb-2">Visible to regions:</div>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(regions).map(region => (
                      <Badge key={`region-${region}`} variant="outline" className="border-white/30 text-white">
                        {region}
                      </Badge>
                    ))}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    );
  }
};

// Helper function to transform NavigationItemWithChildren to the form expected format
const transformNavigationItemForForm = (item: NavigationItemWithChildren | null | undefined) => {
  if (!item) return undefined;
  
  // Extract role assignments from the roles array
  const roleAssignments = {
    roleTypes: [] as RoleType[],
    teams: [] as string[],
    areas: [] as string[],
    regions: [] as string[]
  };
  
  item.roles?.forEach(role => {
    if (role.role_type !== 'Any' && !roleAssignments.roleTypes.includes(role.role_type as RoleType)) {
      roleAssignments.roleTypes.push(role.role_type as RoleType);
    }
    
    if (role.team && !roleAssignments.teams.includes(role.team)) {
      roleAssignments.teams.push(role.team);
    }
    
    if (role.area && !roleAssignments.areas.includes(role.area)) {
      roleAssignments.areas.push(role.area);
    }
    
    if (role.region && !roleAssignments.regions.includes(role.region)) {
      roleAssignments.regions.push(role.region);
    }
  });
  
  // Transform dates from string to Date if they exist
  const startDate = item.start_date ? new Date(item.start_date) : null;
  const endDate = item.end_date ? new Date(item.end_date) : null;
  
  // Determine if this is a folder item
  const isFolder = item.children && item.children.length > 0 && (!item.url || item.url === '#' || item.url === 'javascript:void(0)');
  
  return {
    title: item.title,
    url: isFolder ? '' : (item.url || ''),
    description: item.description || '',
    parent_id: item.parent_id || 'none',
    is_folder: isFolder,
    is_public: item.is_public === null ? true : item.is_public,
    is_active: item.is_active === null ? true : item.is_active,
    is_external: item.is_external === null ? true : item.is_external,
    start_date: startDate,
    end_date: endDate,
    order_index: item.order_index,
    roleAssignments
  };
};


interface SortableItemProps {
  item: NavigationItemWithChildren;
  onEdit: () => void;
  onView: () => void;
  onDelete: () => void;
  expanded: boolean;
  toggleExpand: () => void;
  hasChildren: boolean;
}

// Custom SortableItem component
const SortableItem = ({ 
  item, 
  onEdit, 
  onView, 
  onDelete, 
  expanded, 
  toggleExpand, 
  hasChildren 
}: SortableItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: item.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.8 : 1,
  };
  
  return (
    <div 
      ref={setNodeRef}
      style={style}
      className="flex flex-col bg-zinc-900 text-white rounded-[14px]"
    >
      <div className="flex items-center justify-between p-6 hover:bg-zinc-800 transition-colors">
        <div className="flex items-center gap-3">
          <div 
            className="touch-none cursor-grab active:cursor-grabbing text-zinc-500 hover:text-white"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-5 w-5" />
          </div>
          <div 
            className="font-medium text-lg flex items-center gap-2 cursor-pointer"
            onClick={toggleExpand}
          >
            {hasChildren && (
              <span className="text-zinc-400">
                {expanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </span>
            )}
            {item.title}
          </div>
          <div className="ml-2">
            <NavigationItemVisibility item={item} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-white"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </Button>
          <div 
            className="h-8 w-8 bg-white rounded-full flex items-center justify-center cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onView();
            }}
          >
            <ChevronRight className="h-5 w-5 text-black" />
          </div>
        </div>
      </div>
      {expanded && hasChildren && (
        <div className="pl-10 pr-6 pb-4 space-y-3">
          {item.children?.map((child) => (
            <ChildItem 
              key={child.id} 
              item={child} 
              onEdit={() => onEdit()} 
              onDelete={() => onDelete()} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Component for child navigation items
const ChildItem = ({ 
  item, 
  onEdit, 
  onDelete 
}: { 
  item: NavigationItemWithChildren; 
  onEdit: () => void; 
  onDelete: () => void; 
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: item.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.8 : 1,
  };
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div 
          className="touch-none cursor-grab active:cursor-grabbing text-zinc-500 hover:text-white"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </div>
        <div className="font-medium">
          {item.title}
        </div>
        <div className="ml-2">
          <NavigationItemVisibility item={item} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6 text-white"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
        </Button>
      </div>
    </div>
  );
};

export default function EditNavigationMenuPage() {
  const params = useParams()
  const { toast } = useToast()
  const menuId = params.id as string

  const {
    useNavigationMenu,
    useNavigationItems,
    updateItem: updateNavigationItem,
    createItem: createNavigationItem,
    deleteItem: deleteNavigationItem,
    assignRole,
  } = useNavigation()

  const { data: menu, isLoading: isLoadingMenu } = useNavigationMenu(menuId)
  const { 
    data: serverItems = [], 
    isLoading: isLoadingItems,
    refetch
  } = useNavigationItems(menuId)
  
  // Local state for items
  const [items, setItems] = useState<NavigationItemWithChildren[]>([]);
  
  // Keep items in sync with server data
  useEffect(() => {
    if (serverItems?.length > 0) {
      setItems(serverItems);
    }
  }, [serverItems]);

  // State for expanded items
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  
  // Toggle item expansion
  const toggleItemExpand = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId) 
        : [...prev, itemId]
    );
  };

  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  const [isAddingItem, setIsAddingItem] = useState(false)

  // DnD setup
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Helper function to find an item in the nested structure
  const findItemById = (items: NavigationItemWithChildren[], id: string): { item: NavigationItemWithChildren | null, parentItems: NavigationItemWithChildren[] | null, parentId: string | null } => {
    // Check top level
    for (const item of items) {
      if (item.id === id) {
        return { item, parentItems: items, parentId: null };
      }
      
      // Check children
      if (item.children && item.children.length > 0) {
        for (const child of item.children) {
          if (child.id === id) {
            return { item: child, parentItems: item.children, parentId: item.id };
          }
        }
      }
    }
    
    return { item: null, parentItems: null, parentId: null };
  };
  
  // Deep clone function for nested items
  const deepCloneItems = (items: NavigationItemWithChildren[]): NavigationItemWithChildren[] => {
    return JSON.parse(JSON.stringify(items));
  };
  
  // Handle DnD reordering with optimistic update
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;
    
    // Find the items being dragged and dropped on
    const { item: activeItem, parentItems: activeParentItems, parentId: activeParentId } = findItemById(items, active.id as string);
    const { item: overItem, parentItems: overParentItems, parentId: overParentId } = findItemById(items, over.id as string);
    
    if (!activeItem || !overItem || !activeParentItems || !overParentItems) return;
    
    try {
      // Make a deep copy of the current items
      const newItems = deepCloneItems(items);
      
      // If items are in the same parent list
      if (activeParentId === overParentId) {
        const oldIndex = activeParentItems.findIndex(item => item.id === active.id);
        const newIndex = overParentItems.findIndex(item => item.id === over.id);
        
        // Find the parent in the cloned structure
        let itemsToUpdate: NavigationItemWithChildren[];
        
        if (activeParentId === null) {
          // Top level items
          itemsToUpdate = newItems;
        } else {
          // Find the parent item in the cloned structure
          const parentItem = newItems.find(item => item.id === activeParentId);
          if (!parentItem || !parentItem.children) return;
          itemsToUpdate = parentItem.children;
        }
        
        // Reorder the items
        const reorderedItems = arrayMove([...itemsToUpdate], oldIndex, newIndex);
        
        // Update the parent's children
        if (activeParentId === null) {
          // Update top level items
          for (let i = 0; i < reorderedItems.length; i++) {
            newItems[i] = { ...reorderedItems[i], order_index: i };
          }
        } else {
          // Find and update the parent's children
          const parentItem = newItems.find(item => item.id === activeParentId);
          if (parentItem && parentItem.children) {
            parentItem.children = reorderedItems.map((item, index) => ({
              ...item,
              order_index: index
            }));
          }
        }
        
        // Update local state immediately
        setItems(newItems);
        
        // Send updates to the server
        const itemsToSendToServer = activeParentId === null
          ? reorderedItems
          : newItems.find(item => item.id === activeParentId)?.children || [];
        
        await Promise.all(
          itemsToSendToServer.map((item: NavigationItemWithChildren, index: number) =>
            updateNavigationItem({
              id: item.id,
              data: { 
                order_index: index,
                parent_id: activeParentId
              }
            })
          )
        );
        
        // Refresh data from server after successful update
        refetch();
        
        toast({
          title: 'Success',
          description: 'Item order updated successfully.',
        });
      }
      // In the future, you could add support for moving items between different parents
      
    } catch (_error) {
      // On error, revert to original items by refetching
      refetch();
      
      toast({
        title: 'Error',
        description: 'Failed to update item order.',
        variant: 'destructive',
      });
    }
  }

  // Loading state for menu data
  if (isLoadingMenu || isLoadingItems) {
    return (
      <div className="max-w-5xl mx-auto py-8 px-4 bg-black">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white mx-auto"></div>
            <p className="mt-4 text-lg text-white">Loading navigation menu...</p>
          </div>
        </div>
      </div>
    )
  }

  // Menu not found
  if (!menu) {
    return (
      <div className="max-w-5xl mx-auto py-8 px-4 bg-black">
        <div className="max-w-md mx-auto bg-zinc-900 rounded-[14px] shadow-md p-8 text-center">
          <h2 className="text-2xl font-semibold mb-4 text-red-400">Menu Not Found</h2>
          <p className="mb-6 text-zinc-400">The navigation menu you&apos;re looking for doesn&apos;t exist or has been removed.</p>
          <Button asChild size="lg" className="bg-white text-black hover:bg-zinc-200">
            <Link href="/admin/navigation">Back to Navigation</Link>
          </Button>
        </div>
      </div>
    )
  }

  // Handle submit for creating/updating items
  const handleSubmit = async (data: any) => {
    try {
      // Extract roleAssignments from form data
      const { roleAssignments = { roleTypes: [], teams: [], areas: [], regions: [] }, is_folder, ...itemData } = data;
      
      // For folder items, we'll handle the URL at the service level
      // but ensure we always send a string for url (not null)
      const processedData = {
        ...itemData,
        url: itemData.url || '',  // Ensure URL is never null
        is_folder: is_folder || false,
        start_date: itemData.start_date?.toISOString() || null,
        end_date: itemData.end_date?.toISOString() || null
      };
      
      let navItemId: string;
      
      if (selectedItem) {
        // Update existing item
        await updateNavigationItem({
          id: selectedItem,
          data: processedData
        });
        navItemId = selectedItem;
        await deleteRolesByItemId(selectedItem);
      } else {
        // Create new item
        const newItem = await createNavigationItem({
          ...processedData,
          menu_id: menuId,
          order_index: items?.length || 0
        });
        
        navItemId = newItem.id;
      }
      
      // Handle roles if the item is not public
      if (!itemData.is_public) {
        const roleTypes = roleAssignments.roleTypes.length > 0 
          ? roleAssignments.roleTypes 
          : ['Any']; // Default if no roles specified
        
        // If no locations specified, just assign the roles
        if (roleAssignments.teams.length === 0 && 
            roleAssignments.areas.length === 0 && 
            roleAssignments.regions.length === 0) {
          
          for (const roleType of roleTypes) {
            await assignRole({
              itemId: navItemId,
              roleData: {
                role_type: roleType,
                team: null,
                area: null,
                region: null
              }
            });
          }
        } else {
          // Create all combinations of roles and locations
          
          // For teams
          for (const team of roleAssignments.teams) {
            for (const roleType of roleTypes) {
              await assignRole({
                itemId: navItemId,
                roleData: {
                  role_type: roleType,
                  team: team,
                  area: null,
                  region: null
                }
              });
            }
          }
          
          // For areas
          for (const area of roleAssignments.areas) {
            for (const roleType of roleTypes) {
              await assignRole({
                itemId: navItemId,
                roleData: {
                  role_type: roleType,
                  team: null,
                  area: area,
                  region: null
                }
              });
            }
          }
          
          // For regions
          for (const region of roleAssignments.regions) {
            for (const roleType of roleTypes) {
              await assignRole({
                itemId: navItemId,
                roleData: {
                  role_type: roleType,
                  team: null,
                  area: null,
                  region: region
                }
              });
            }
          }
        }
      }

      // Refresh data
      refetch();
      
      toast({
        title: 'Success',
        description: `Navigation item ${selectedItem ? 'updated' : 'created'} successfully.`,
      });

      setIsAddingItem(false);
      setSelectedItem(null);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: `Failed to ${selectedItem ? 'update' : 'create'} navigation item.`,
        variant: 'destructive',
      });
    }
  };

  // Handle delete with optimistic update
  const handleDeleteItem = async (itemId: string) => {
    // Find the item and its parent
    const { item, parentId } = findItemById(items, itemId);
    
    if (!item) return;
    
    // Create a deep copy of items
    const newItems = deepCloneItems(items);
    
    // Helper function to remove item from array
    const removeItemFromArray = (array: NavigationItemWithChildren[], id: string): NavigationItemWithChildren[] => {
      return array.filter(item => item.id !== id);
    };
    
    // If it's a top-level item
    if (!parentId) {
      const filteredItems = removeItemFromArray(newItems, itemId);
      setItems(filteredItems);
    } else {
      // It's a child item - find the parent and update its children
      const parentItem = newItems.find(item => item.id === parentId);
      if (parentItem && parentItem.children) {
        parentItem.children = removeItemFromArray(parentItem.children, itemId);
        setItems(newItems);
      }
    }
    
    try {
      // Delete from server
      await deleteNavigationItem(itemId);
      
      // Refresh data
      refetch();
      
      toast({
        title: 'Success',
        description: 'Item deleted successfully.',
      });
    } catch (_error) {
      // On error, revert to original items
      refetch();
      
      toast({
        title: 'Error',
        description: 'Failed to delete item.',
        variant: 'destructive',
      });
    }
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 bg-black text-white min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="shrink-0 text-white">
            <Link href="/admin/navigation">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">{menu.name}</h1>
            <p className="text-zinc-400 mt-1">{menu.description || 'No description'}</p>
          </div>
          <Badge variant={menu.is_active ? 'default' : 'secondary'} className="ml-2">
            {menu.is_active ? 'Active' : 'Inactive'}
          </Badge>
        </div>
        <Button onClick={() => setIsAddingItem(true)} size="lg" className="shrink-0 bg-white text-black hover:bg-zinc-200">
          <Plus className="mr-2 h-5 w-5" />
          Add Navigation Item
        </Button>
      </div>

      {/* Main Content */}
      <Card className="shadow-md bg-black text-white border-0 rounded-[14px]">
        <CardHeader>
          <CardTitle className="text-white">Navigation Items</CardTitle>
          <CardDescription className="text-zinc-400">
            Drag and drop to reorder items. Click an item to expand and see child links.
            Hover over the badges to see role visibility details.
          </CardDescription>
        </CardHeader>
        <CardContent className="bg-black">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items?.map(item => item.id) || []}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4">
                {items?.map((item) => (
                  <SortableItem
                    key={item.id}
                    item={item}
                    onEdit={() => setSelectedItem(item.id)}
                    onView={() => window.open(item.url, '_blank')}
                    onDelete={() => handleDeleteItem(item.id)}
                    expanded={expandedItems.includes(item.id)}
                    toggleExpand={() => toggleItemExpand(item.id)}
                    hasChildren={!!(item.children && item.children.length > 0)}
                  />
                ))}
                {!items?.length && (
                  <div className="flex flex-col items-center justify-center py-16 bg-zinc-900 text-white rounded-[14px] border border-zinc-700">
                    <p className="text-zinc-400 mb-4">No items in this menu</p>
                    <Button variant="outline" onClick={() => setIsAddingItem(true)} className="bg-transparent border-white text-white hover:bg-zinc-800">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Your First Item
                    </Button>
                  </div>
                )}
              </div>
            </SortableContext>
            
            {/* Add SortableContext for child items when they're expanded */}
            {items?.map((item) => 
              item.children && item.children.length > 0 && expandedItems.includes(item.id) ? (
                <SortableContext
                  key={`children-${item.id}`}
                  items={item.children.map((child: NavigationItemWithChildren) => child.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {/* Child items are rendered inside SortableItem component */}
                  <div></div>
                </SortableContext>
              ) : null
            )}
          </DndContext>
        </CardContent>
      </Card>

      {/* Add/Edit Item Dialog */}
      <Dialog open={isAddingItem || !!selectedItem} onOpenChange={(open) => {
        if (!open) {
          setIsAddingItem(false)
          setSelectedItem(null)
        }
      }}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isAddingItem ? 'Add Navigation Item' : 'Edit Navigation Item'}
            </DialogTitle>
            <DialogDescription>
              {isAddingItem
                ? 'Add a new item to the navigation menu'
                : 'Edit the selected navigation item'}
            </DialogDescription>
          </DialogHeader>

          <NavigationItemForm
            menuId={menuId}
            itemId={selectedItem}
            defaultValues={selectedItem ? transformNavigationItemForForm(findItemById(items, selectedItem).item) : undefined}
            onSubmit={handleSubmit}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}