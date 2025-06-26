// my-app/src/features/widgets/hooks/use-widgets.ts

import { useState, useEffect, useCallback } from 'react';
import { widgetService } from '../services/widget-service';
import type { Widget, WidgetType } from '../types';

interface UseWidgetsOptions {
  userId: string;
  types?: WidgetType[];
  isPublished?: boolean;
  enabled?: boolean;
}

interface UseWidgetsResult {
  widgets: Widget[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>;
  hasMore: boolean;
}

/**
 * Hook for fetching widgets for a user
 */
export function useWidgets({
  userId,
  types,
  isPublished,
  enabled = true
}: UseWidgetsOptions): UseWidgetsResult {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [currentOffset, setCurrentOffset] = useState<number>(0);
  const PAGE_SIZE = 50; // Fetch more widgets at a time for smoother experience
  
  const fetchWidgets = useCallback(async (offsetValue: number = currentOffset, append: boolean = false) => {
    if (!userId || !enabled) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await widgetService.getWidgetsByUser(
        userId,
        {
          types,
          limit: PAGE_SIZE,
          offset: offsetValue,
          isPublished
        }
      );
      
      if (error) throw error;
      
      // Update state based on results
      if (data) {
        setWidgets(prevWidgets => append ? [...prevWidgets, ...data] : data);
        setHasMore(data.length === PAGE_SIZE);
      } else {
        setWidgets(prevWidgets => append ? prevWidgets : []);
        setHasMore(false);
      }
    } catch (err) {
      console.error('Error in useWidgets:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, types, currentOffset, isPublished, enabled]);
  
  // Refetch function for manual refresh
  const refetch = useCallback(async () => {
    setCurrentOffset(0);
    await fetchWidgets(0, false);
  }, [fetchWidgets]);
  
  // Load more function for infinite scroll
  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;
    
    const newOffset = currentOffset + PAGE_SIZE;
    setCurrentOffset(newOffset);
    await fetchWidgets(newOffset, true);
  }, [isLoading, hasMore, currentOffset, fetchWidgets]);
  
  // Initial fetch
  useEffect(() => {
    if (enabled) {
      fetchWidgets(0, false);
    }
  }, [enabled, userId, types, isPublished, fetchWidgets]);
  
  return { widgets, isLoading, error, refetch, hasMore, loadMore };
} 