import { Metadata } from 'next';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { ContactsDirectory } from '@/features/contacts/components/ContactsDirectory';

export const metadata: Metadata = {
  title: 'Team Directory',
  description: 'View and filter team contacts by department, name, or tag',
};

export default function ContactsDirectoryPage() {
  return (
    <div className="container mx-auto py-6 px-4 md:py-8 md:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Team Directory</h1>
        <p className="text-slate-600">
          Find and connect with team members across all departments
        </p>
      </div>
      
      <Suspense fallback={
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }>
        <ContactsDirectory />
      </Suspense>
    </div>
  );
} 