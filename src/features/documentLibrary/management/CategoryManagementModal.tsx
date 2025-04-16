import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Pencil } from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamically import the Categories page to avoid SSR issues
const CategoriesPage = dynamic(
  () => import('@/app/(auth)/admin/document-library/categories/page'),
  { ssr: false }
);

interface CategoryManagementModalProps {
  type: 'categories' | 'subcategories';
  className?: string;
}

export function CategoryManagementModal({ type, className }: CategoryManagementModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Close handler to use when category operations complete
  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className={`h-6 w-6 p-0 opacity-70 hover:opacity-100 hover:bg-transparent ${className || ''}`}
        >
          <Pencil size={14} />
          <span className="sr-only">Manage {type}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            Manage {type === 'categories' ? 'Categories' : 'Subcategories'}
          </DialogTitle>
          <DialogDescription>
            {type === 'categories' 
              ? 'Create, edit, and organize document categories' 
              : 'Manage subcategories within your document categories'}
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-auto flex-1 -mx-6 px-6 pb-6">
          <CategoriesPage />
        </div>
      </DialogContent>
    </Dialog>
  );
} 