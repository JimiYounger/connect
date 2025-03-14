import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, AlertTriangle } from 'lucide-react';

interface SegmentCounterProps {
  segmentCount: number;
  characterCount: number;
  remainingCharacters: number;
  isOverLimit: boolean;
  maxSegments?: number;
}

export function SegmentCounter({
  segmentCount,
  characterCount,
  remainingCharacters,
  isOverLimit,
  maxSegments = 10
}: SegmentCounterProps) {
  // Determine color based on segment count and limits
  const getStatusColor = () => {
    if (isOverLimit) return 'text-red-500';
    if (segmentCount > maxSegments * 0.8) return 'text-amber-500';
    if (segmentCount > 1) return 'text-blue-500';
    return 'text-green-500';
  };
  
  // Get descriptive text for tooltip
  const getSegmentDescription = () => {
    if (isOverLimit) {
      return 'Message is too long and cannot be sent';
    }
    
    if (segmentCount === 1) {
      return `Single segment message (${remainingCharacters} characters remaining)`;
    }
    
    if (segmentCount > maxSegments) {
      return `Warning: Message will be split into ${segmentCount} segments, which exceeds the recommended maximum of ${maxSegments}`;
    }
    
    return `Message will be split into ${segmentCount} segments`;
  };
  
  // Get cost estimation text
  const getCostEstimation = () => {
    if (isOverLimit) return 'Cannot send';
    
    const costPerSegment = 0.0079; // Example cost per segment in USD
    const totalCost = (segmentCount * costPerSegment).toFixed(4);
    
    return `Estimated cost: $${totalCost} USD`;
  };
  
  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5 text-xs font-medium">
            <Badge 
              variant={isOverLimit ? 'destructive' : 'outline'} 
              className={`${getStatusColor()} flex items-center gap-1 py-0 h-5`}
            >
              {isOverLimit ? (
                <AlertTriangle className="h-3 w-3" />
              ) : (
                <MessageSquare className="h-3 w-3" />
              )}
              <span>
                {characterCount}/{isOverLimit ? 'Limit exceeded' : `${segmentCount} segment${segmentCount > 1 ? 's' : ''}`}
              </span>
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-2 text-sm">
            <p>{getSegmentDescription()}</p>
            <p className="text-xs text-muted-foreground">{getCostEstimation()}</p>
            <div className="text-xs">
              <p>Character count: {characterCount}</p>
              {!isOverLimit && <p>Characters remaining in current segment: {remainingCharacters}</p>}
            </div>
            <p className="text-xs text-muted-foreground">
              SMS messages are split into segments of 160 characters (or 70 for messages with special characters).
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
} 