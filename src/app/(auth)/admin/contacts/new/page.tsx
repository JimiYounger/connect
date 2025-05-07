// my-app/src/app/(auth)/admin/contacts/new/page.tsx

'use client';

import { useState } from 'react'
import { ArrowLeft, User } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import ContactForm from '@/features/contacts/components/ContactForm'

export default function NewContactPage() {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<{first: string, last: string}>({first: '', last: ''});
  
  // Handler to get preview data after Google sync
  const handleSyncPreview = (data: any) => {
    if (data?.profile_image_url) {
      setPreviewImage(data.profile_image_url);
    }
    
    setPreviewName({
      first: data?.first_name || '',
      last: data?.last_name || ''
    });
  }
  
  const initials = previewName.first && previewName.last 
    ? `${previewName.first[0]}${previewName.last[0]}`.toUpperCase() 
    : '';
    
  const displayName = previewName.first && previewName.last 
    ? `${previewName.first} ${previewName.last}` 
    : 'New Contact';
  
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
              {previewImage ? (
                <AvatarImage src={previewImage} alt={displayName} />
              ) : null}
              <AvatarFallback className="text-lg">{initials || <User className="h-6 w-6" />}</AvatarFallback>
            </Avatar>
            <h1 className="text-2xl font-bold">Create Contact: {displayName}</h1>
          </div>
        </div>
      </div>
      
      <div className="mx-auto max-w-3xl">
        <ContactForm onGoogleSync={handleSyncPreview} />
      </div>
    </div>
  )
} 