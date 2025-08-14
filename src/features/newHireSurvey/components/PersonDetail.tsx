'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useState } from 'react';
import type { Person } from '../lib/types';

interface PersonDetailProps {
  person: Person | null;
  open: boolean;
  onClose: () => void;
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

function DetailContent({ person }: { person: Person }) {
  if (!person.qa.length) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400">
          <p className="text-xl font-medium mb-3 text-white">No Survey Responses</p>
          <p className="text-base">This person hasn&apos;t completed the new hire survey yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-center gap-3 pb-4 border-b border-gray-600 flex-shrink-0">
        <Badge variant="outline" className="text-sm px-3 py-1.5 font-medium border-gray-500 text-gray-200">
          {person.area}
        </Badge>
        <span className="text-sm text-gray-300 font-medium">
          {person.qa.length} survey responses
        </span>
      </div>

      <ScrollArea className="flex-1 mt-5" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}>
        <div className="space-y-3 pr-2 pb-6">
          {person.qa.map((qa, index) => (
            <div key={index} className="bg-gray-700 rounded-lg p-3 border border-gray-500 shadow-sm touch-manipulation">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-white leading-relaxed">
                  {qa.key}
                </h4>
                <div className={`text-sm leading-relaxed font-semibold px-3 py-2 rounded-md bg-gray-800 border border-gray-500 ${getValueColor(qa.value)}`}>
                  {formatValue(qa.value)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

export function PersonDetail({ person, open, onClose }: PersonDetailProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [startY, setStartY] = useState<number | null>(null);

  // Add swipe-to-close functionality for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!startY) return;
    
    const currentY = e.touches[0].clientY;
    const diffY = currentY - startY;
    
    // Close modal if swiped down more than 100px
    if (diffY > 100) {
      onClose();
      setStartY(null);
    }
  };

  const handleTouchEnd = () => {
    setStartY(null);
  };

  if (!person) return null;

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent 
          side="bottom" 
          className="h-[85vh] px-0 pb-safe-bottom flex flex-col bg-black text-white border-t border-gray-600 [&>button]:top-6 [&>button]:right-6 [&>button]:w-10 [&>button]:h-10 [&>button]:bg-gray-700 [&>button]:hover:bg-gray-600 [&>button]:border [&>button]:border-gray-500 [&>button]:rounded-full [&>button]:z-10"
          style={{
            paddingTop: 'max(1rem, env(safe-area-inset-top))',
            paddingBottom: 'max(1rem, env(safe-area-inset-bottom))'
          }}
        >
          <div className="px-4 flex flex-col h-full">
            <SheetHeader 
              className="pb-4 border-b border-gray-600 flex-shrink-0 pt-1"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div className="w-12 h-1 bg-gray-500 rounded-full mx-auto mb-2 touch-none"></div>
              <SheetTitle className="text-center text-xl font-bold text-white leading-tight pr-8">
                {person.name}
              </SheetTitle>
            </SheetHeader>
            <div className="flex-1 mt-4 min-h-0 overflow-hidden">
              <DetailContent person={person} />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-6 flex flex-col bg-black text-white border border-gray-600">
        <DialogHeader className="pb-6 border-b border-gray-600 flex-shrink-0">
          <DialogTitle className="text-2xl font-bold text-white">
            {person.name}
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 mt-6 min-h-0">
          <DetailContent person={person} />
        </div>
      </DialogContent>
    </Dialog>
  );
}