// my-app/src/features/widgets/registry/widget-registry.tsx

import React from 'react';
import { 
  WidgetType,
  BaseWidgetProps,
  RedirectWidgetProps,
  DataVisualizationWidgetProps,
  InteractiveToolWidgetProps,
  EmbedWidgetProps
} from '../types';

/**
 * A registry of widget components by type
 */
type WidgetComponentRegistry = {
  [WidgetType.REDIRECT]?: React.ComponentType<RedirectWidgetProps>;
  [WidgetType.DATA_VISUALIZATION]?: React.ComponentType<DataVisualizationWidgetProps>;
  [WidgetType.INTERACTIVE_TOOL]?: React.ComponentType<InteractiveToolWidgetProps>;
  [WidgetType.EMBED]?: React.ComponentType<EmbedWidgetProps>;
  [WidgetType.CONTENT]?: React.ComponentType<BaseWidgetProps>;
  [WidgetType.CUSTOM]?: React.ComponentType<BaseWidgetProps>;
  [key: string]: React.ComponentType<any> | undefined;
};

/**
 * Default widget component to render when a specific type is not found
 */
const DefaultWidgetComponent: React.FC<BaseWidgetProps> = ({ widget, configuration }) => {
  return (
    <div className="p-4 border border-gray-200 bg-gray-50 rounded-md">
      <h3 className="text-lg font-semibold">{configuration?.title || widget.name}</h3>
      <p className="text-sm text-gray-500">Widget type not found: {widget.widget_type}</p>
      {configuration?.description && (
        <p className="mt-2 text-xs text-gray-400">{configuration.description}</p>
      )}
    </div>
  );
};

/**
 * Widget Registry class to manage widget components
 */
export class WidgetRegistry {
  private static instance: WidgetRegistry;
  private registry: WidgetComponentRegistry = {};
  private defaultComponent: React.ComponentType<BaseWidgetProps> = DefaultWidgetComponent;
  private initialized: boolean = false;

  /**
   * Get the singleton instance of WidgetRegistry
   */
  public static getInstance(): WidgetRegistry {
    if (!WidgetRegistry.instance) {
      WidgetRegistry.instance = new WidgetRegistry();
    }
    return WidgetRegistry.instance;
  }

  /**
   * Initialize the widget registry
   */
  public async initialize() {
    if (this.initialized) return;
    
    try {
      // Add any default registrations here
      this.register(WidgetType.CONTENT, DefaultWidgetComponent);
      
      // Mark as initialized
      this.initialized = true;
      console.log('Widget registry initialized');
    } catch (error) {
      console.error('Failed to initialize widget registry:', error);
      throw error;
    }
  }

  /**
   * Register a component for a specific widget type
   */
  public register<T extends BaseWidgetProps>(
    type: WidgetType | string,
    component: React.ComponentType<T>
  ): void {
    if (!type) {
      console.warn('Attempted to register widget with no type');
      return;
    }
    
    this.registry[type] = component;
    console.log(`Registered widget component for type: ${type}`);
  }

  /**
   * Get a component for a specific widget type
   */
  public getComponent<T extends BaseWidgetProps>(type: WidgetType | string): React.ComponentType<T> {
    if (!this.initialized) {
      console.warn('Widget registry accessed before initialization');
    }
    
    const component = this.registry[type];
    if (!component) {
      console.warn(`No component registered for widget type: ${type}`);
      return this.defaultComponent as unknown as React.ComponentType<T>;
    }
    
    return component as React.ComponentType<T>;
  }

  /**
   * Set a default component to use when a type is not found
   */
  public setDefaultComponent(component: React.ComponentType<BaseWidgetProps>): void {
    this.defaultComponent = component;
  }

  /**
   * Check if a component is registered for a specific type
   */
  public hasComponent(type: WidgetType | string): boolean {
    return !!this.registry[type];
  }

  /**
   * Get all registered widget types
   */
  public getRegisteredTypes(): string[] {
    return Object.keys(this.registry);
  }

  /**
   * Clear all registered components
   */
  public clear(): void {
    this.registry = {};
  }
} 