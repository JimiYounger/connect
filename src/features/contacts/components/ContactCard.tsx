// my-app/src/features/contacts/components/ContactCard.tsx

'use client';

import { Mail, Phone, MessageSquare, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Contact } from '../types';
import { useState } from 'react';

// Google Chat icon component
const GChatIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9-9v18" />
  </svg>
);

interface ContactCardProps {
  contact: Contact;
}

export function ContactCard({ contact }: ContactCardProps) {
  const [showShareSuccess, setShowShareSuccess] = useState(false);
  const fullName = `${contact.first_name} ${contact.last_name}`;
  const initials = `${contact.first_name.charAt(0)}${contact.last_name.charAt(0)}`.toUpperCase();
  
  // Handle sharing contact on supported browsers
  const handleShare = async () => {
    // Only proceed if Web Share API is available
    if (navigator.share) {
      try {
        await navigator.share({
          title: fullName,
          text: `Contact information for ${fullName}${contact.job_title ? ` - ${contact.job_title}` : ''}`,
          url: window.location.href,
        });
        setShowShareSuccess(true);
        setTimeout(() => setShowShareSuccess(false), 2000);
      } catch (error) {
        console.error('Error sharing contact:', error);
      }
    }
  };
  
  // Helper to check if device is touch-based (for tooltip behavior)
  const isTouchDevice = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
  
  return (
    <Card className="p-4 flex flex-col md:flex-row gap-4 hover:bg-slate-50 transition-colors relative overflow-hidden border border-slate-200 shadow-sm">
      {/* Left accent border */}
      <div className="absolute top-0 left-0 h-full w-1 bg-blue-500" />
      
      <div className="relative flex-shrink-0 mx-auto md:mx-0 ml-2">
        <Avatar className="h-16 w-16">
          <AvatarImage src={contact.profile_image_url || undefined} alt={fullName} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      </div>
      
      <div className="flex-1 text-center md:text-left">
        <h3 className="font-medium text-slate-800">{fullName}</h3>
        {contact.job_title && (
          <p className="text-sm text-slate-600 mt-1">{contact.job_title}</p>
        )}
        {contact.departments?.name && (
          <p className="text-xs text-slate-500 mt-1">
            {contact.departments.name}
          </p>
        )}
      </div>
      
      <div className="flex flex-wrap gap-2 justify-center md:justify-end mt-2 md:mt-0">
        <TooltipProvider delayDuration={isTouchDevice ? 300 : 0}>
          {contact.phone && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9 md:h-8 md:w-auto md:px-3 bg-white hover:bg-blue-50 border-slate-200 text-slate-700 hover:text-blue-600" asChild>
                  <a href={`tel:${contact.phone}`} aria-label={`Call ${fullName}`}>
                    <Phone className="h-4 w-4 md:mr-1" />
                    <span className="sr-only md:not-sr-only md:inline">Call</span>
                  </a>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="md:hidden">Call</TooltipContent>
            </Tooltip>
          )}
          
          {contact.email && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9 md:h-8 md:w-auto md:px-3 bg-white hover:bg-blue-50 border-slate-200 text-slate-700 hover:text-blue-600" asChild>
                  <a href={`mailto:${contact.email}`} aria-label={`Email ${fullName}`}>
                    <Mail className="h-4 w-4 md:mr-1" />
                    <span className="sr-only md:not-sr-only md:inline">Email</span>
                  </a>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="md:hidden">Email</TooltipContent>
            </Tooltip>
          )}
          
          {contact.phone && contact.can_text && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9 md:h-8 md:w-auto md:px-3 bg-white hover:bg-blue-50 border-slate-200 text-slate-700 hover:text-blue-600" asChild>
                  <a href={`sms:${contact.phone}`} aria-label={`Text ${fullName}`}>
                    <MessageSquare className="h-4 w-4 md:mr-1" />
                    <span className="sr-only md:not-sr-only md:inline">Text</span>
                  </a>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="md:hidden">Text</TooltipContent>
            </Tooltip>
          )}
          
          {contact.email && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9 md:h-8 md:w-auto md:px-3 bg-white hover:bg-blue-50 border-slate-200 text-slate-700 hover:text-blue-600" asChild>
                  <a 
                    href={`https://contacts.google.com/${contact.email}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    aria-label={`Google Contacts - ${fullName}`}
                  >
                    <GChatIcon />
                    <span className="sr-only md:not-sr-only md:inline ml-1">Contacts</span>
                  </a>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="md:hidden">Contacts</TooltipContent>
            </Tooltip>
          )}
          
          {/* Share contact button (only shown if Web Share API is supported) */}
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-9 w-9 md:h-8 md:w-auto md:px-3 bg-white hover:bg-blue-50 border-slate-200 text-slate-700 hover:text-blue-600" 
                  onClick={handleShare}
                >
                  <Share2 className="h-4 w-4 md:mr-1" />
                  <span className="sr-only md:not-sr-only md:inline">Share</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="md:hidden">Share</TooltipContent>
            </Tooltip>
          )}
        </TooltipProvider>
      </div>
      
      {/* Success message for sharing (appears briefly after sharing) */}
      {showShareSuccess && (
        <div className="absolute top-0 left-0 right-0 bg-green-500 text-white text-center text-xs py-1 px-2 animate-fade-out rounded-t-md">
          Contact shared successfully!
        </div>
      )}
    </Card>
  );
} 