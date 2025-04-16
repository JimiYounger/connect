"use client";

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DeleteCategoryModal } from '@/features/documentLibrary';
import { Loader2, Pencil, Trash, Plus, GripVertical, ChevronRight, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  DndContext, 
  DragEndEvent, 
  KeyboardSensor, 
  PointerSensor, 
  closestCenter, 
  useSensor, 
  useSensors 
} from '@dnd-kit/core';
import { 
  SortableContext, 
  sortableKeyboardCoordinates, 
  useSortable, 
  verticalListSortingStrategy 
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Subcategory {
  id: string;
  name: string;
  order: number;
  document_category_id: string;
}

interface Category {
  id: string;
  name: string;
  order: number;
  documentCount?: number;
  subcategories: Subcategory[];
}

export default function CategoryManager() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for new category creation
  const [showNewCategoryDialog, setShowNewCategoryDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  // State for category editing
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  
  // State for category deletion
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // State for tracking expanded categories
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Toggle expanded state of a category
  const toggleCategoryExpanded = (categoryId: string) => {
    setExpandedCategories(prevExpanded => {
      const newExpanded = new Set(prevExpanded);
      if (newExpanded.has(categoryId)) {
        newExpanded.delete(categoryId);
      } else {
        newExpanded.add(categoryId);
      }
      return newExpanded;
    });
  };

  // Check if a category is expanded
  const isCategoryExpanded = (categoryId: string) => {
    return expandedCategories.has(categoryId);
  };

  // Fetch categories, document counts, and subcategories
  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const supabase = createClient();
      
      // Get all categories
      const { data: categories, error: categoriesError } = await supabase
        .from('document_categories')
        .select('id, name, order')
        .order('order', { ascending: true, nullsFirst: false });
        
      if (categoriesError) throw categoriesError;
      
      // Get all subcategories at once (more efficient than fetching per category)
      const { data: allSubcategories, error: subcategoriesError } = await supabase
        .from('document_subcategories')
        .select('id, name, order, document_category_id')
        .order('order', { ascending: true, nullsFirst: false });
        
      if (subcategoriesError) throw subcategoriesError;
      
      // For each category, get document count and attach relevant subcategories
      const enrichedCategories = await Promise.all(
        categories.map(async (category) => {
          // Get document count
          const { count, error: countError } = await supabase
            .from('documents')
            .select('id', { count: 'exact', head: true })
            .eq('document_category_id', category.id);
            
          if (countError) {
            console.error(`Error fetching count for category ${category.id}:`, countError);
            return { 
              ...category, 
              documentCount: 0,
              order: category.order === null ? 9999 : category.order,
              subcategories: [] 
            };
          }
          
          // Find subcategories for this category
          const categorySubcategories = allSubcategories
            .filter(sub => sub.document_category_id === category.id)
            .map(sub => ({
              id: sub.id,
              name: sub.name,
              order: sub.order === null ? 9999 : sub.order,
              document_category_id: sub.document_category_id
            }));
          
          return { 
            ...category, 
            documentCount: count || 0,
            order: category.order === null ? 9999 : category.order,
            subcategories: categorySubcategories
          };
        })
      );
      
      setCategories(enrichedCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      
      toast({
        title: 'Error loading categories',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Load categories on component mount
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Handle creating a new category
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    setIsCreating(true);
    
    try {
      const supabase = createClient();
      
      // Check if category with this name already exists
      const { data: existingCategory } = await supabase
        .from('document_categories')
        .select('id')
        .ilike('name', newCategoryName.trim())
        .maybeSingle();
        
      if (existingCategory) {
        toast({
          title: 'Category already exists',
          description: 'A category with this name already exists.',
          variant: 'destructive',
        });
        return;
      }
      
      // Create new category
      const { error } = await supabase
        .from('document_categories')
        .insert({ name: newCategoryName.trim() });
        
      if (error) throw error;
      
      // Success feedback
      toast({
        title: 'Category created',
        description: `"${newCategoryName}" has been created successfully.`,
      });
      
      // Reset form and refresh list
      setNewCategoryName('');
      setShowNewCategoryDialog(false);
      fetchCategories();
    } catch (error) {
      console.error('Error creating category:', error);
      
      toast({
        title: 'Error creating category',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Start editing a category
  const startEditing = (category: Category) => {
    setEditingCategoryId(category.id);
    setEditCategoryName(category.name);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingCategoryId(null);
    setEditCategoryName('');
  };

  // Handle updating a category name
  const handleUpdateCategory = async (categoryId: string) => {
    if (!editCategoryName.trim() || editCategoryName.trim() === categories.find(c => c.id === categoryId)?.name) {
      cancelEditing();
      return;
    }
    
    setIsEditing(true);
    
    try {
      const supabase = createClient();
      
      // Check if category with this name already exists
      const { data: existingCategory } = await supabase
        .from('document_categories')
        .select('id')
        .ilike('name', editCategoryName.trim())
        .neq('id', categoryId)
        .maybeSingle();
        
      if (existingCategory) {
        toast({
          title: 'Category name already in use',
          description: 'Another category with this name already exists.',
          variant: 'destructive',
        });
        return;
      }
      
      // Update category
      const { error } = await supabase
        .from('document_categories')
        .update({ name: editCategoryName.trim() })
        .eq('id', categoryId);
        
      if (error) throw error;
      
      // Success feedback
      toast({
        title: 'Category updated',
        description: 'The category name has been updated successfully.',
      });
      
      // Reset form and refresh list
      cancelEditing();
      fetchCategories();
    } catch (error) {
      console.error('Error updating category:', error);
      
      toast({
        title: 'Error updating category',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsEditing(false);
    }
  };

  // Handle keydown events for inline editing
  const handleEditKeyDown = (e: React.KeyboardEvent, categoryId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleUpdateCategory(categoryId);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEditing();
    }
  };

  // Open delete confirmation modal
  const openDeleteModal = (categoryId: string) => {
    setDeleteCategoryId(categoryId);
    setShowDeleteModal(true);
  };

  // Close delete confirmation modal
  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteCategoryId(null);
  };

  // Handle successful deletion (callback from DeleteCategoryModal)
  const handleDeleteComplete = () => {
    fetchCategories();
  };

  // Handle drag end for reordering categories
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;
    
    // Find the indices of the dragged item and drop target
    const oldIndex = categories.findIndex(cat => cat.id === active.id);
    const newIndex = categories.findIndex(cat => cat.id === over.id);
    
    if (oldIndex === -1 || newIndex === -1) return;

    // Create a new array with the updated order
    const newCategories = [...categories];
    const [movedItem] = newCategories.splice(oldIndex, 1);
    newCategories.splice(newIndex, 0, movedItem);
    
    // Update local state immediately for responsive UI
    setCategories(newCategories.map((cat, idx) => ({
      ...cat,
      order: idx
    })));

    // Persist the new order to the database
    try {
      const supabase = createClient();
      
      // Update each category with its new order value
      const updates = newCategories.map((cat, idx) => 
        supabase
          .from('document_categories')
          .update({ order: idx })
          .eq('id', cat.id)
      );
      
      await Promise.all(updates);
      
      toast({
        title: 'Categories reordered',
        description: 'The category order has been updated successfully.',
      });
    } catch (error) {
      console.error('Error updating category order:', error);
      
      toast({
        title: 'Error updating order',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
      
      // Revert to the original order if the update fails
      fetchCategories();
    }
  };

  // Set up drag sensors for keyboard and pointer events
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Category Management</h1>
        <Button 
          onClick={() => setShowNewCategoryDialog(true)}
          className="flex items-center gap-1"
        >
          <Plus size={16} />
          Create New Category
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading categories...</span>
        </div>
      ) : error ? (
        <div className="p-4 mb-4 text-red-700 bg-red-100 rounded-md">
          <p>{error}</p>
          <Button 
            variant="outline" 
            className="mt-2" 
            onClick={fetchCategories}
          >
            Try Again
          </Button>
        </div>
      ) : categories.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              No categories found. Create your first category to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext 
            items={categories.map(cat => cat.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-4">
              {categories.map((category) => (
                <SortableCategoryCard 
                  key={category.id}
                  id={category.id}
                  category={category}
                  editingCategoryId={editingCategoryId}
                  editCategoryName={editCategoryName}
                  setEditCategoryName={setEditCategoryName}
                  isEditing={isEditing}
                  startEditing={startEditing}
                  cancelEditing={cancelEditing}
                  handleUpdateCategory={handleUpdateCategory}
                  handleEditKeyDown={handleEditKeyDown}
                  openDeleteModal={openDeleteModal}
                  isExpanded={isCategoryExpanded(category.id)}
                  onToggleExpand={toggleCategoryExpanded}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Create New Category Dialog */}
      <Dialog open={showNewCategoryDialog} onOpenChange={setShowNewCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Category</DialogTitle>
            <DialogDescription>
              Enter a name for the new document category.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Input
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Category name"
              className="w-full"
              autoFocus
            />
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowNewCategoryDialog(false);
                setNewCategoryName('');
              }}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateCategory}
              disabled={!newCategoryName.trim() || isCreating}
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : 'Create Category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Category Modal */}
      {showDeleteModal && deleteCategoryId && (
        <DeleteCategoryModal
          open={showDeleteModal}
          onClose={closeDeleteModal}
          categoryId={deleteCategoryId}
          onDeleteComplete={handleDeleteComplete}
        />
      )}
    </div>
  );
}

// Sortable Category Card Component
interface SortableCategoryCardProps {
  id: string;
  category: Category;
  editingCategoryId: string | null;
  editCategoryName: string;
  setEditCategoryName: (name: string) => void;
  isEditing: boolean;
  startEditing: (category: Category) => void;
  cancelEditing: () => void;
  handleUpdateCategory: (categoryId: string) => void;
  handleEditKeyDown: (e: React.KeyboardEvent, categoryId: string) => void;
  openDeleteModal: (categoryId: string) => void;
  isExpanded: boolean;
  onToggleExpand: (categoryId: string) => void;
}

function SortableCategoryCard({
  id,
  category,
  editingCategoryId,
  editCategoryName,
  setEditCategoryName,
  isEditing,
  startEditing,
  cancelEditing,
  handleUpdateCategory,
  handleEditKeyDown,
  openDeleteModal,
  isExpanded,
  onToggleExpand,
}: SortableCategoryCardProps) {
  const isBeingEdited = editingCategoryId === id;
  const hasSubcategories = category.subcategories && category.subcategories.length > 0;
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id,
    disabled: isBeingEdited // Disable dragging when being edited
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div>
      <Card 
        ref={setNodeRef} 
        style={style} 
        className={`overflow-hidden ${isDragging ? 'shadow-lg' : ''}`}
      >
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center">
            {/* Expand/collapse button */}
            {hasSubcategories && (
              <Button
                variant="ghost"
                size="icon"
                className="mr-1 h-8 w-8 p-0"
                onClick={() => onToggleExpand(id)}
              >
                {isExpanded ? 
                  <ChevronDown size={18} className="text-gray-600" /> : 
                  <ChevronRight size={18} className="text-gray-600" />
                }
                <span className="sr-only">
                  {isExpanded ? "Collapse" : "Expand"} {category.name}
                </span>
              </Button>
            )}
            
            {!isBeingEdited && (
              <div 
                className="cursor-grab mr-2 flex items-center justify-center p-1 hover:bg-gray-100 rounded"
                {...attributes}
                {...listeners}
              >
                <GripVertical size={18} className="text-gray-400" />
              </div>
            )}
            
            <div className="flex items-center gap-4 flex-grow">
              {isBeingEdited ? (
                <div className="flex-grow">
                  <Input
                    value={editCategoryName}
                    onChange={(e) => setEditCategoryName(e.target.value)}
                    onBlur={() => handleUpdateCategory(category.id)}
                    onKeyDown={(e) => handleEditKeyDown(e, category.id)}
                    className="font-medium"
                    autoFocus
                  />
                </div>
              ) : (
                <div className="flex-grow">
                  <span className="font-medium">{category.name}</span>
                  <span className="ml-2 text-sm text-muted-foreground">
                    ({category.documentCount} document{category.documentCount !== 1 ? 's' : ''})
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isBeingEdited ? (
              <>
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={() => handleUpdateCategory(category.id)}
                  disabled={isEditing}
                >
                  {isEditing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : 'Save'}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={cancelEditing}
                  disabled={isEditing}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => startEditing(category)}
                >
                  <Pencil size={18} />
                  <span className="sr-only">Edit {category.name}</span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => openDeleteModal(category.id)}
                >
                  <Trash size={18} />
                  <span className="sr-only">Delete {category.name}</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Subcategories */}
      {isExpanded && category.subcategories && category.subcategories.length > 0 && (
        <div className="pl-8 mt-2 space-y-2 mb-2">
          {category.subcategories.map((subcategory) => (
            <Card key={subcategory.id} className="overflow-hidden">
              <div className="p-3 text-sm flex items-center">
                <span className="font-medium">{subcategory.name}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 