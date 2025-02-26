import { 
  Link, 
  BarChart4, 
  ExternalLink, 
  Wrench,
  FileText, 
  Code 
} from 'lucide-react';
import { WidgetType } from '@/features/widgets/types';

/**
 * Get the appropriate icon component for a widget type
 */
export function getWidgetTypeIcon(type: WidgetType) {
  switch (type) {
    case WidgetType.REDIRECT:
      return Link;
    case WidgetType.DATA_VISUALIZATION:
      return BarChart4;
    case WidgetType.EMBED:
      return ExternalLink;
    case WidgetType.INTERACTIVE_TOOL:
      return Wrench;
    case WidgetType.CONTENT:
      return FileText;
    case WidgetType.CUSTOM:
      return Code;
    default:
      return FileText;
  }
}

/**
 * Get a color for a widget type
 */
export function getWidgetTypeColor(type: WidgetType): string {
  switch (type) {
    case WidgetType.REDIRECT:
      return '#3B82F6'; // blue
    case WidgetType.DATA_VISUALIZATION:
      return '#10B981'; // green
    case WidgetType.EMBED:
      return '#6366F1'; // indigo
    case WidgetType.INTERACTIVE_TOOL:
      return '#F59E0B'; // amber
    case WidgetType.CONTENT:
      return '#8B5CF6'; // violet
    case WidgetType.CUSTOM:
      return '#EC4899'; // pink
    default:
      return '#6B7280'; // gray
  }
} 