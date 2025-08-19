'use client';

import { Phone, Mail, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { EscalationContact as EscalationContactType } from '../../types/faq';

interface EscalationContactProps {
  contact: EscalationContactType;
}

export function EscalationContact({ contact }: EscalationContactProps) {
  const fullName = `${contact.first_name} ${contact.last_name}`;
  const initials = `${contact.first_name[0]}${contact.last_name[0]}`.toUpperCase();

  const handleCall = () => {
    if (contact.phone) {
      window.location.href = `tel:${contact.phone}`;
    }
  };

  const handleEmail = () => {
    if (contact.email) {
      window.location.href = `mailto:${contact.email}`;
    }
  };

  const handleText = () => {
    if (contact.phone) {
      window.location.href = `sms:${contact.phone}`;
    }
  };


  return (
    <div className="flex items-start gap-3 p-3 md:p-4 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors w-full max-w-full overflow-hidden">
      {/* Avatar */}
      <Avatar className="h-10 w-10 md:h-12 md:w-12 flex-shrink-0">
        <AvatarImage 
          src={contact.profile_image_url || undefined} 
          alt={fullName}
        />
        <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold text-xs md:text-sm">
          {initials}
        </AvatarFallback>
      </Avatar>

      {/* Contact Info */}
      <div className="flex-1 min-w-0 overflow-hidden">
        <div className="flex items-start flex-col md:flex-row md:items-center gap-1 md:gap-2 mb-1">
          <h5 className="font-semibold text-sm md:text-base text-slate-900 truncate max-w-full">
            {fullName}
          </h5>
          {contact.escalation_role && (
            <Badge variant="secondary" className="text-xs flex-shrink-0 self-start">
              {contact.escalation_role}
            </Badge>
          )}
        </div>
        
        {contact.job_title && (
          <p className="text-xs md:text-sm text-slate-600 truncate mb-1 max-w-full">
            {contact.job_title}
          </p>
        )}

        <div className="text-xs text-slate-500 space-y-1 md:space-y-0">
          {contact.email && (
            <div className="truncate max-w-full">{contact.email}</div>
          )}
          {contact.phone && (
            <div className="truncate">{contact.phone}</div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col md:flex-row items-center gap-1 md:gap-2 flex-shrink-0">
        {/* Primary actions - stack vertically on mobile */}
        <div className="flex gap-1 w-full md:w-auto">
          {contact.phone && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCall}
              className="px-2 flex-1 md:flex-initial"
            >
              <Phone className="h-4 w-4" />
              <span className="sr-only">Call {fullName}</span>
            </Button>
          )}

          {contact.email && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleEmail}
              className="px-2 flex-1 md:flex-initial"
            >
              <Mail className="h-4 w-4" />
              <span className="sr-only">Email {fullName}</span>
            </Button>
          )}

          {contact.can_text && contact.phone && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleText}
              className="px-2 flex-1 md:flex-initial"
            >
              <MessageSquare className="h-4 w-4" />
              <span className="sr-only">Text {fullName}</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}