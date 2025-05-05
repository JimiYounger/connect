'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Mail, Phone, Edit } from 'lucide-react';
import { Contact } from '../types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface SortableContactItemProps {
  contact: Contact;
  disabled?: boolean;
}

export function SortableContactItem({ contact, disabled = false }: SortableContactItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: contact.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };
  
  const initials = getInitials(contact.first_name, contact.last_name);
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center p-3 bg-white border rounded-md shadow-sm gap-3",
        "hover:bg-muted/20 transition-colors duration-200",
        isDragging && "opacity-50 bg-muted/30 shadow-md",
        disabled && "opacity-70 pointer-events-none"
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className={cn(
          "flex-shrink-0 cursor-grab p-1 hover:bg-muted rounded-md",
          isDragging && "cursor-grabbing"
        )}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      
      <Avatar className="h-10 w-10">
        <AvatarImage src={contact.profile_image_url || undefined} alt={`${contact.first_name} ${contact.last_name}`} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2">
          <h3 className="font-medium truncate">
            {contact.first_name} {contact.last_name}
          </h3>
          
          {contact.job_title && (
            <span className="text-sm text-muted-foreground truncate">
              {contact.job_title}
            </span>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2 mt-1">
          {contact.tags && contact.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {contact.tags.slice(0, 3).map((tag) => (
                <Badge variant="outline" key={tag.id} className="text-xs px-1">
                  {tag.name}
                </Badge>
              ))}
              {contact.tags.length > 3 && (
                <Badge variant="outline" className="text-xs px-1">
                  +{contact.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <TooltipProvider>
          {contact.email && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  asChild
                >
                  <a href={`mailto:${contact.email}`}>
                    <Mail className="h-4 w-4" />
                  </a>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Email: {contact.email}</p>
              </TooltipContent>
            </Tooltip>
          )}
          
          {contact.phone && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  asChild
                >
                  <a href={`tel:${contact.phone}`}>
                    <Phone className="h-4 w-4" />
                  </a>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Phone: {contact.phone}</p>
              </TooltipContent>
            </Tooltip>
          )}
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                asChild
              >
                <Link href={`/admin/contacts/edit/${contact.id}`}>
                  <Edit className="h-4 w-4" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Edit Contact</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
} 