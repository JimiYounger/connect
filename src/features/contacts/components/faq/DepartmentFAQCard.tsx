'use client';

import { ChevronDown, ChevronRight, Ticket, MessageCircle, Phone, Users, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { QuestionsList } from './QuestionsList';
import { ContactMethodFlow } from './ContactMethodFlow';
import { EscalationContact } from './EscalationContact';
import { CONTACT_METHODS, type DepartmentFAQ } from '../../types/faq';

interface DepartmentFAQCardProps {
  department: DepartmentFAQ;
  isExpanded: boolean;
  onToggle: () => void;
  searchQuery?: string;
}

export function DepartmentFAQCard({ 
  department, 
  isExpanded, 
  onToggle, 
  searchQuery = '' 
}: DepartmentFAQCardProps) {
  const contactMethod = CONTACT_METHODS[department.first_step_method];
  const hasEscalationContacts = department.escalation_contacts.length > 0;

  const getContactMethodIcon = () => {
    switch (department.first_step_method) {
      case 'fresh_service':
        return <Ticket className="h-4 w-4" />;
      case 'qrt_chat':
        return <MessageCircle className="h-4 w-4" />;
      case 'phone_line':
        return <Phone className="h-4 w-4" />;
      default:
        return <Ticket className="h-4 w-4" />;
    }
  };

  const getContactMethodColor = () => {
    switch (department.first_step_method) {
      case 'fresh_service':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'qrt_chat':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'phone_line':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const highlightSearchTerm = (text: string) => {
    if (!searchQuery) return text;
    
    const regex = new RegExp(`(${searchQuery})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? 
        <mark key={index} className="bg-yellow-200 px-1 rounded">{part}</mark> : 
        part
    );
  };

  const handlePrimaryAction = () => {
    switch (department.first_step_method) {
      case 'fresh_service':
        // Open Fresh Service home page
        window.open('https://purelightpower.freshservice.com/support/home', '_blank');
        break;
      case 'qrt_chat':
        // This would typically open a chat application or navigate to it
        alert('Opening QRT group chat...\n(In a real implementation, this would open your chat application)');
        break;
      case 'phone_line':
        // This would show phone number or initiate call
        alert(`Call department phone line\n(Phone numbers are in Sunny > "Phone List")`);
        break;
    }
  };

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
        
        {/* Card Header */}
        <CollapsibleTrigger asChild>
          <div className="p-3 md:p-6 cursor-pointer hover:bg-slate-50 transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 md:gap-3 mb-2">
                  <div className={`p-1.5 md:p-2 rounded-lg border flex-shrink-0 ${getContactMethodColor()}`}>
                    {getContactMethodIcon()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base md:text-xl font-semibold text-slate-900 truncate">
                      {highlightSearchTerm(department.name)}
                    </h3>
                    <div className="flex flex-wrap items-center gap-1 md:gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {contactMethod.label}
                      </Badge>
                      {hasEscalationContacts && (
                        <Badge variant="secondary" className="text-xs">
                          <Users className="h-3 w-3 mr-1" />
                          <span className="hidden sm:inline">{department.escalation_contacts.length} escalation contact{department.escalation_contacts.length !== 1 ? 's' : ''}</span>
                          <span className="sm:hidden">{department.escalation_contacts.length} contact{department.escalation_contacts.length !== 1 ? 's' : ''}</span>
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                <p className="text-sm text-slate-600 mb-3">
                  {department.typical_questions.length} typical question{department.typical_questions.length !== 1 ? 's' : ''} • 
                  {' '}{department.first_step_details}
                </p>

                {/* Quick Questions Preview */}
                {department.typical_questions.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {department.typical_questions.slice(0, 3).map((question, index) => (
                      <span 
                        key={index}
                        className="inline-flex items-center px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-md"
                      >
                        {highlightSearchTerm(question)}
                      </span>
                    ))}
                    {department.typical_questions.length > 3 && (
                      <span className="inline-flex items-center px-2 py-1 text-slate-500 text-xs">
                        +{department.typical_questions.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrimaryAction();
                  }}
                  className="hidden sm:flex text-xs"
                >
                  {contactMethod.action_label}
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
                
                {isExpanded ? (
                  <ChevronDown className="h-5 w-5 text-slate-400" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-slate-400" />
                )}
              </div>
            </div>
          </div>
        </CollapsibleTrigger>

        {/* Expanded Content */}
        <CollapsibleContent>
          <div className="px-3 md:px-6 pb-3 md:pb-6 border-t border-slate-100">
            <div className="space-y-4 md:space-y-6 pt-3 md:pt-4">
              
              {/* Contact Method Flow */}
              <ContactMethodFlow department={department} />

              {/* Questions List */}
              {department.typical_questions.length > 0 && (
                <QuestionsList 
                  questions={department.typical_questions}
                  searchQuery={searchQuery}
                />
              )}

              {/* Escalation Contacts */}
              {hasEscalationContacts && (
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2 md:mb-3 flex items-center gap-2 text-sm md:text-base">
                    <Users className="h-4 w-4" />
                    Escalation Contacts
                  </h4>
                  <p className="text-xs md:text-sm text-slate-600 mb-3 md:mb-4">
                    Contact these people directly only if the ticket/chat is unresponsive or truly urgent.
                  </p>
                  <div className="grid gap-2 md:gap-3">
                    {department.escalation_contacts.map(contact => (
                      <EscalationContact
                        key={contact.id}
                        contact={contact}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Mobile Action Button */}
              <div className="sm:hidden">
                <Button
                  onClick={handlePrimaryAction}
                  className="w-full"
                  size="lg"
                >
                  {contactMethod.action_label}
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}