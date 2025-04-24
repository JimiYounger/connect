// src/features/documentLibrary/hooks/useDocumentFilters.ts

import { useCallback, useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
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

// Default empty arrays for useQuery initialData or placeholders
const EMPTY_CATEGORY_ARRAY: DocumentCategory[] = [];
const EMPTY_SUBCATEGORY_ARRAY: DocumentSubcategory[] = [];
const EMPTY_TAG_ARRAY: DocumentTag[] = [];

// Function to fetch categories
const fetchCategories = async () => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('document_categories')
    .select('*')
    .order('order');
  if (error) {
    console.error('Error fetching categories:', error);
    // For development/testing, provide fallback data if needed
    if (process.env.NODE_ENV === 'development') {
      return [
        { id: 'cat-1', name: 'Energy', order: 1 },
        { id: 'cat-2', name: 'Technology', order: 2 },
        { id: 'cat-3', name: 'Finance', order: 3 },
        { id: 'cat-4', name: 'HR', order: 4 }
      ];
    }
    throw new Error(error.message);
  }
  return data || EMPTY_CATEGORY_ARRAY;
};

// Function to fetch subcategories
const fetchSubcategories = async () => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('document_subcategories')
    .select('*')
    .order('order');
  if (error) {
    console.error('Error fetching subcategories:', error);
    // For development/testing, provide fallback data if needed
    if (process.env.NODE_ENV === 'development') {
      return [
        { id: 'sub-1', name: 'Renewable', document_category_id: 'cat-1', description: null, order: 1 },
        { id: 'sub-2', name: 'Electronics', document_category_id: 'cat-2', description: null, order: 1 },
        { id: 'sub-3', name: 'Investment', document_category_id: 'cat-3', description: null, order: 1 },
        { id: 'sub-4', name: 'Training', document_category_id: 'cat-4', description: null, order: 1 }
      ];
    }
    throw new Error(error.message);
  }
  return data || EMPTY_SUBCATEGORY_ARRAY;
};

// Function to fetch tags
const fetchTags = async () => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('document_tags')
    .select('*')
    .order('name');
  if (error) {
    console.error('Error fetching tags:', error);
     // For development/testing, provide fallback data if needed
     if (process.env.NODE_ENV === 'development') {
       return [
         { id: 'tag-1', name: 'Solar' },
         { id: 'tag-2', name: 'Inverter' },
         { id: 'tag-3', name: 'Energy' },
         { id: 'tag-4', name: 'Important' },
         { id: 'tag-5', name: 'Draft' }
       ];
     }
    throw new Error(error.message);
  }
  return data || EMPTY_TAG_ARRAY;
};

export function useDocumentFilters() {
  // Use React Query to fetch and cache data
  const results = useQueries({
    queries: [
      { 
        queryKey: ['documentCategories'], 
        queryFn: fetchCategories,
        staleTime: 15 * 60 * 1000, // Cache for 15 minutes
        refetchOnWindowFocus: false, // Don't refetch just because window regained focus
        retry: 1, // Retry once on error
      },
      { 
        queryKey: ['documentSubcategories'], 
        queryFn: fetchSubcategories,
        staleTime: 15 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
      { 
        queryKey: ['documentTags'], 
        queryFn: fetchTags,
        staleTime: 15 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    ]
  });

  const categoriesQuery = results[0];
  const subcategoriesQuery = results[1];
  const tagsQuery = results[2];

  // Extract data, defaulting to empty arrays if data is not yet available
  const categories = useMemo(() => categoriesQuery.data ?? EMPTY_CATEGORY_ARRAY, [categoriesQuery.data]);
  const subcategories = useMemo(() => subcategoriesQuery.data ?? EMPTY_SUBCATEGORY_ARRAY, [subcategoriesQuery.data]);
  const tags = useMemo(() => tagsQuery.data ?? EMPTY_TAG_ARRAY, [tagsQuery.data]);

  // Combine loading states
  const loading = useMemo(() => results.some(query => query.isLoading), [results]);

  // Combine error states - find the first error
  const error = useMemo(() => results.find(query => query.isError)?.error as Error | null ?? null, [results]);

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

  return {
    categories,
    subcategories,
    tags,
    getSubcategoriesForCategory,
    loading,
    error,
  };
}