'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMediaQuery } from '@/hooks/useMediaQuery';
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
      <div className="flex items-center gap-3 pb-4 border-b border-gray-600 flex-shrink-0">
        <Badge variant="outline" className="text-sm px-3 py-1.5 font-medium border-gray-500 text-gray-200">
          {person.area}
        </Badge>
        <span className="text-sm text-gray-300 font-medium">
          {person.qa.length} survey responses
        </span>
      </div>

      <ScrollArea className="flex-1 mt-5">
        <div className="space-y-4 pr-2 pb-4">
          {person.qa.map((qa, index) => (
            <div key={index} className="bg-gray-700 rounded-xl p-4 border border-gray-500 shadow-sm">
              <div className="space-y-3">
                <h4 className="text-base font-semibold text-white leading-relaxed">
                  {qa.key}
                </h4>
                <div className={`text-base leading-relaxed font-semibold px-4 py-3 rounded-lg bg-gray-800 border border-gray-500 ${getValueColor(qa.value)}`}>
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

  if (!person) return null;

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent side="bottom" className="h-[92vh] px-5 pb-4 flex flex-col bg-black text-white">
          <SheetHeader className="pb-5 border-b border-gray-600 flex-shrink-0 pt-2">
            <SheetTitle className="text-left text-2xl font-bold text-white leading-tight">
              {person.name}
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 mt-5 min-h-0">
            <DetailContent person={person} />
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