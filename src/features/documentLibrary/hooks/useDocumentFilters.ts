// src/features/documentLibrary/hooks/useDocumentFilters.ts

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';

// Types for our filter data
export interface DocumentCategory {
  id: string;
  name: string;
  order: number;
}

export interface DocumentSubcategory {
  id: string;
  name: string;
  document_category_id: string;
  description: string | null;
  order: number | null;
}

export interface DocumentTag {
  id: string;
  name: string;
}

export function useDocumentFilters() {
  // State for our filter data
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [subcategories, setSubcategories] = useState<DocumentSubcategory[]>([]);
  const [tags, setTags] = useState<DocumentTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Function to get subcategories for a specific category
  const getSubcategoriesForCategory = useCallback(
    (categoryId: string) => {
      if (categoryId === 'all') {
        return subcategories;
      }
      return subcategories.filter(
        (subcat) => subcat.document_category_id === categoryId
      );
    },
    [subcategories]
  );

  // Load data on component mount
  useEffect(() => {
    const fetchFilterData = async () => {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();

        // Fetch categories
        const { data: categoryData, error: categoryError } = await supabase
          .from('document_categories')
          .select('*')
          .order('order');

        if (categoryError) {
          console.error('Error fetching categories:', categoryError);
          // For development/testing, provide fallback data if needed
          if (process.env.NODE_ENV === 'development') {
            setCategories([
              { id: 'cat-1', name: 'Energy', order: 1 },
              { id: 'cat-2', name: 'Technology', order: 2 },
              { id: 'cat-3', name: 'Finance', order: 3 },
              { id: 'cat-4', name: 'HR', order: 4 }
            ]);
          } else {
            throw new Error(categoryError.message);
          }
        } else {
          setCategories(categoryData || []);
        }

        // Fetch subcategories
        const { data: subcategoryData, error: subcategoryError } = await supabase
          .from('document_subcategories')
          .select('*')
          .order('order');

        if (subcategoryError) {
          console.error('Error fetching subcategories:', subcategoryError);
          // For development/testing, provide fallback data if needed
          if (process.env.NODE_ENV === 'development') {
            setSubcategories([
              { id: 'sub-1', name: 'Renewable', document_category_id: 'cat-1', description: null, order: 1 },
              { id: 'sub-2', name: 'Electronics', document_category_id: 'cat-2', description: null, order: 1 },
              { id: 'sub-3', name: 'Investment', document_category_id: 'cat-3', description: null, order: 1 },
              { id: 'sub-4', name: 'Training', document_category_id: 'cat-4', description: null, order: 1 }
            ]);
          } else {
            throw new Error(subcategoryError.message);
          }
        } else {
          setSubcategories(subcategoryData || []);
        }

        // Fetch tags
        const { data: tagData, error: tagError } = await supabase
          .from('document_tags')
          .select('*')
          .order('name');

        if (tagError) {
          console.error('Error fetching tags:', tagError);
          // For development/testing, provide fallback data if needed
          if (process.env.NODE_ENV === 'development') {
            setTags([
              { id: 'tag-1', name: 'Solar' },
              { id: 'tag-2', name: 'Inverter' },
              { id: 'tag-3', name: 'Energy' },
              { id: 'tag-4', name: 'Important' },
              { id: 'tag-5', name: 'Draft' }
            ]);
          } else {
            throw new Error(tagError.message);
          }
        } else {
          setTags(tagData || []);
        }
      } catch (err) {
        console.error('Error fetching document filters:', err);
        setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      } finally {
        setLoading(false);
      }
    };

    fetchFilterData();
  }, []);

  return {
    categories,
    subcategories,
    tags,
    getSubcategoriesForCategory,
    loading,
    error,
  };
}