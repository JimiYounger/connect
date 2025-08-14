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

function truncateText(text: string, maxLength = 80): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

function getValueColor(value: string | number | boolean | null): string {
  if (value === null || value === '' || value === 'N/A' || value === 'No response') {
    return 'text-gray-300';
  }
  
  if (typeof value === 'boolean') {
    return value ? 'text-green-300' : 'text-red-300';
  }
  
  if (typeof value === 'number') {
    if (value <= 3) return 'text-red-300';
    if (value <= 6) return 'text-yellow-300';
    if (value >= 7) return 'text-green-300';
    return 'text-white';
  }
  
  return 'text-white';
}

export function HighlightTable({ highlights, className = '' }: HighlightTableProps) {
  if (!highlights.length) {
    return (
      <div className={`text-sm text-gray-400 italic ${className}`}>
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
          const needsTooltip = formattedValue.length > 80;
          const colorClass = getValueColor(item.value);

          const content = (
            <div key={index} className="grid grid-cols-1 gap-1 py-2 px-3 bg-gray-700 rounded-lg border border-gray-500">
              <div className="text-sm font-medium text-white leading-relaxed">
                {truncateText(item.key, 60)}
              </div>
              <div className={`text-sm ${colorClass} font-semibold leading-relaxed`}>
                {truncatedValue}
              </div>
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
                <TooltipContent side="top" className="max-w-md">
                  <div className="text-sm">
                    <div className="font-medium mb-2 text-white">{item.key}</div>
                    <div className="text-gray-300">{formattedValue}</div>
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