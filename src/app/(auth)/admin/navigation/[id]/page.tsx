'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Calendar, Globe, Lock } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
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
import { RoleAssignment } from '@/features/navigation/components/admin/RoleAssignment'
import { NavigationPreview } from '@/features/navigation/components/admin/NavigationPreview'
import { NavigationItem } from '@/features/navigation/components/NavigationItem'

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
  } = useNavigation()

  const { data: menu, isLoading: isLoadingMenu } = useNavigationMenu(menuId)
  const { data: items = [], isLoading: isLoadingItems } = useNavigationItems(menuId)

  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  const [isAddingItem, setIsAddingItem] = useState(false)
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])

  // DnD setup
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Handle DnD reordering
  const handleDragEnd = async (event: any) => {
    const { active, over } = event

    if (active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id)
      const newIndex = items.findIndex((item) => item.id === over.id)

      const newItems = arrayMove([...items], oldIndex, newIndex)
      
      try {
        await Promise.all(
          newItems.map((item, index) =>
            updateNavigationItem({
              id: item.id,
              data: { order_index: index }
            })
          )
        )

        toast({
          title: 'Success',
          description: 'Item order updated successfully.',
        })
      } catch (_error) {
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
      <div className="page-container">
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-2">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  // Menu not found
  if (!menu) {
    return (
      <div className="page-container">
        <div className="text-center text-red-600">
          <h2 className="text-xl font-semibold mb-2">Error</h2>
          <p>Navigation menu not found</p>
          <Button asChild className="mt-4">
            <Link href="/admin/navigation">Back to Navigation</Link>
          </Button>
        </div>
      </div>
    )
  }

  const handleSubmit = async (data: any) => {
    try {
      if (selectedItem) {
        await updateNavigationItem({
          id: selectedItem,
          data: {
            ...data,
            start_date: data.start_date?.toISOString() || null,
            end_date: data.end_date?.toISOString() || null
          }
        })
      } else {
        await createNavigationItem({
          ...data,
          menu_id: menuId,
          order_index: items?.length || 0,
          start_date: data.start_date?.toISOString() || null,
          end_date: data.end_date?.toISOString() || null
        })
      }

      toast({
        title: 'Success',
        description: `Navigation item ${selectedItem ? 'updated' : 'created'} successfully.`,
      })

      setIsAddingItem(false)
      setSelectedItem(null)
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to ${selectedItem ? 'update' : 'create'} navigation item.`,
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/admin/navigation">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="page-title">{menu.name}</h1>
            <p className="page-description">{menu.description || 'No description'}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={menu.is_active ? 'default' : 'secondary'}>
            {menu.is_active ? 'Active' : 'Inactive'}
          </Badge>
          <Button onClick={() => setIsAddingItem(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Navigation Items</CardTitle>
              <CardDescription>
                Drag and drop to reorder items. Click an item to edit its details.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={items || []}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {items?.map((item) => (
                      <NavigationItem
                        key={item.id}
                        item={item}
                        onClick={() => setSelectedItem(item.id)}
                        onDelete={() => deleteNavigationItem(item.id)}
                        isDraggable
                      />
                    ))}
                    {!items?.length && (
                      <div className="text-center py-8 text-muted-foreground">
                        No items in this menu
                      </div>
                    )}
                  </div>
                </SortableContext>
              </DndContext>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>
                See how the navigation appears to different roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RoleAssignment
                value={selectedRoles}
                onChange={setSelectedRoles}
              />
              <div className="mt-4 border rounded-lg p-4">
                <NavigationPreview
                  items={items || []}
                  selectedRoles={selectedRoles}
                  onRoleToggle={(role) => {
                    setSelectedRoles(prev => 
                      prev.includes(role) 
                        ? prev.filter(r => r !== role)
                        : [...prev, role]
                    )
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Menu Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status</span>
                <Badge variant={menu.is_active ? 'default' : 'secondary'}>
                  {menu.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Items</span>
                <span className="text-sm">{items?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Visibility</span>
                <div className="flex items-center">
                  {(menu as any)?.is_public ? (
                    <>
                      <Globe className="h-4 w-4 mr-1" />
                      <span className="text-sm">Public</span>
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 mr-1" />
                      <span className="text-sm">Private</span>
                    </>
                  )}
                </div>
              </div>
              {((menu as any)?.start_date || (menu as any)?.end_date) && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Schedule</span>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span className="text-sm">
                      {(menu as any)?.start_date && (menu as any)?.end_date
                        ? `${new Date((menu as any).start_date).toLocaleDateString()} - ${new Date((menu as any).end_date).toLocaleDateString()}`
                        : (menu as any)?.start_date
                        ? `From ${new Date((menu as any).start_date).toLocaleDateString()}`
                        : `Until ${new Date((menu as any).end_date).toLocaleDateString()}`}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add/Edit Item Dialog */}
      <Dialog open={isAddingItem || !!selectedItem} onOpenChange={(open) => {
        if (!open) {
          setIsAddingItem(false)
          setSelectedItem(null)
        }
      }}>
        <DialogContent className="sm:max-w-[600px]">
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