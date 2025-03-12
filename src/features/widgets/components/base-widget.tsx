// my-appsrc/features/widgets/components/base-widget.tsx

import React, { ErrorInfo, useState, useEffect } from 'react';
import { BaseWidgetProps } from '../types';

// Error boundary for catching widget rendering errors
class WidgetErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode; onError?: (error: Error) => void },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode; onError?: (error: Error) => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Widget rendering error:', error, errorInfo);
    this.props.onError?.(error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 bg-red-50 rounded-md border border-red-200">
          <h3 className="text-red-800 font-medium">Widget Error</h3>
          <p className="text-red-600 text-sm">{this.state.error?.message || 'An error occurred'}</p>
        </div>
      );
    }

    return this.props.children;
  }
}

interface WidgetWrapperProps {
  className?: string;
  style?: React.CSSProperties;
  isLoading?: boolean;
  children: React.ReactNode;
}

// Basic styling wrapper for widgets
const WidgetWrapper: React.FC<WidgetWrapperProps> = ({ 
  className = '', 
  style = {}, 
  isLoading = false,
  children 
}) => {
  const baseClasses = 'widget-container overflow-hidden transition-all';
  const combinedClasses = `${baseClasses} ${className}`;

  return (
    <div className={combinedClasses} style={style}>
      {isLoading ? (
        <div className="p-4 flex items-center justify-center h-full w-full">
          <div className="animate-pulse flex space-x-2">
            <div className="h-2 w-2 bg-gray-300 rounded-full"></div>
            <div className="h-2 w-2 bg-gray-300 rounded-full"></div>
            <div className="h-2 w-2 bg-gray-300 rounded-full"></div>
          </div>
        </div>
      ) : (
        children
      )}
    </div>
  );
};

// Higher-order component to enhance widgets with common functionality
export function withWidgetBase<T extends BaseWidgetProps>(
  WrappedComponent: React.ComponentType<T>,
  config?: {
    trackAnalytics?: boolean;
    responsiveResize?: boolean;
    fallbackComponent?: React.ComponentType<BaseWidgetProps>;
  }
) {
  const BaseWidget: React.FC<T> = (props) => {
    const [isLoading, _setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [widgetSize, setWidgetSize] = useState({ width: props.width, height: props.height });

    // Track interactions for analytics
    const handleInteraction = (type: string) => {
      if (config?.trackAnalytics) {
        // Track the interaction in analytics system
        console.log(`Widget interaction: ${type}`, { widgetId: props.id, widgetType: props.widget.widget_type });
      }
      
      // Call the original handler if provided
      props.onInteraction?.(type);
    };

    // Responsive resize handler
    useEffect(() => {
      if (!config?.responsiveResize) return;

      const handleResize = () => {
        // Implement responsive sizing logic here
        // This is a simplified example
        const isMobile = window.innerWidth < 768;
        if (isMobile) {
          setWidgetSize({ width: window.innerWidth - 32, height: props.height });
        } else {
          setWidgetSize({ width: props.width, height: props.height });
        }
      };

      window.addEventListener('resize', handleResize);
      handleResize(); // Initial size
      
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }, [props.width, props.height]);

    // Handle error
    const handleError = (error: Error) => {
      setError(error);
      console.error('Widget error:', error);
    };

    // Apply custom styling based on configuration
    const getCustomStyle = (): React.CSSProperties => {
      const baseStyle: React.CSSProperties = {
        width: `${widgetSize.width}px`,
        height: `${widgetSize.height}px`,
      };

      // Apply custom styles from widget configuration
      if (props.configuration?.styles) {
        const { styles } = props.configuration;
        if (styles.backgroundColor) baseStyle.backgroundColor = styles.backgroundColor;
        if (styles.borderRadius) baseStyle.borderRadius = styles.borderRadius;
        if (styles.padding) baseStyle.padding = styles.padding;
      }

      return baseStyle;
    };

    // Decide what component to render
    const renderContent = () => {
      if (error && config?.fallbackComponent) {
        const FallbackComponent = config.fallbackComponent;
        return <FallbackComponent {...props} />;
      }

      return (
        <WrappedComponent 
          {...props} 
          width={widgetSize.width}
          height={widgetSize.height}
          onInteraction={handleInteraction}
        />
      );
    };

    return (
      <WidgetErrorBoundary onError={handleError}>
        <WidgetWrapper 
          className={props.widget.widget_type}
          style={getCustomStyle()}
          isLoading={isLoading}
        >
          {renderContent()}
        </WidgetWrapper>
      </WidgetErrorBoundary>
    );
  };

  // Display name for debugging
  BaseWidget.displayName = `withWidgetBase(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;
  
  return BaseWidget;
}

// Default fallback widget component
export const DefaultWidget: React.FC<BaseWidgetProps> = ({ widget, configuration }) => {
  return (
    <div className="flex flex-col h-full w-full p-4">
      <h3 className="text-lg font-semibold mb-2">{configuration?.title || widget.name}</h3>
      {configuration?.description && (
        <p className="text-sm text-gray-600">{configuration.description}</p>
      )}
    </div>
  );
};

// Pre-configured HOC for common use cases
export const withStandardWidget = <T extends BaseWidgetProps>(
  WrappedComponent: React.ComponentType<T>
) => withWidgetBase(WrappedComponent, {
  trackAnalytics: true,
  responsiveResize: true,
  fallbackComponent: DefaultWidget
}); 