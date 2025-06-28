'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, User } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import ContactForm from '@/features/contacts/components/ContactForm';
import { DeleteContactDialog } from '@/features/contacts/components/DeleteContactDialog';

export default function EditContactPage() {
  const params = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contact, setContact] = useState<any | null>(null);
  const contactId = typeof params.id === 'string' ? params.id : 
                   Array.isArray(params.id) ? params.id[0] : '';
  
  useEffect(() => {
    const fetchContact = async () => {
      if (!contactId) {
        router.push('/admin/contacts');
        return;
      }
      
      try {
        const response = await fetch(`/api/contacts/${contactId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Contact not found');
          } else {
            setError('Failed to load contact');
          }
          setIsLoading(false);
          return;
        }
        
        const data = await response.json();
        setContact(data);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching contact:', err);
        setError('An error occurred while fetching the contact');
        setIsLoading(false);
      }
    };
    
    fetchContact();
  }, [contactId, router]);
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }
  
  if (error || !contact) {
    return (
      <div className="container mx-auto py-8">
        <div className="mb-6 flex items-center">
          <Button
            variant="outline"
            size="icon"
            asChild
            className="mr-4"
          >
            <Link href="/admin/contacts">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Contact Not Found</h1>
        </div>
        
        <Alert variant="destructive">
          <AlertDescription>{error || 'The contact you\'re looking for doesn\'t exist or has been deleted.'}</AlertDescription>
        </Alert>
        
        <div className="mt-4">
          <Button asChild>
            <Link href="/admin/contacts">
              Back to Contacts
            </Link>
          </Button>
        </div>
      </div>
    );
  }
  
  const contactName = `${contact.first_name} ${contact.last_name}`;
  const initials = `${contact.first_name?.[0] || ''}${contact.last_name?.[0] || ''}`.toUpperCase();
  
  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            asChild
          >
            <Link href="/admin/contacts">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12 border">
              {contact.profile_image_url ? (
                <AvatarImage src={contact.profile_image_url} alt={contactName} />
              ) : null}
              <AvatarFallback className="text-lg">{initials || <User className="h-6 w-6" />}</AvatarFallback>
            </Avatar>
            <h1 className="text-2xl font-bold">Edit Contact: {contactName}</h1>
          </div>
        </div>
        <DeleteContactDialog 
          contactId={contactId} 
          contactName={contactName} 
        />
      </div>
      
      <div className="mx-auto max-w-3xl">
        <ContactForm contactId={contactId} />
      </div>
    </div>
  );
} 