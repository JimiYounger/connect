// my-app/src/features/widgets/hooks/use-widgets.ts

import { useState, useEffect, useCallback } from 'react';
import { widgetService } from '../services/widget-service';
import type { Widget, WidgetType } from '../types';

interface UseWidgetsOptions {
  userId: string;
  types?: WidgetType[];
  limit?: number;
  offset?: number;
  isPublished?: boolean;
  enabled?: boolean;
}

interface UseWidgetsResult {
  widgets: Widget[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  hasMore: boolean;
  loadMore: () => Promise<void>;
}

/**
 * Hook for fetching widgets for a user
 */
export function useWidgets({
  userId,
  types,
  limit = 10,
  offset = 0,
  isPublished,
  enabled = true
}: UseWidgetsOptions): UseWidgetsResult {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [currentOffset, setCurrentOffset] = useState<number>(offset);
  
  const fetchWidgets = useCallback(async (offsetValue: number = currentOffset, append: boolean = false) => {
    if (!userId || !enabled) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await widgetService.getWidgetsByUser(
        userId,
        {
          types,
          limit,
          offset: offsetValue,
          isPublished
        }
      );
      
      if (error) throw error;
      
      // Update state based on results
      if (data) {
        setWidgets(prevWidgets => append ? [...prevWidgets, ...data] : data);
        setHasMore(data.length === limit);
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
  }, [userId, types, limit, currentOffset, isPublished, enabled]);
  
  // Refetch function for manual refresh
  const refetch = useCallback(async () => {
    await fetchWidgets(offset, false);
  }, [fetchWidgets, offset]);
  
  // Load more function for pagination
  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;
    
    const newOffset = currentOffset + limit;
    setCurrentOffset(newOffset);
    await fetchWidgets(newOffset, true);
  }, [isLoading, hasMore, currentOffset, limit, fetchWidgets]);
  
  // Initial fetch
  useEffect(() => {
    if (enabled) {
      fetchWidgets(offset, false);
    }
  }, [enabled, userId, types, limit, offset, isPublished, fetchWidgets]);
  
  return { widgets, isLoading, error, refetch, hasMore, loadMore };
} 