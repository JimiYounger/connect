'use client';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { ParsedQA } from '../lib/types';

interface HighlightTableProps {
  highlights: ParsedQA[];
  className?: string;
}

function formatValue(value: string | number | boolean | null): string {
  if (value === null || value === undefined) return 'No response';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') {
    if (!value.trim()) return 'No response';
    return value;
  }
  return String(value);
}

function truncateText(text: string, maxLength = 40): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

function getValueColor(value: string | number | boolean | null): string {
  if (value === null || value === '' || value === 'N/A' || value === 'No response') {
    return 'text-gray-400';
  }
  
  if (typeof value === 'boolean') {
    return value ? 'text-green-600' : 'text-red-500';
  }
  
  if (typeof value === 'number') {
    if (value <= 3) return 'text-red-500';
    if (value <= 6) return 'text-yellow-600';
    if (value >= 7) return 'text-green-600';
    return 'text-gray-700';
  }
  
  return 'text-gray-700';
}

export function HighlightTable({ highlights, className = '' }: HighlightTableProps) {
  if (!highlights.length) {
    return (
      <div className={`text-sm text-gray-500 italic ${className}`}>
        No survey responses yet
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className={`space-y-2 ${className}`}>
        {highlights.map((item, index) => {
          const formattedValue = formatValue(item.value);
          const truncatedValue = truncateText(formattedValue);
          const needsTooltip = formattedValue.length > 40;
          const colorClass = getValueColor(item.value);

          const content = (
            <div key={index} className="flex justify-between items-start gap-2 text-xs">
              <span className="font-medium text-gray-600 flex-shrink-0 min-w-0 break-words">
                {truncateText(item.key, 25)}:
              </span>
              <span className={`${colorClass} text-right flex-shrink-0 min-w-0 break-words`}>
                {truncatedValue}
              </span>
            </div>
          );

          if (needsTooltip) {
            return (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <div className="cursor-help">
                    {content}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <div className="text-sm">
                    <div className="font-medium mb-1">{item.key}</div>
                    <div>{formattedValue}</div>
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          }

          return content;
        })}
      </div>
    </TooltipProvider>
  );
}