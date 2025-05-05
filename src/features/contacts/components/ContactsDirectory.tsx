'use client';

import { Loader2, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Contact, Department } from '../types';
import { ContactCard } from './ContactCard';
import { ContactFilterBar } from './ContactFilterBar';
import { useContactsDirectory } from '../hooks/useContactsDirectory';

interface Tag {
  id: string;
  name: string;
}

interface ContactsDirectoryProps {
  initialContacts?: Contact[];
  initialDepartments?: Department[];
  initialTags?: Tag[];
}

export function ContactsDirectory({
  initialContacts,
  initialDepartments,
  initialTags,
}: ContactsDirectoryProps) {
  const {
    isLoading,
    error,
    departments,
    tags,
    filters,
    setFilters,
    filteredAndGroupedContacts,
    totalContacts,
    filteredContactsCount,
  } = useContactsDirectory(initialContacts, initialDepartments, initialTags);
  
  const handleFilterChange = (newFilters: {
    searchQuery: string;
    selectedDepartment: string | null;
    selectedTags: string[];
  }) => {
    setFilters(newFilters);
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }
  
  if (error) {
    return (
      <Alert variant="destructive" className="bg-red-50 text-red-800 border border-red-200">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  
  const hasFilteredResults = filteredAndGroupedContacts.length > 0;
  
  return (
    <div className="space-y-6">
      <ContactFilterBar
        departments={departments}
        tags={tags}
        onFilterChange={handleFilterChange}
      />
      
      {/* Status indicator for filter results */}
      {filters.searchQuery || filters.selectedDepartment || filters.selectedTags.length > 0 ? (
        <div className="text-sm text-slate-500 flex items-center gap-1 pl-1">
          <span className="font-medium text-slate-700">{filteredContactsCount}</span> of <span className="font-medium text-slate-700">{totalContacts}</span> contacts displayed
        </div>
      ) : null}
      
      {!hasFilteredResults && (
        <Card className="p-8 text-center bg-white border border-slate-200">
          <p className="text-slate-500">No contacts found matching your filters.</p>
        </Card>
      )}
      
      {hasFilteredResults && filteredAndGroupedContacts.map((department) => (
        <div key={department.id} className="space-y-3">
          <h2 className="text-xl font-semibold flex items-center gap-2 px-1 text-slate-800">
            <Users className="h-5 w-5 text-blue-500" />
            {department.name}
            <span className="text-sm font-normal text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
              {department.contacts.length}
            </span>
          </h2>
          
          <div className="space-y-2">
            {department.contacts.map((contact) => (
              <ContactCard key={contact.id} contact={contact} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
} 