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
import { Loader2, Pencil, Trash, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Category {
  id: string;
  name: string;
  documentCount?: number;
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

  // Fetch categories and document counts
  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const supabase = createClient();
      
      // Get all categories
      const { data: categories, error: categoriesError } = await supabase
        .from('document_categories')
        .select('id, name')
        .order('name');
        
      if (categoriesError) throw categoriesError;
      
      // For each category, get document count
      const enrichedCategories = await Promise.all(
        categories.map(async (category) => {
          const { count, error: countError } = await supabase
            .from('documents')
            .select('id', { count: 'exact', head: true })
            .eq('document_category_id', category.id);
            
          if (countError) {
            console.error(`Error fetching count for category ${category.id}:`, countError);
            return { ...category, documentCount: 0 };
          }
          
          return { ...category, documentCount: count || 0 };
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
        <div className="space-y-4">
          {categories.map((category) => (
            <Card key={category.id} className="overflow-hidden">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4 flex-grow">
                  {editingCategoryId === category.id ? (
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
                
                <div className="flex items-center gap-2">
                  {editingCategoryId === category.id ? (
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
          ))}
        </div>
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