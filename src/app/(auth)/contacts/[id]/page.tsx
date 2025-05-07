'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, Phone, MessageSquare, Share2, ArrowLeft, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Contact } from '@/features/contacts/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function ContactDetailPage() {
  const params = useParams();
  const id = params.id as string;
  
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showShareSuccess, setShowShareSuccess] = useState(false);
  
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
  
  // Handle sharing contact on supported browsers
  const handleShare = async () => {
    if (!contact) return;
    
    const fullName = `${contact.first_name} ${contact.last_name}`;
    
    // Only proceed if Web Share API is available
    if (navigator.share) {
      try {
        // Create URL for the contact detail page
        const contactDetailUrl = `${window.location.origin}/contacts/${contact.id}`;
        
        await navigator.share({
          title: `Contact: ${fullName}`,
          text: `Contact information for ${fullName}${contact.job_title ? ` - ${contact.job_title}` : ''}`,
          url: contactDetailUrl
        });
        setShowShareSuccess(true);
        setTimeout(() => setShowShareSuccess(false), 2000);
      } catch (error) {
        console.error('Error sharing contact:', error);
      }
    }
  };
  
  if (loading) {
    return (
      <div className="container max-w-3xl mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between mb-4">
          <Link 
            href="/contacts" 
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Contacts
          </Link>
        </div>
        
        <Card className="p-6 space-y-6 relative overflow-hidden">
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="space-y-2 flex-1 text-center md:text-left">
              <Skeleton className="h-8 w-48 mx-auto md:mx-0" />
              <Skeleton className="h-5 w-36 mx-auto md:mx-0" />
              <Skeleton className="h-4 w-24 mx-auto md:mx-0" />
            </div>
          </div>
          
          <div className="space-y-4 pt-4 border-t">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-6 w-32" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-24" />
            </div>
          </div>
        </Card>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container max-w-3xl mx-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <Link 
            href="/contacts" 
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Contacts
          </Link>
        </div>
        
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  if (!contact) {
    return null;
  }
  
  const fullName = `${contact.first_name} ${contact.last_name}`;
  const initials = `${contact.first_name.charAt(0)}${contact.last_name.charAt(0)}`.toUpperCase();
  
  return (
    <div className="container max-w-3xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between mb-4">
        <Link 
          href="/contacts" 
          className="flex items-center text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Contacts
        </Link>
        
        {/* Share button (only shown if Web Share API is supported) */}
        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <button 
            onClick={handleShare}
            className="text-slate-500 hover:text-blue-500 p-2 rounded-full hover:bg-slate-100"
          >
            <Share2 className="h-4 w-4" />
            <span className="sr-only">Share</span>
          </button>
        )}
      </div>
      
      <Card className="p-6 space-y-6 relative overflow-hidden border border-slate-200 shadow-sm">
        {/* Left accent border */}
        <div className="absolute top-0 left-0 h-full w-1 bg-blue-500" />
        
        <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
          <div className="relative flex-shrink-0">
            <Avatar className="h-24 w-24">
              <AvatarImage src={contact.profile_image_url || undefined} alt={fullName} />
              <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
            </Avatar>
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl font-bold text-slate-800">{fullName}</h1>
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
        
        {/* Contact details */}
        <div className="space-y-4 pt-4 border-t">
          {contact.phone && (
            <div>
              <h3 className="text-sm font-medium text-slate-500 mb-2">Phone</h3>
              <div className="flex items-center gap-3">
                <p className="text-slate-800">{contact.phone}</p>
                <div className="flex gap-2">
                  <a href={`tel:${contact.phone}`} className="text-slate-500 hover:text-blue-500 p-2 rounded-full hover:bg-slate-100">
                    <Phone className="h-4 w-4" />
                    <span className="sr-only">Call</span>
                  </a>
                  
                  {contact.can_text && (
                    <a href={`sms:${contact.phone}`} className="text-slate-500 hover:text-blue-500 p-2 rounded-full hover:bg-slate-100">
                      <MessageSquare className="h-4 w-4" />
                      <span className="sr-only">Text</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {contact.email && (
            <div>
              <h3 className="text-sm font-medium text-slate-500 mb-2">Email</h3>
              <div className="flex items-center gap-3">
                <p className="text-slate-800">{contact.email}</p>
                <div className="flex gap-2">
                  <a href={`mailto:${contact.email}`} className="text-slate-500 hover:text-blue-500 p-2 rounded-full hover:bg-slate-100">
                    <Mail className="h-4 w-4" />
                    <span className="sr-only">Email</span>
                  </a>
                  
                  <a 
                    href={`https://contacts.google.com/${contact.email}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-500 hover:text-blue-500 p-2 rounded-full hover:bg-slate-100"
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span className="sr-only">GChat</span>
                  </a>
                </div>
              </div>
            </div>
          )}
          
          {contact.tags && contact.tags.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-slate-500 mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {contact.tags.map(tag => (
                  <Badge key={tag.id} variant="outline" className="bg-slate-50 text-slate-700 hover:bg-slate-100">
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Success message for sharing (appears briefly after sharing) */}
      {showShareSuccess && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white text-center text-sm py-2 px-4 rounded-md shadow-md animate-fade-in-out">
          Contact shared successfully!
        </div>
      )}
    </div>
  );
}