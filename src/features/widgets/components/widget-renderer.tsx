// my-app/src/features/widgets/components/widget-renderer.tsx

import React, { useState, Suspense, useEffect } from 'react';
import { getWidgetComponent } from '../registry';
import { withWidgetBase, DefaultWidget } from './base-widget';
import { BaseWidgetProps, Widget, WidgetConfigData } from '../types';
import { initializeWidgetRegistry } from '../registry/index';

// Loading fallback for lazy-loaded widgets
const WidgetLoadingFallback = () => (
  <div className="p-4 flex items-center justify-center h-full w-full">
    <div className="animate-pulse flex space-x-2">
      <div className="h-2 w-2 bg-gray-300 rounded-full"></div>
      <div className="h-2 w-2 bg-gray-300 rounded-full"></div>
      <div className="h-2 w-2 bg-gray-300 rounded-full"></div>
    </div>
  </div>
);

interface WidgetRendererProps {
  widget: Widget;
  configuration?: any;
  width: number;
  height: number;
  position?: { x: number; y: number };
  onInteraction?: (type: string) => void;
  isLoading?: boolean;
  className?: string;
  style?: React.CSSProperties;
  borderRadius?: string | number;
}

// Context for sharing widget state with child components
export const WidgetContext = React.createContext<{
  widget: Widget;
  configuration?: WidgetConfigData;
  isLoading: boolean;
  setLoading: (isLoading: boolean) => void;
}>({
  widget: {} as Widget,
  isLoading: false,
  setLoading: () => {},
});

/**
 * Component that dynamically renders the appropriate widget based on type
 */
export const WidgetRenderer: React.FC<WidgetRendererProps> = ({
  widget,
  configuration,
  width,
  height,
  position,
  onInteraction,
  isLoading: initialIsLoading = false,
  className = '',
  style = {},
  borderRadius = 0,
}) => {
  const [isLoading, setLoading] = useState(initialIsLoading);
  const [error, setError] = useState<Error | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeRenderer = async () => {
      try {
        await initializeWidgetRegistry();
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize widget renderer:', error);
        setError(error as Error);
      }
    };

    initializeRenderer();
  }, []);

  // Get the component type from the registry based on widget type
  const renderWidget = () => {
    if (!isInitialized) {
      return <WidgetLoadingFallback />;
    }

    try {
      // If there's an error, render the error state
      if (error) {
        return (
          <div className="p-4 bg-red-50 rounded-md border border-red-200">
            <h3 className="text-red-800 font-medium">Widget Error</h3>
            <p className="text-red-600 text-sm">{error.message}</p>
          </div>
        );
      }

      // Get the appropriate component for this widget type
      const WidgetComponent = getWidgetComponent(widget.widget_type);

      // Create the props to pass to the widget
      const widgetProps: BaseWidgetProps = {
        id: widget.id,
        widget,
        configuration,
        width,
        height,
        position,
        onInteraction,
      };

      // Render the wrapped widget component
      return (
        <Suspense fallback={<WidgetLoadingFallback />}>
          <WidgetComponent {...widgetProps} />
        </Suspense>
      );
    } catch (err) {
      console.error('Error rendering widget:', err);
      setError(err instanceof Error ? err : new Error('Unknown error rendering widget'));
      
      // Render the default widget as fallback
      return (
        <DefaultWidget
          id={widget.id}
          widget={widget}
          configuration={configuration}
          width={width}
          height={height}
        />
      );
    }
  };

  return (
    <WidgetContext.Provider value={{ widget, configuration, isLoading, setLoading }}>
      <div 
        className={`widget-renderer ${className}`}
        style={{
          position: 'relative',
          width: width ? `${width}px` : '100%',
          height: height ? `${height}px` : '100%',
          minHeight: '100px',
          borderRadius,
          overflow: 'hidden',
          backgroundColor: 'white',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
          ...style,
        }}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        )}
        {renderWidget()}
      </div>
    </WidgetContext.Provider>
  );
};

// Export a higher-order component version for enhanced functionality
export const EnhancedWidgetRenderer = withWidgetBase(WidgetRenderer, {
  trackAnalytics: true,
  responsiveResize: true,
});

/**
 * Utility function to process dynamic URLs with user data
 * This can be imported and used by widget components that need it
 */
export const processDynamicUrl = (url: string, userData: any) => {
  if (!url || !userData) return url;
  
  let processedUrl = url;
  
  // Define regex to match {{user.field}} patterns
  const placeholderRegex = /\{\{user\.([a-zA-Z_]+)\}\}/g;
  
  // Replace all placeholders with actual user data
  processedUrl = processedUrl.replace(placeholderRegex, (match, field) => {
    const value = userData[field];
    return value ? encodeURIComponent(value) : '';
  });
  
  return processedUrl;
};

// Simple usage example
export default WidgetRenderer; 