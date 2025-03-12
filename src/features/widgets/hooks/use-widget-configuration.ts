// my-app/src/features/widgets/hooks/use-widget-configuration.ts

import { useEffect, useState, useCallback } from 'react';
import { widgetService } from '../services/widget-service';
import { 
  WidgetConfiguration, 
  WidgetConfigData,
  WidgetType,
  RedirectWidgetProps,
  DataVisualizationWidgetProps,
  InteractiveToolWidgetProps,
  EmbedWidgetProps
} from '../types';

// Cache to store configurations
const configCache = new Map<string, { data: WidgetConfiguration, timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

interface UseWidgetConfigurationOptions {
  widgetId: string;
  type: WidgetType | string;
  enabled?: boolean;
}

interface UseWidgetConfigurationResult<T extends WidgetConfigData = WidgetConfigData> {
  configuration: WidgetConfiguration | null;
  configData: T | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Type guard for specific widget configuration data
 */
function isWidgetConfigType<T extends WidgetConfigData>(
  config: unknown,
  requiredFields: (keyof T)[]
): config is T {
  if (!config || typeof config !== 'object') return false;
  
  return requiredFields.every(field => 
    Object.prototype.hasOwnProperty.call(config, field)
  );
}

/**
 * Hook for fetching and managing widget configuration
 */
export function useWidgetConfiguration<T extends WidgetConfigData = WidgetConfigData>({
  widgetId,
  type,
  enabled = true
}: UseWidgetConfigurationOptions): UseWidgetConfigurationResult<T> {
  const [configuration, setConfiguration] = useState<WidgetConfiguration | null>(null);
  const [configData, setConfigData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  
  const fetchConfiguration = useCallback(async (forceFetch: boolean = false) => {
    if (!widgetId || !enabled) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Check cache first
      const cacheKey = `widget_config_${widgetId}`;
      const cachedConfig = configCache.get(cacheKey);
      
      // Use cache if available and not expired and not forced refresh
      if (cachedConfig && !forceFetch && (Date.now() - cachedConfig.timestamp < CACHE_TTL)) {
        setConfiguration(cachedConfig.data);
        setConfigData(cachedConfig.data.config as unknown as T);
        setIsLoading(false);
        return;
      }
      
      // Fetch from API
      const { data, error } = await widgetService.getWidgetConfiguration(widgetId);
      
      if (error) throw error;
      
      if (data) {
        // Update cache
        configCache.set(cacheKey, {
          data,
          timestamp: Date.now()
        });
        
        setConfiguration(data);
        
        // Validate and type the config data based on widget type
        const config = data.config as unknown;
        let typedConfig: T | null = null;
        
        // Type guards for different widget types
        switch (type) {
          case WidgetType.REDIRECT:
            if (isWidgetConfigType<RedirectWidgetProps['configuration']>(config, ['redirectUrl'])) {
              typedConfig = config as unknown as T;
            }
            break;
            
          case WidgetType.DATA_VISUALIZATION:
            if (isWidgetConfigType<DataVisualizationWidgetProps['configuration']>(config, ['dataSource', 'chartType'])) {
              typedConfig = config as unknown as T;
            }
            break;
            
          case WidgetType.INTERACTIVE_TOOL:
            if (isWidgetConfigType<InteractiveToolWidgetProps['configuration']>(config, ['toolType'])) {
              typedConfig = config as unknown as T;
            }
            break;
            
          case WidgetType.EMBED:
            if (isWidgetConfigType<EmbedWidgetProps['configuration']>(config, ['embedUrl'])) {
              typedConfig = config as unknown as T;
            }
            break;
            
          default:
            // For custom widget types or when type checking isn't needed
            if (typeof config === 'object' && config !== null) {
              typedConfig = config as unknown as T;
            }
        }
        
        setConfigData(typedConfig);
      } else {
        setConfiguration(null);
        setConfigData(null);
      }
    } catch (err) {
      console.error(`Error fetching widget configuration for ${widgetId}:`, err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [widgetId, type, enabled]);
  
  // Refetch function for manual refresh
  const refetch = useCallback(async () => {
    await fetchConfiguration(true);
  }, [fetchConfiguration]);
  
  // Initial fetch
  useEffect(() => {
    if (enabled) {
      fetchConfiguration();
    }
  }, [enabled, widgetId, type, fetchConfiguration]);
  
  return { configuration, configData, isLoading, error, refetch };
}

/**
 * Specialized hook for redirect widget configuration
 */
export function useRedirectWidgetConfiguration(options: Omit<UseWidgetConfigurationOptions, 'type'>) {
  return useWidgetConfiguration<RedirectWidgetProps['configuration']>({
    ...options,
    type: WidgetType.REDIRECT
  });
}

/**
 * Specialized hook for data visualization widget configuration
 */
export function useDataVisualizationWidgetConfiguration(options: Omit<UseWidgetConfigurationOptions, 'type'>) {
  return useWidgetConfiguration<DataVisualizationWidgetProps['configuration']>({
    ...options,
    type: WidgetType.DATA_VISUALIZATION
  });
}

/**
 * Specialized hook for interactive tool widget configuration
 */
export function useInteractiveToolWidgetConfiguration(options: Omit<UseWidgetConfigurationOptions, 'type'>) {
  return useWidgetConfiguration<InteractiveToolWidgetProps['configuration']>({
    ...options,
    type: WidgetType.INTERACTIVE_TOOL
  });
}

/**
 * Specialized hook for embed widget configuration
 */
export function useEmbedWidgetConfiguration(options: Omit<UseWidgetConfigurationOptions, 'type'>) {
  return useWidgetConfiguration<EmbedWidgetProps['configuration']>({
    ...options,
    type: WidgetType.EMBED
  });
}