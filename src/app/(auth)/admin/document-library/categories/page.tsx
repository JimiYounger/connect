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
import React from 'react';

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

// Create subcategory context
const SubcategoryContext = React.createContext<{
  editingSubcategoryId: string | null;
  editSubcategoryName: string;
  setEditSubcategoryName: (name: string) => void;
  isEditingSubcategory: boolean;
  startEditingSubcategory: (subcategory: Subcategory) => void;
  cancelEditingSubcategory: () => void;
  handleUpdateSubcategory: (subcategoryId: string) => Promise<void>;
  handleSubcategoryEditKeyDown: (e: React.KeyboardEvent, subcategoryId: string) => void;
  openDeleteSubcategoryModal: (subcategoryId: string) => void;
  creatingForCategoryId: string | null;
  newSubcategoryName: string;
  setNewSubcategoryName: (name: string) => void;
  isCreatingSubcategory: boolean;
  startCreatingSubcategory: (categoryId: string) => void;
  cancelCreatingSubcategory: () => void;
  handleCreateSubcategory: (categoryId: string) => Promise<void>;
  handleSubcategoryCreateKeyDown: (e: React.KeyboardEvent, categoryId: string) => void;
  handleSubcategoryDragEnd: (event: DragEndEvent, categoryId: string) => Promise<void>;
}>({
  editingSubcategoryId: null,
  editSubcategoryName: '',
  setEditSubcategoryName: () => {},
  isEditingSubcategory: false,
  startEditingSubcategory: () => {},
  cancelEditingSubcategory: () => {},
  handleUpdateSubcategory: async () => {},
  handleSubcategoryEditKeyDown: () => {},
  openDeleteSubcategoryModal: () => {},
  creatingForCategoryId: null,
  newSubcategoryName: '',
  setNewSubcategoryName: () => {},
  isCreatingSubcategory: false,
  startCreatingSubcategory: () => {},
  cancelCreatingSubcategory: () => {},
  handleCreateSubcategory: async () => {},
  handleSubcategoryCreateKeyDown: () => {},
  handleSubcategoryDragEnd: async () => {},
});

// Interface types for API responses
interface PrepareDeleteResponse {
  success: boolean;
  error?: string;
  data: {
    subcategory: {
      id: string;
      name: string;
      document_category_id: string;
    };
    documents: Array<{
      id: string;
      title: string;
      document_subcategory_id: string;
    }>;
    availableSubcategories: Array<{
      id: string;
      name: string;
      order: number;
    }>;
  };
}

interface DeleteConfirmResponse {
  success: boolean;
  error?: string;
  message: string;
  documentsUpdated: number;
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
  
  // State for subcategory editing
  const [editingSubcategoryId, setEditingSubcategoryId] = useState<string | null>(null);
  const [editSubcategoryName, setEditSubcategoryName] = useState('');
  const [isEditingSubcategory, setIsEditingSubcategory] = useState(false);
  
  // State for subcategory deletion
  const [deleteSubcategoryId, setDeleteSubcategoryId] = useState<string | null>(null);
  const [showDeleteSubcategoryModal, setShowDeleteSubcategoryModal] = useState(false);
  
  // State for subcategory creation
  const [creatingForCategoryId, setCreatingForCategoryId] = useState<string | null>(null);
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [isCreatingSubcategory, setIsCreatingSubcategory] = useState(false);
  
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

  // Start editing a subcategory
  const startEditingSubcategory = (subcategory: Subcategory) => {
    setEditingSubcategoryId(subcategory.id);
    setEditSubcategoryName(subcategory.name);
  };

  // Cancel editing subcategory
  const cancelEditingSubcategory = () => {
    setEditingSubcategoryId(null);
    setEditSubcategoryName('');
  };

  // Handle updating a subcategory name
  const handleUpdateSubcategory = async (subcategoryId: string) => {
    // Find the subcategory and its parent category
    let parentCategoryId = '';
    let subcategory: Subcategory | undefined;
    
    for (const category of categories) {
      subcategory = category.subcategories.find(sub => sub.id === subcategoryId);
      if (subcategory) {
        parentCategoryId = category.id;
        break;
      }
    }
    
    if (!subcategory) return;
    
    if (!editSubcategoryName.trim() || editSubcategoryName.trim() === subcategory.name) {
      cancelEditingSubcategory();
      return;
    }
    
    setIsEditingSubcategory(true);
    
    try {
      const supabase = createClient();
      
      // Check if subcategory with this name already exists in the same category
      const { data: existingSubcategory } = await supabase
        .from('document_subcategories')
        .select('id')
        .eq('document_category_id', parentCategoryId)
        .ilike('name', editSubcategoryName.trim())
        .neq('id', subcategoryId)
        .maybeSingle();
        
      if (existingSubcategory) {
        toast({
          title: 'Subcategory name already in use',
          description: 'Another subcategory with this name already exists in this category.',
          variant: 'destructive',
        });
        return;
      }
      
      // Update subcategory
      const { error } = await supabase
        .from('document_subcategories')
        .update({ name: editSubcategoryName.trim() })
        .eq('id', subcategoryId);
        
      if (error) throw error;
      
      // Success feedback
      toast({
        title: 'Subcategory updated',
        description: 'The subcategory name has been updated successfully.',
      });
      
      // Reset form and refresh list
      cancelEditingSubcategory();
      fetchCategories();
    } catch (error) {
      console.error('Error updating subcategory:', error);
      
      toast({
        title: 'Error updating subcategory',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsEditingSubcategory(false);
    }
  };

  // Handle keydown events for inline editing of subcategories
  const handleSubcategoryEditKeyDown = (e: React.KeyboardEvent, subcategoryId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleUpdateSubcategory(subcategoryId);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEditingSubcategory();
    }
  };

  // Open delete subcategory confirmation modal
  const openDeleteSubcategoryModal = (subcategoryId: string) => {
    setDeleteSubcategoryId(subcategoryId);
    setShowDeleteSubcategoryModal(true);
  };

  // Close delete subcategory confirmation modal
  const closeDeleteSubcategoryModal = () => {
    setShowDeleteSubcategoryModal(false);
    setDeleteSubcategoryId(null);
  };

  // Handle successful subcategory deletion
  const handleSubcategoryDeleteComplete = () => {
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

  // Start creating a new subcategory
  const startCreatingSubcategory = (categoryId: string) => {
    setCreatingForCategoryId(categoryId);
    setNewSubcategoryName('');
    
    // Ensure the category is expanded
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      newSet.add(categoryId);
      return newSet;
    });
  };

  // Cancel creating a subcategory
  const cancelCreatingSubcategory = () => {
    setCreatingForCategoryId(null);
    setNewSubcategoryName('');
  };

  // Handle creating a new subcategory
  const handleCreateSubcategory = async (categoryId: string) => {
    if (!newSubcategoryName.trim()) return;
    
    setIsCreatingSubcategory(true);
    
    try {
      const supabase = createClient();
      
      // Check if subcategory with this name already exists in this category
      const { data: existingSubcategory } = await supabase
        .from('document_subcategories')
        .select('id')
        .eq('document_category_id', categoryId)
        .ilike('name', newSubcategoryName.trim())
        .maybeSingle();
        
      if (existingSubcategory) {
        toast({
          title: 'Subcategory already exists',
          description: 'A subcategory with this name already exists in this category.',
          variant: 'destructive',
        });
        return;
      }
      
      // Get max order for subcategories in this category
      const { data: subcategories } = await supabase
        .from('document_subcategories')
        .select('order')
        .eq('document_category_id', categoryId)
        .order('order', { ascending: false })
        .limit(1);
        
      const newOrder = subcategories && subcategories.length > 0 ? (subcategories[0].order || 0) + 1 : 0;
      
      // Create new subcategory
      const { error } = await supabase
        .from('document_subcategories')
        .insert({ 
          name: newSubcategoryName.trim(),
          document_category_id: categoryId,
          order: newOrder
        });
        
      if (error) throw error;
      
      // Success feedback
      toast({
        title: 'Subcategory created',
        description: `"${newSubcategoryName}" has been created successfully.`,
      });
      
      // Reset form and refresh list
      cancelCreatingSubcategory();
      fetchCategories();
    } catch (error) {
      console.error('Error creating subcategory:', error);
      
      toast({
        title: 'Error creating subcategory',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingSubcategory(false);
    }
  };

  // Handle keydown events for inline creation of subcategories
  const handleSubcategoryCreateKeyDown = (e: React.KeyboardEvent, categoryId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCreateSubcategory(categoryId);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelCreatingSubcategory();
    }
  };

  // Handle drag end for reordering subcategories
  const handleSubcategoryDragEnd = async (event: DragEndEvent, categoryId: string) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;
    
    // Find the category
    const categoryIndex = categories.findIndex(cat => cat.id === categoryId);
    if (categoryIndex === -1) return;
    
    const category = categories[categoryIndex];
    
    // Find the indices of the dragged item and drop target
    const oldIndex = category.subcategories.findIndex(sub => sub.id === active.id);
    const newIndex = category.subcategories.findIndex(sub => sub.id === over.id);
    
    if (oldIndex === -1 || newIndex === -1) return;

    // Create a copy of the categories array
    const newCategories = [...categories];
    const categoryToUpdate = { ...newCategories[categoryIndex] };
    
    // Create a new array of subcategories with the updated order
    const newSubcategories = [...categoryToUpdate.subcategories];
    const [movedItem] = newSubcategories.splice(oldIndex, 1);
    newSubcategories.splice(newIndex, 0, movedItem);
    
    // Update the subcategories with their new order values
    categoryToUpdate.subcategories = newSubcategories.map((sub, idx) => ({
      ...sub,
      order: idx
    }));
    
    // Update the category in the categories array
    newCategories[categoryIndex] = categoryToUpdate;
    
    // Update local state immediately for responsive UI
    setCategories(newCategories);

    // Persist the new order to the database
    try {
      const supabase = createClient();
      
      // Update each subcategory with its new order value
      const updates = newSubcategories.map((sub, idx) => 
        supabase
          .from('document_subcategories')
          .update({ order: idx })
          .eq('id', sub.id)
      );
      
      await Promise.all(updates);
      
      // Alternatively, could call a batch update API endpoint:
      // await fetch('/api/document-library/subcategories/reorder', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     subcategories: newSubcategories.map((sub, idx) => ({
      //       id: sub.id,
      //       order: idx
      //     }))
      //   })
      // });
      
      toast({
        title: 'Subcategories reordered',
        description: 'The subcategory order has been updated successfully.',
      });
    } catch (error) {
      console.error('Error updating subcategory order:', error);
      
      toast({
        title: 'Error updating order',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
      
      // Revert to the original order if the update fails
      fetchCategories();
    }
  };

  // Create subcategory context value
  const subcategoryContextValue = {
    editingSubcategoryId,
    editSubcategoryName,
    setEditSubcategoryName,
    isEditingSubcategory,
    startEditingSubcategory,
    cancelEditingSubcategory,
    handleUpdateSubcategory,
    handleSubcategoryEditKeyDown,
    openDeleteSubcategoryModal,
    creatingForCategoryId,
    newSubcategoryName,
    setNewSubcategoryName,
    isCreatingSubcategory,
    startCreatingSubcategory,
    cancelCreatingSubcategory,
    handleCreateSubcategory,
    handleSubcategoryCreateKeyDown,
    handleSubcategoryDragEnd,
  };

  return (
    <SubcategoryContext.Provider value={subcategoryContextValue}>
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

        {/* Delete Subcategory Modal */}
        {showDeleteSubcategoryModal && deleteSubcategoryId && (
          <DeleteSubcategoryModal
            open={showDeleteSubcategoryModal}
            onClose={closeDeleteSubcategoryModal}
            subcategoryId={deleteSubcategoryId}
            onDeleteComplete={handleSubcategoryDeleteComplete}
          />
        )}
      </div>
    </SubcategoryContext.Provider>
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
            {/* Expand/collapse button - always show for all categories */}
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

      {/* Subcategories - show when expanded regardless of whether subcategories exist */}
      {isExpanded && (
        <div className="pl-8 mt-2 space-y-2 mb-2">
          {/* Subcategory list with drag and drop - only show if there are subcategories */}
          {hasSubcategories && (
            <SubcategoryList 
              categoryId={id} 
              subcategories={category.subcategories} 
            />
          )}
          
          {/* Add new subcategory button/form - always show */}
          <NewSubcategoryForm categoryId={id} />
        </div>
      )}
    </div>
  );
}

// Subcategory List with Drag and Drop
interface SubcategoryListProps {
  categoryId: string;
  subcategories: Subcategory[];
}

function SubcategoryList({ categoryId, subcategories }: SubcategoryListProps) {
  const { handleSubcategoryDragEnd } = useSubcategoryControls();
  
  // Set up drag sensors for keyboard and pointer events
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  return (
    <DndContext 
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={(event) => handleSubcategoryDragEnd(event, categoryId)}
    >
      <SortableContext 
        items={subcategories.map(sub => sub.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {subcategories.map((subcategory) => (
            <SortableSubcategoryRow
              key={subcategory.id}
              subcategory={subcategory}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

// New Subcategory Form Component
interface NewSubcategoryFormProps {
  categoryId: string;
}

function NewSubcategoryForm({ categoryId }: NewSubcategoryFormProps) {
  const {
    creatingForCategoryId,
    newSubcategoryName,
    setNewSubcategoryName,
    isCreatingSubcategory,
    startCreatingSubcategory,
    cancelCreatingSubcategory,
    handleCreateSubcategory,
    handleSubcategoryCreateKeyDown,
  } = useSubcategoryControls();
  
  const isCreatingForThisCategory = creatingForCategoryId === categoryId;
  
  return (
    <div>
      {isCreatingForThisCategory ? (
        <Card className="overflow-hidden">
          <div className="p-3 text-sm flex items-center justify-between">
            <div className="flex-grow">
              <Input
                value={newSubcategoryName}
                onChange={(e) => setNewSubcategoryName(e.target.value)}
                onBlur={() => {
                  if (newSubcategoryName.trim()) {
                    handleCreateSubcategory(categoryId);
                  } else {
                    cancelCreatingSubcategory();
                  }
                }}
                onKeyDown={(e) => handleSubcategoryCreateKeyDown(e, categoryId)}
                placeholder="New subcategory name"
                className="text-sm h-8"
                autoFocus
              />
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="default" 
                size="sm" 
                onClick={() => handleCreateSubcategory(categoryId)}
                disabled={!newSubcategoryName.trim() || isCreatingSubcategory}
                className="h-7 text-xs px-2"
              >
                {isCreatingSubcategory ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : 'Add'}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={cancelCreatingSubcategory}
                disabled={isCreatingSubcategory}
                className="h-7 text-xs px-2"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => startCreatingSubcategory(categoryId)}
          className="w-full justify-start text-muted-foreground hover:text-foreground"
        >
          <Plus size={14} className="mr-1" />
          Add Subcategory
        </Button>
      )}
    </div>
  );
}

// Sortable Subcategory Row Component
interface SortableSubcategoryRowProps {
  subcategory: Subcategory;
}

function SortableSubcategoryRow({ subcategory }: SortableSubcategoryRowProps) {
  const {
    editingSubcategoryId,
    editSubcategoryName,
    setEditSubcategoryName,
    isEditingSubcategory,
    startEditingSubcategory,
    cancelEditingSubcategory,
    handleUpdateSubcategory,
    handleSubcategoryEditKeyDown,
    openDeleteSubcategoryModal,
  } = useSubcategoryControls();

  const isBeingEdited = editingSubcategoryId === subcategory.id;
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: subcategory.id,
    disabled: isBeingEdited // Disable dragging when being edited
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <Card 
      ref={setNodeRef} 
      style={style} 
      className={`overflow-hidden ${isDragging ? 'shadow-lg' : ''}`}
    >
      <div className="p-3 text-sm flex items-center justify-between">
        <div className="flex items-center flex-grow">
          {!isBeingEdited && (
            <div 
              className="cursor-grab mr-2 flex items-center justify-center p-1 hover:bg-gray-100 rounded"
              {...attributes}
              {...listeners}
            >
              <GripVertical size={14} className="text-gray-400" />
            </div>
          )}
          
          <div className="flex-grow">
            {isBeingEdited ? (
              <Input
                value={editSubcategoryName}
                onChange={(e) => setEditSubcategoryName(e.target.value)}
                onBlur={() => handleUpdateSubcategory(subcategory.id)}
                onKeyDown={(e) => handleSubcategoryEditKeyDown(e, subcategory.id)}
                className="text-sm h-8"
                autoFocus
              />
            ) : (
              <span className="font-medium">{subcategory.name}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isBeingEdited ? (
            <>
              <Button 
                variant="default" 
                size="sm" 
                onClick={() => handleUpdateSubcategory(subcategory.id)}
                disabled={isEditingSubcategory}
                className="h-7 text-xs px-2"
              >
                {isEditingSubcategory ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : 'Save'}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={cancelEditingSubcategory}
                disabled={isEditingSubcategory}
                className="h-7 text-xs px-2"
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="ghost" 
                size="icon"
                className="h-7 w-7"
                onClick={() => startEditingSubcategory(subcategory)}
              >
                <Pencil size={14} />
                <span className="sr-only">Edit {subcategory.name}</span>
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                className="h-7 w-7"
                onClick={() => openDeleteSubcategoryModal(subcategory.id)}
              >
                <Trash size={14} />
                <span className="sr-only">Delete {subcategory.name}</span>
              </Button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}

// Hook to access subcategory operations
function useSubcategoryControls() {
  const context = React.useContext(SubcategoryContext);
  if (!context) {
    throw new Error('useSubcategoryControls must be used within a CategoryManager component');
  }
  return context;
}

// Delete Subcategory Modal Component
interface DeleteSubcategoryModalProps {
  open: boolean;
  onClose: () => void;
  subcategoryId: string;
  onDeleteComplete: () => void;
}

function DeleteSubcategoryModal({
  open,
  onClose,
  subcategoryId,
  onDeleteComplete,
}: DeleteSubcategoryModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [documents, setDocuments] = useState<Array<{ id: string; title: string }>>([]);
  const [subcategoryName, setSubcategoryName] = useState('');
  const [_categoryId, setCategoryId] = useState(''); // Using _ prefix to indicate unused var
  const [availableSubcategories, setAvailableSubcategories] = useState<Array<{ id: string; name: string; order: number }>>([]);
  const [fallbackSubcategoryId, setFallbackSubcategoryId] = useState<string>('');
  const [step, setStep] = useState<'prepare' | 'confirm'>('prepare');
  const [error, setError] = useState<string | null>(null);
  
  // Load documents and subcategory details
  useEffect(() => {
    if (open && subcategoryId) {
      loadDeleteDetails();
    }
  }, [open, subcategoryId]);
  
  const loadDeleteDetails = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/document-library/subcategories/prepare-delete/${subcategoryId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load subcategory details');
      }
      
      const responseData = await response.json() as PrepareDeleteResponse;
      
      if (!responseData.success) {
        throw new Error(responseData.error || 'Failed to load subcategory details');
      }
      
      const { data } = responseData;
      
      setDocuments(data.documents);
      setSubcategoryName(data.subcategory.name);
      setCategoryId(data.subcategory.document_category_id);
      setAvailableSubcategories(data.availableSubcategories);
      
      // Set default fallback subcategory if available
      if (data.availableSubcategories && data.availableSubcategories.length > 0) {
        setFallbackSubcategoryId(data.availableSubcategories[0].id);
      } else {
        setFallbackSubcategoryId('');
      }
      
    } catch (error) {
      console.error('Error loading subcategory delete details:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleConfirmDelete = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/document-library/subcategories/delete/${subcategoryId}/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fallbackSubcategoryId,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete subcategory');
      }
      
      const data = await response.json() as DeleteConfirmResponse;
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to delete subcategory');
      }
      
      toast({
        title: 'Subcategory deleted',
        description: `"${subcategoryName}" has been deleted successfully. ${data.documentsUpdated} document${data.documentsUpdated !== 1 ? 's' : ''} reassigned.`,
      });
      
      onClose();
      onDeleteComplete();
      
    } catch (error) {
      console.error('Error deleting subcategory:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleClose = () => {
    // Reset state on close
    setStep('prepare');
    setError(null);
    onClose();
  };
  
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Delete Subcategory</DialogTitle>
          <DialogDescription>
            {step === 'prepare' && documents.length > 0 ? 
              `This subcategory contains ${documents.length} document${documents.length === 1 ? '' : 's'}. Please select where to move ${documents.length === 1 ? 'it' : 'them'}.` :
              `Are you sure you want to delete "${subcategoryName}"?`
            }
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="py-4 text-center text-red-500">
            <p>{error}</p>
            <Button 
              variant="outline" 
              onClick={loadDeleteDetails} 
              className="mt-4"
              disabled={isLoading}
            >
              Try Again
            </Button>
          </div>
        ) : step === 'prepare' && documents.length > 0 ? (
          <>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Move all documents to:</h3>
                <select
                  value={fallbackSubcategoryId}
                  onChange={(e) => setFallbackSubcategoryId(e.target.value)}
                  className="w-full p-2 border rounded-md text-sm"
                  disabled={availableSubcategories.length === 0}
                >
                  {availableSubcategories.length === 0 ? (
                    <option value="">No other subcategories available</option>
                  ) : (
                    availableSubcategories.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
              
              {documents.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium mb-2">Documents to be moved:</h3>
                  <div className="max-h-40 overflow-y-auto border rounded-md">
                    <ul className="divide-y text-sm">
                      {documents.map((doc) => (
                        <li key={doc.id} className="p-2">
                          {doc.title}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button 
                variant="destructive" 
                onClick={() => setStep('confirm')}
                disabled={documents.length > 0 && !fallbackSubcategoryId}
              >
                Continue
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="py-4">
              <p className="text-center text-muted-foreground">
                This action cannot be undone.
                {documents.length > 0 && (
                  <span className="block mt-2">
                    {documents.length} document{documents.length === 1 ? '' : 's'} will be reassigned.
                  </span>
                )}
              </p>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button 
                variant="destructive" 
                onClick={handleConfirmDelete}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : 'Delete Subcategory'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
} 