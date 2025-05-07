'use client';

import { Loader2, Users, Mail, Phone, MessageSquare, Share2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Contact, Department } from '../types';
import { useContactsDirectory } from '../hooks/useContactsDirectory';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Tag {
  id: string;
  name: string;
}

interface ContactsDirectoryProps {
  initialContacts?: Contact[];
  initialDepartments?: Department[];
  initialTags?: Tag[];
  initialFilters?: {
    searchQuery: string;
    selectedDepartment: string | null;
    selectedTags: string[];
  };
}

export function ContactsDirectory({
  initialContacts,
  initialDepartments,
  initialTags,
  initialFilters,
}: ContactsDirectoryProps) {
  const [shareSuccess, setShareSuccess] = useState<string | null>(null);

  const {
    isLoading,
    error,
    filters,
    setFilters,
    filteredAndGroupedContacts,
    totalContacts,
    filteredContactsCount,
  } = useContactsDirectory(initialContacts, initialDepartments, initialTags);
  
  useEffect(() => {
    if (initialFilters) {
      setFilters(initialFilters);
    }
  }, [initialFilters, setFilters]);
  
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
  
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // Handle sharing contact info
  const handleShare = async (contact: Contact) => {
    const fullName = `${contact.first_name} ${contact.last_name}`;
    
    if (navigator.share) {
      try {
        // Generate a URL pointing to the contact's detail page
        const contactDetailUrl = `${window.location.origin}/contacts/${contact.id}`;
        
        await navigator.share({
          title: `Contact: ${fullName}`,
          text: `Contact information for ${fullName}${contact.job_title ? ` - ${contact.job_title}` : ''}`,
          url: contactDetailUrl
        });
        
        setShareSuccess(contact.id);
        setTimeout(() => setShareSuccess(null), 2000);
      } catch (error) {
        console.error('Error sharing contact:', error);
      }
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Status indicator for filter results */}
      {filters.searchQuery || filters.selectedDepartment || filters.selectedTags.length > 0 ? (
        <div className="text-sm text-slate-500 mb-4">
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
          <div className="flex items-center gap-2 px-1">
            <Users className="h-5 w-5 text-slate-500" />
            <h2 className="text-lg font-semibold text-slate-800">
              {department.name}
            </h2>
            <Badge variant="secondary" className="ml-2 text-xs">
              {department.contacts.length}
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1">
            {department.contacts.map((contact) => (
              <div key={contact.id} className="bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden relative">
                {shareSuccess === contact.id && (
                  <div className="absolute top-0 left-0 right-0 bg-green-500 text-white text-center text-xs py-1 px-2 animate-fade-out rounded-t-md">
                    Contact shared successfully!
                  </div>
                )}
                <div className="flex items-center p-3 md:p-4 gap-3">
                  <div className="flex-shrink-0">
                    <Avatar className="h-10 w-10 md:h-12 md:w-12">
                      <AvatarImage src={contact.profile_image_url || undefined} alt={`${contact.first_name} ${contact.last_name}`} />
                      <AvatarFallback>{getInitials(contact.first_name, contact.last_name)}</AvatarFallback>
                    </Avatar>
                  </div>
                  
                  <div className="flex-grow min-w-0">
                    <h3 className="font-medium text-slate-800 text-sm md:text-base">
                      <Link href={`/contacts/${contact.id}`} className="hover:text-blue-600 hover:underline">
                        {contact.first_name} {contact.last_name}
                      </Link>
                    </h3>
                    {contact.job_title && (
                      <p className="text-xs md:text-sm text-slate-500 truncate">
                        {contact.job_title}
                      </p>
                    )}
                    {contact.departments?.name && (
                      <p className="text-xs text-slate-400 hidden md:block">
                        {contact.departments.name}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1 md:gap-2">
                    {contact.email && (
                      <a href={`mailto:${contact.email}`} className="text-slate-500 hover:text-blue-500 p-1.5 rounded-full hover:bg-slate-100">
                        <Mail className="h-4 w-4" />
                        <span className="sr-only">Email</span>
                      </a>
                    )}
                    {contact.phone && (
                      <a href={`tel:${contact.phone}`} className="text-slate-500 hover:text-blue-500 p-1.5 rounded-full hover:bg-slate-100">
                        <Phone className="h-4 w-4" />
                        <span className="sr-only">Call</span>
                      </a>
                    )}
                    {contact.phone && contact.can_text && (
                      <a href={`sms:${contact.phone}`} className="text-slate-500 hover:text-blue-500 p-1.5 rounded-full hover:bg-slate-100">
                        <MessageSquare className="h-4 w-4" />
                        <span className="sr-only">Text</span>
                      </a>
                    )}
                    {contact.email && (
                      <a 
                        href={`https://contacts.google.com/${contact.email}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-500 hover:text-blue-500 p-1.5 rounded-full hover:bg-slate-100"
                      >
                        <MessageSquare className="h-4 w-4" />
                        <span className="sr-only">GChat</span>
                      </a>
                    )}
                    {typeof navigator !== 'undefined' && 'share' in navigator && (
                      <button 
                        onClick={() => handleShare(contact)}
                        className="text-slate-500 hover:text-blue-500 p-1.5 rounded-full hover:bg-slate-100"
                      >
                        <Share2 className="h-4 w-4" />
                        <span className="sr-only">Share</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
} 