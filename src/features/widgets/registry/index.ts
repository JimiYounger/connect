// my-app/src/features/widgets/registry/index.ts

import { WidgetRegistry } from './widget-registry';
import type { BaseWidgetProps } from '../types';

// Create and export the singleton instance
export const widgetRegistry = WidgetRegistry.getInstance();

// Export the class for advanced usage
export { WidgetRegistry };

// Convenience function to register a widget component
export function registerWidget<T extends BaseWidgetProps>(
  type: string, 
  component: React.ComponentType<T>
): void {
  widgetRegistry.register(type, component);
}

// Export the function to get a widget component
export const getWidgetComponent = (type: string) => {
  return widgetRegistry.getComponent(type);
}; 