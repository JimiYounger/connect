// my-app/src/app/(auth)/admin/widgets/categories/page.tsx

'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  ArrowLeft, 
  Plus, 
  Pencil, 
  Trash2, 
  GripVertical,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { 
  Card, 
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/features/auth/context/auth-context';
import { useProfile } from '@/features/users/hooks/useProfile';
import { usePermissions } from '@/features/permissions/hooks/usePermissions';
import { hasPermissionLevel } from '@/features/permissions/constants/roles';
import { widgetService } from '@/features/widgets/services/widget-service';

// Type for widget category
interface WidgetCategory {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  position: number;
  widget_count?: number;
}

// Sortable category item component
function SortableCategoryItem({ category, onEdit, onDelete }: { 
  category: WidgetCategory, 
  onEdit: (category: WidgetCategory) => void,
  onDelete: (category: WidgetCategory) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: category.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  
  return (
    <div ref={setNodeRef} style={style} className="relative">
      <Card className="overflow-hidden h-full">
        <div 
          className="absolute left-0 top-0 h-full w-1.5" 
          style={{ backgroundColor: category.color || '#3b82f6' }}
        />
        <div 
          {...attributes}
          {...listeners}
          className="absolute right-2 top-2 cursor-grab p-1 rounded-md hover:bg-gray-100"
        >
          <GripVertical className="h-4 w-4 text-gray-400" />
        </div>
        <CardHeader>
          <CardTitle className="flex items-center">
            <span 
              className="inline-block h-3 w-3 rounded-full mr-2" 
              style={{ backgroundColor: category.color || '#3b82f6' }}
            />
            {category.name}
          </CardTitle>
          {category.description && (
            <CardDescription>{category.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600">
            Position: {category.position}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-gray-600">
            {category.widget_count} widget{category.widget_count !== 1 ? 's' : ''}
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(category)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(category)}
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function WidgetCategoriesPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  // Auth and permissions
  const { session, loading: _loading } = useAuth();
  const { profile } = useProfile(session);
  const { userPermissions } = usePermissions(profile);
  
  // Set up dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // State
  const [categories, setCategories] = useState<WidgetCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<WidgetCategory | null>(null);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const [categoryToDelete, setCategoryToDelete] = useState<WidgetCategory | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formColor, setFormColor] = useState('#3b82f6'); // Default blue color
  
  // Fetch categories
  useEffect(() => {
    async function fetchCategories() {
      try {
        setIsLoading(true);
        setError(null);
        
        const { data: categoriesData, error: categoriesError } = 
          await widgetService.getWidgetCategories();
          
        if (categoriesError) throw categoriesError;
        
        // Get widget counts per category
        const { data: widgetCountData, error: countError } = 
          await widgetService.getWidgetCountsByCategory();
          
        if (countError) throw countError;
        
        // Combine data
        const categoriesWithCounts = categoriesData?.map(category => {
          const countItem = widgetCountData?.find(w => w.category_id === category.id);
          return {
            ...category,
            widget_count: countItem?.count || 0
          };
        }) || [];
        
        // Sort by position
        const sortedCategories = [...categoriesWithCounts].sort((a, b) => 
          (a.position || 0) - (b.position || 0)
        );
        
        setCategories(sortedCategories);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError(err as Error);
        toast({
          title: 'Error',
          description: 'Failed to load widget categories',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    if (session) {
      fetchCategories();
    }
  }, [session, toast]);
  
  // Handle drag end event
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    // Return if no change
    if (!over || active.id === over.id) {
      return;
    }
    
    // Find the indices of the dragged item and target position
    const oldIndex = categories.findIndex((cat) => cat.id === active.id);
    const newIndex = categories.findIndex((cat) => cat.id === over.id);
    
    // Reorder categories (optimistic update)
    const updatedCategories = arrayMove(categories, oldIndex, newIndex);
    
    // Update positions based on new order
    const updatedWithPositions = updatedCategories.map((category, index) => ({
      ...category,
      position: index
    }));
    
    // Update state
    setCategories(updatedWithPositions);
    
    // Prepare updates for backend
    const updates = updatedWithPositions.map(category => ({
      id: category.id,
      position: category.position
    }));
    
    // Save to backend
    try {
      const { error } = await widgetService.updateCategoryOrder(updates);
      
      if (error) throw error;
      
      toast({
        title: 'Categories reordered',
        description: 'Category order has been updated successfully',
      });
    } catch (err) {
      console.error('Error saving category order:', err);
      
      // Revert to original order on error
      setCategories(categories);
      
      toast({
        title: 'Error',
        description: 'Failed to update category order',
        variant: 'destructive',
      });
    }
  };
  
  // Add category handler
  const handleAddCategory = () => {
    setDialogMode('add');
    setCurrentCategory(null);
    setFormName('');
    setFormDescription('');
    setFormColor('#3b82f6');
    setShowAddDialog(true);
  };
  
  // Edit category handler
  const handleEditCategory = (category: WidgetCategory) => {
    setDialogMode('edit');
    setCurrentCategory(category);
    setFormName(category.name);
    setFormDescription(category.description || '');
    setFormColor(category.color || '#3b82f6');
    setShowAddDialog(true);
  };
  
  // Save category handler
  const handleSaveCategory = async () => {
    if (!formName.trim()) return;
    
    setIsSaving(true);
    
    try {
      if (dialogMode === 'add') {
        // Create new category
        const { data, error } = await widgetService.createCategory({
          name: formName.trim(),
          description: formDescription.trim() || null,
          color: formColor,
        });
        
        if (error) throw error;
        
        if (data) {
          // Add to list with count 0
          setCategories(prev => [...prev, { ...data, widget_count: 0 }]);
          
          toast({
            title: 'Category created',
            description: `${formName} has been created successfully`,
          });
        }
      } else if (dialogMode === 'edit' && currentCategory) {
        // Update existing category
        const { data, error } = await widgetService.updateCategory(
          currentCategory.id,
          {
            name: formName.trim(),
            description: formDescription.trim() || null,
            color: formColor,
          }
        );
        
        if (error) throw error;
        
        if (data) {
          // Update in list
          setCategories(prev => 
            prev.map(cat => 
              cat.id === currentCategory.id 
                ? { ...data, widget_count: cat.widget_count } 
                : cat
            )
          );
          
          toast({
            title: 'Category updated',
            description: `${formName} has been updated successfully`,
          });
        }
      }
      
      // Close dialog
      setShowAddDialog(false);
    } catch (err) {
      console.error('Error saving category:', err);
      toast({
        title: 'Error',
        description: 'Failed to save category',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Delete click handler
  const handleDeleteClick = (category: WidgetCategory) => {
    setCategoryToDelete(category);
  };
  
  // Delete category handler
  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;
    
    try {
      const { error } = await widgetService.deleteCategory(categoryToDelete.id);
      
      if (error) throw error;
      
      // Remove from list
      setCategories(prev => prev.filter(cat => cat.id !== categoryToDelete.id));
      
      toast({
        title: 'Category deleted',
        description: `${categoryToDelete.name} has been deleted successfully`,
      });
      
      // Close dialog
      setCategoryToDelete(null);
    } catch (err) {
      console.error('Error deleting category:', err);
      toast({
        title: 'Error',
        description: (err as Error).message || 'Failed to delete category',
        variant: 'destructive',
      });
    }
  };
  
  // Permission check
  if (!userPermissions?.roleType || !hasPermissionLevel('Admin', userPermissions.roleType)) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Unauthorized</h2>
          <p>You don&apos;t have permission to access this page</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/admin/widgets" className="mr-2">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Widget Categories</h1>
            <p className="text-muted-foreground">
              Organize widgets into categories for easier discovery
            </p>
          </div>
        </div>
        
        <Button onClick={handleAddCategory}>
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>
      
      {/* Loading state */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <Card key={n} className="overflow-hidden">
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-1/3" />
              </CardContent>
              <CardFooter className="flex justify-between">
                <Skeleton className="h-4 w-1/4" />
                <div className="flex space-x-2">
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="h-5 w-5" />
            <h3 className="font-medium">Error loading categories</h3>
          </div>
          <p className="mt-2 text-sm text-red-600">{error.message}</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => router.refresh()}
          >
            Try Again
          </Button>
        </div>
      ) : (
        <>
          {/* Empty state */}
          {categories.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No Categories</h3>
              <p className="text-gray-500 mb-4 max-w-md mx-auto">
                You haven&apos;t created any widget categories yet. Categories help organize widgets for easier discovery.
              </p>
              <Button onClick={handleAddCategory}>
                <Plus className="mr-2 h-4 w-4" />
                Add First Category
              </Button>
            </div>
          ) : (
            /* Category grid with dnd-kit */
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext 
                items={categories.map(cat => cat.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {categories.map((category) => (
                    <SortableCategoryItem
                      key={category.id}
                      category={category}
                      onEdit={handleEditCategory}
                      onDelete={handleDeleteClick}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </>
      )}
      
      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'add' ? 'Create New Category' : 'Edit Category'}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === 'add' 
                ? 'Add a new category to organize your widgets'
                : 'Update the category information'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Category name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="Brief description of this category"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <div className="flex space-x-2">
                <Input
                  id="color"
                  type="text"
                  placeholder="#3b82f6"
                  value={formColor}
                  onChange={(e) => setFormColor(e.target.value)}
                />
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={formColor}
                    onChange={(e) => setFormColor(e.target.value)}
                    className="h-8 w-10 border border-gray-300 rounded"
                  />
                  <div 
                    className="h-8 w-8 rounded border"
                    style={{ backgroundColor: formColor }}
                  />
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button 
              onClick={handleSaveCategory}
              disabled={isSaving || !formName.trim()}
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {dialogMode === 'add' ? 'Create Category' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog 
        open={!!categoryToDelete} 
        onOpenChange={(open) => !open && setCategoryToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{categoryToDelete?.name}&quot;?
              {(categoryToDelete?.widget_count || 0) > 0 && (
                <div className="mt-2 text-red-600 font-medium">
                  This category contains {categoryToDelete?.widget_count} widget{categoryToDelete?.widget_count !== 1 ? 's' : ''}.
                  You must reassign or delete these widgets first.
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCategory}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={(categoryToDelete?.widget_count || 0) > 0}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 