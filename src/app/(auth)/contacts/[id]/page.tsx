'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, Phone, ArrowLeft, MessageSquare, Copy, Check } from 'lucide-react';
import { Contact } from '@/features/contacts/types';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export default function ContactDetailPage() {
  const params = useParams();
  const id = params.id as string;
  
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  useEffect(() => {
    async function fetchContact() {
      setLoading(true);
      try {
        const response = await fetch(`/api/contacts/${id}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch contact: ${response.statusText}`);
        }
        
        const data = await response.json();
        setContact(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching contact:', err);
        setError(err instanceof Error ? err.message : 'Failed to load contact details');
      } finally {
        setLoading(false);
      }
    }
    
    if (id) {
      fetchContact();
    }
  }, [id]);
  
  const copyNameToClipboard = async () => {
    if (!contact) return;
    
    const fullName = `${contact.first_name} ${contact.last_name}`;
    try {
      await navigator.clipboard.writeText(fullName);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };
  
  if (loading) {
    return (
      <div className="container max-w-3xl mx-auto p-4">
        <div className="flex items-center mb-6">
          <Link 
            href="/contacts" 
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Contacts
          </Link>
        </div>
        
        <div className="bg-white border border-slate-200 rounded-md p-6 space-y-6">
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          
          <div className="space-y-4 pt-4 border-t">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    );
  }
  
  if (error || !contact) {
    return (
      <div className="container max-w-3xl mx-auto p-4">
        <div className="flex items-center mb-6">
          <Link 
            href="/contacts" 
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Contacts
          </Link>
        </div>
        
        <Alert variant="destructive">
          <AlertDescription>
            {error || "The contact you're looking for doesn't exist or has been deleted."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  const fullName = `${contact.first_name} ${contact.last_name}`;
  const initials = `${contact.first_name.charAt(0)}${contact.last_name.charAt(0)}`.toUpperCase();
  
  return (
    <div className="container max-w-3xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <Link 
          href="/contacts" 
          className="flex items-center text-slate-800 hover:text-blue-600"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Contacts
        </Link>
        
        <button className="text-slate-500 hover:text-blue-500 p-2 rounded-full hover:bg-slate-100">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            <circle cx="18" cy="5" r="3"></circle>
            <circle cx="6" cy="12" r="3"></circle>
            <circle cx="18" cy="19" r="3"></circle>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
          </svg>
        </button>
      </div>
      
      <div className="bg-white border border-slate-200 rounded-md overflow-hidden">
        <div className="p-6 space-y-6">
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
            <Avatar className="h-24 w-24">
              <AvatarImage src={contact.profile_image_url || undefined} alt={fullName} />
              <AvatarFallback className="text-3xl bg-slate-100 text-slate-500">{initials}</AvatarFallback>
            </Avatar>
            
            <div className="text-center md:text-left flex-1">
              <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-800">{fullName}</h1>
                <button 
                  onClick={copyNameToClipboard}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-slate-100 text-slate-600 hover:bg-slate-200 h-8 w-8"
                  title="Copy name to clipboard"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  <span className="sr-only">Copy name</span>
                </button>
              </div>
              {contact.job_title && (
                <p className="text-lg text-slate-600 mt-1">{contact.job_title}</p>
              )}
              {contact.departments?.name && (
                <p className="text-md text-slate-500 mt-1">
                  {contact.departments.name}
                </p>
              )}
            </div>
          </div>
          
          <div className="space-y-6 pt-6 border-t">
            {contact.phone && (
              <div>
                <h3 className="text-sm font-medium text-slate-500 mb-2">Phone</h3>
                <div className="flex items-center gap-2">
                  <a href={`tel:${contact.phone}`} className="flex items-center gap-2 text-slate-800 hover:text-blue-600">
                    <Phone className="h-5 w-5 text-slate-400" />
                    <span>{contact.phone}</span>
                  </a>
                  {contact.can_text && (
                    <a href={`sms:${contact.phone}`} className="text-slate-500 hover:text-blue-500 p-1.5 rounded-full hover:bg-slate-100 ml-2">
                      <MessageSquare className="h-4 w-4" />
                      <span className="sr-only">Text</span>
                    </a>
                  )}
                </div>
              </div>
            )}
            
            {contact.email && (
              <div>
                <h3 className="text-sm font-medium text-slate-500 mb-2">Email</h3>
                <div className="flex items-center gap-2">
                  <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-slate-800 hover:text-blue-600">
                    <Mail className="h-5 w-5 text-slate-400" />
                    <span>{contact.email}</span>
                  </a>
                </div>
              </div>
            )}
            
            {contact.tags && contact.tags.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-slate-500 mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {contact.tags.map(tag => (
                    <Badge key={tag.id} variant="outline" className="bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200">
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}