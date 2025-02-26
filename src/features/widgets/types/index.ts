// my-app/src/features/widgets/types/index.ts

import type { Tables } from "@/types/supabase";

// Basic widget data types from the database
export type Widget = Tables<"widgets"> & {
  is_public?: boolean | null;
  is_published?: boolean | null;
  is_active?: boolean | null;
  public?: boolean | null;
  created_by?: string | null;
};
export type WidgetConfiguration = Tables<"widget_configurations">;
export type WidgetCategory = Tables<"widget_categories">;

/**
 * Enum for all possible widget types
 */
export enum WidgetType {
  REDIRECT = "redirect",
  DATA_VISUALIZATION = "data_visualization",
  INTERACTIVE_TOOL = "interactive_tool",
  CONTENT = "content",
  EMBED = "embed",
  CUSTOM = "custom"
}

/**
 * Enum for display types - must match database constraints
 */
export enum WidgetDisplayType {
  IFRAME = "iframe",
  WINDOW = "window",
  ROUTE = "route"
}

/**
 * Widget shapes
 */
export enum WidgetShape {
  SQUARE = "square",
  RECTANGLE = "rectangle",
  CIRCLE = "circle"
}

/**
 * Size ratio options
 */
export type WidgetSizeRatio = "1:1" | "2:1" | "1:2" | "3:2" | "2:3" | "4:3" | "3:4";

/**
 * Widget configuration interface
 * This is the structure of the JSON stored in the config field of widget_configurations
 */
export interface WidgetConfigData {
  // Common configuration options
  title?: string;
  subtitle?: string;
  description?: string;
  theme?: string;
  color?: string;
  icon?: string;
  
  // Type-specific configurations
  redirectUrl?: string;
  embedUrl?: string;
  dataSource?: string;
  refreshInterval?: number;
  
  // Custom settings (type dependent)
  settings?: Record<string, unknown>;
  
  // Visual customization
  styles?: {
    backgroundColor?: string;
    titleColor?: string;
    borderRadius?: string;
    padding?: string;
    [key: string]: string | undefined;
  };
}

/**
 * Widget placement data with optional configuration
 */
export type WidgetPlacementWithConfig = WidgetPlacement & {
  widget: Widget;
  configuration?: WidgetConfigData;
};

/**
 * Draft widget placement with optional configuration
 */
export type DraftWidgetPlacementWithConfig = DraftWidgetPlacement & {
  widget: Widget;
  configuration?: WidgetConfigData;
};

/**
 * Props passed to all widget components
 */
export interface BaseWidgetProps {
  id: string;
  widget: Widget;
  configuration?: WidgetConfigData;
  width: number;
  height: number;
  position?: {
    x: number;
    y: number;
  };
  onInteraction?: (type: string) => void;
}

/**
 * Specialized props for redirect widgets
 */
export interface RedirectWidgetProps extends BaseWidgetProps {
  configuration: WidgetConfigData & {
    redirectUrl: string;
  };
}

/**
 * Specialized props for data visualization widgets
 */
export interface DataVisualizationWidgetProps extends BaseWidgetProps {
  configuration: WidgetConfigData & {
    dataSource: string;
    refreshInterval?: number;
    chartType?: 'bar' | 'line' | 'pie' | 'scatter' | 'table';
  };
}

/**
 * Specialized props for interactive tool widgets
 */
export interface InteractiveToolWidgetProps extends BaseWidgetProps {
  configuration: WidgetConfigData & {
    toolType: string;
    settings: Record<string, unknown>;
  };
}

/**
 * Specialized props for embed widgets
 */
export interface EmbedWidgetProps extends BaseWidgetProps {
  configuration: WidgetConfigData & {
    embedUrl: string;
    allowFullscreen?: boolean;
  };
}

/**
 * Type guard to check if a widget is a specific type
 */
export function isWidgetType(
  widget: Widget,
  type: WidgetType
): widget is Widget & { widget_type: typeof type } {
  return widget.widget_type === type;
}

/**
 * Published widget placement type
 */
export type PublishedWidgetPlacement = {
  created_at: string | null;
  dashboard_version_id: string;
  height: number;
  id: string;
  layout_type: string;
  position_x: number;
  position_y: number;
  widget_id: string;
  width: number;
};

/**
 * Draft widget placement type
 */
export type DraftWidgetPlacement = {
  created_at: string | null;
  draft_id: string;
  height: number;
  id: string;
  layout_type: string;
  position_x: number;
  position_y: number;
  widget_id: string;
  width: number;
};

/**
 * Union type for widget placements that can be either published or draft
 */
export type WidgetPlacement = PublishedWidgetPlacement | DraftWidgetPlacement; 