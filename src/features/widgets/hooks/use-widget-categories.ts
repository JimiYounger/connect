import { useState, useEffect, useCallback } from 'react';
import { WidgetCategory } from '../types';
import { createClient } from '@/lib/supabase';

interface UseWidgetCategoriesOptions {
  enabled?: boolean;
}

interface UseWidgetCategoriesResult {
  categories: WidgetCategory[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook for fetching widget categories
 */
export function useWidgetCategories({
  enabled = true
}: UseWidgetCategoriesOptions = {}): UseWidgetCategoriesResult {
  const [categories, setCategories] = useState<WidgetCategory[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  
  const fetchCategories = useCallback(async () => {
    if (!enabled) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('widget_categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      setCategories(data || []);
    } catch (err) {
      console.error('Error fetching widget categories:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);
  
  useEffect(() => {
    if (enabled) {
      fetchCategories();
    }
  }, [enabled, fetchCategories]);
  
  return {
    categories,
    isLoading,
    error,
    refetch: fetchCategories
  };
} 