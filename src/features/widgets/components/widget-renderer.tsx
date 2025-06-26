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

// Helper function to check if a widget has a wide ratio (4:1)
const isWideRatioWidget = (width: number, height: number): boolean => {
  return width === 344 && height === 74; // Match the grid size, not 100px height
};

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
  
  // Check if this is a wide ratio widget (4:1)
  const isWideRatio = isWideRatioWidget(width, height);

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
        className={`widget-renderer ${className} ${isWideRatio ? 'wide-ratio-widget' : ''}`}
        style={{
          position: 'relative',
          width: width ? `${width}px` : '100%',
          height: height ? `${height}px` : '100%',
          minHeight: borderRadius === '50%' ? undefined : '74px', // Set to match grid height
          borderRadius,
          overflow: 'hidden',
          backgroundColor: style?.backgroundColor || 'white',
          boxShadow: style?.boxShadow || '0 2px 8px rgba(0, 0, 0, 0.05)',
          ...(borderRadius === '50%' && { aspectRatio: '1/1' }),
          ...(isWideRatio && { 
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '74px', // Force the height to 74px
          }),
          ...style,
        }}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        )}
        <div 
          className={`w-full h-full flex items-center justify-center ${isWideRatio ? 'wide-ratio-content' : ''}`}
          style={{
            // For 4:1 ratio widgets, ensure content is properly sized
            ...(isWideRatio && {
              maxHeight: '74px', // Match grid height
              objectFit: 'contain',
              objectPosition: 'center',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            })
          }}
        >
          {renderWidget()}
        </div>
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