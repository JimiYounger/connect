'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, ChevronRight, GripVertical } from 'lucide-react'
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
import { deleteRolesByItemId } from '@/features/navigation/services/navigation-service'

interface NavigationItem {
  id: string;
  title: string;
  order_index: number;
  [key: string]: any;
}

interface SortableItemProps {
  item: NavigationItem;
  onClick: () => void;
  onDelete: () => void;
}

// Custom SortableItem component
const SortableItem = ({ item, onClick, onDelete }: SortableItemProps) => {
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
      className="flex items-center justify-between p-6 bg-zinc-900 text-white rounded-[14px] cursor-pointer hover:bg-zinc-800 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div 
          className="touch-none cursor-grab active:cursor-grabbing text-zinc-500 hover:text-white"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5" />
        </div>
        <div 
          className="font-medium text-lg"
          onClick={onClick}
        >
          {item.title}
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
        <div 
          className="h-8 w-8 bg-white rounded-full flex items-center justify-center"
          onClick={onClick}
        >
          <ChevronRight className="h-5 w-5 text-black" />
        </div>
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
  const [items, setItems] = useState<NavigationItem[]>([]);
  
  // Keep items in sync with server data
  useEffect(() => {
    if (serverItems?.length > 0) {
      setItems(serverItems);
    }
  }, [serverItems]);

  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  const [isAddingItem, setIsAddingItem] = useState(false)

  // DnD setup
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Handle DnD reordering with optimistic update
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id)
      const newIndex = items.findIndex((item) => item.id === over.id)

      // Create new array with the reordered items
      const newItems = arrayMove([...items], oldIndex, newIndex)
      
      // Update local state immediately
      setItems(newItems);
      
      try {
        // Send updates to the server
        await Promise.all(
          newItems.map((item, index) =>
            updateNavigationItem({
              id: item.id,
              data: { order_index: index }
            })
          )
        )

        // Refresh data from server after successful update
        refetch();
        
        toast({
          title: 'Success',
          description: 'Item order updated successfully.',
        })
      } catch (_error) {
        // On error, revert to original items by refetching
        refetch();
        
        toast({
          title: 'Error',
          description: 'Failed to update item order.',
          variant: 'destructive',
        })
      }
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
      // Extract roles from form data
      const { roles = [], ...itemData } = data;
      
      let navItemId: string;
      
      if (selectedItem) {
        // Update existing item
        await updateNavigationItem({
          id: selectedItem,
          data: {
            ...itemData,
            start_date: itemData.start_date?.toISOString() || null,
            end_date: itemData.end_date?.toISOString() || null
          }
        });
        navItemId = selectedItem;
        
        // Clean up existing roles
        await deleteRolesByItemId(selectedItem);
      } else {
        // Create new item
        const newItem = await createNavigationItem({
          ...itemData,
          menu_id: menuId,
          order_index: items?.length || 0,
          start_date: itemData.start_date?.toISOString() || null,
          end_date: itemData.end_date?.toISOString() || null
        });
        
        navItemId = newItem.id;
      }
      
      // Handle roles if the item is not public and roles are provided
      if (!itemData.is_public && roles.length > 0) {
        // Create role assignments
        await Promise.all(roles.map(async (role: string) => {
          const roleData: any = { role_type: role };
          
          return assignRole({
            itemId: navItemId,
            roleData
          });
        }));
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
    // Create a filtered list without the item being deleted
    const filteredItems = items.filter(item => item.id !== itemId)
    
    // Update local state immediately
    setItems(filteredItems);
    
    try {
      // Delete from server
      await deleteNavigationItem(itemId)
      
      // Refresh data
      refetch();
      
      toast({
        title: 'Success',
        description: 'Item deleted successfully.',
      })
    } catch (_error) {
      // On error, revert to original items
      refetch();
      
      toast({
        title: 'Error',
        description: 'Failed to delete item.',
        variant: 'destructive',
      })
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
            Drag and drop to reorder items. Click an item to edit its details.
          </CardDescription>
        </CardHeader>
        <CardContent className="bg-black">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items || []}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4">
                {items?.map((item) => (
                  <SortableItem
                    key={item.id}
                    item={item}
                    onClick={() => setSelectedItem(item.id)}
                    onDelete={() => handleDeleteItem(item.id)}
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
            onSubmit={handleSubmit}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}