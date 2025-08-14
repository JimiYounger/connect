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

function DetailContent({ person }: { person: Person }) {
  if (!person.qa.length) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500">
          <p className="text-lg mb-2">No Survey Responses</p>
          <p className="text-sm">This person hasn&apos;t completed the new hire survey yet.</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full max-h-[70vh]">
      <div className="space-y-4 pr-4">
        <div className="flex items-center gap-2 mb-4">
          <Badge variant="secondary">{person.area}</Badge>
          <span className="text-sm text-gray-500">
            {person.qa.length} responses
          </span>
        </div>

        <div className="space-y-4">
          {person.qa.map((qa, index) => (
            <div key={index} className="border-b border-gray-100 pb-4 last:border-b-0">
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-900 leading-relaxed">
                  {qa.key}
                </h4>
                <div className={`text-sm leading-relaxed ${getValueColor(qa.value)}`}>
                  {formatValue(qa.value)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}

export function PersonDetail({ person, open, onClose }: PersonDetailProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');

  if (!person) return null;

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent side="bottom" className="h-[85vh]">
          <SheetHeader className="pb-4">
            <SheetTitle className="text-left">
              {person.name}
            </SheetTitle>
          </SheetHeader>
          <DetailContent person={person} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>{person.name}</DialogTitle>
        </DialogHeader>
        <DetailContent person={person} />
      </DialogContent>
    </Dialog>
  );
}