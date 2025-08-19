'use client';

import { ArrowRight, Ticket, MessageCircle, Phone, AlertTriangle } from 'lucide-react';
import { type DepartmentFAQ } from '../../types/faq';

interface ContactMethodFlowProps {
  department: DepartmentFAQ;
}

export function ContactMethodFlow({ department }: ContactMethodFlowProps) {
  const hasEscalation = department.escalation_contacts.length > 0;

  const getMethodIcon = () => {
    switch (department.first_step_method) {
      case 'fresh_service':
        return <Ticket className="h-5 w-5" />;
      case 'qrt_chat':
        return <MessageCircle className="h-5 w-5" />;
      case 'phone_line':
        return <Phone className="h-5 w-5" />;
    }
  };

  const getMethodColor = () => {
    switch (department.first_step_method) {
      case 'fresh_service':
        return 'border-blue-200 bg-blue-50';
      case 'qrt_chat':
        return 'border-green-200 bg-green-50';
      case 'phone_line':
        return 'border-orange-200 bg-orange-50';
    }
  };

  const getMethodDetails = () => {
    switch (department.first_step_method) {
      case 'fresh_service':
        return {
          title: 'Create Fresh Service Ticket',
          description: `Queue: ${department.queue_name}`,
          note: 'Tickets are visible to the whole team and build our knowledge base'
        };
      case 'qrt_chat':
        return {
          title: 'QRT Group Chat',
          description: 'For proposal emergencies only',
          note: 'Use only for urgent proposal help while in-home'
        };
      case 'phone_line':
        return {
          title: 'Department Phone Line',
          description: 'Direct phone support available',
          note: 'Phone numbers are pinned in Sunny > "Phone List"'
        };
    }
  };

  const methodDetails = getMethodDetails();

  return (
    <div>
      <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
        <ArrowRight className="h-4 w-4" />
        Contact Process
      </h4>
      
      <div className="space-y-4">
        {/* First Step */}
        <div className={`p-4 rounded-lg border-2 ${getMethodColor()}`}>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-1">
              {getMethodIcon()}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-600 text-white text-sm font-semibold rounded-full">
                  1
                </span>
                <h5 className="font-medium text-slate-900">
                  {methodDetails.title}
                </h5>
              </div>
              <p className="text-sm text-slate-600 mb-2">
                {methodDetails.description}
              </p>
              <p className="text-xs text-slate-500 italic">
                {methodDetails.note}
              </p>
            </div>
          </div>
        </div>

        {/* Arrow */}
        {hasEscalation && (
          <div className="flex justify-center">
            <ArrowRight className="h-5 w-5 text-slate-400" />
          </div>
        )}

        {/* Escalation Step */}
        {hasEscalation && (
          <div className="p-4 rounded-lg border-2 border-amber-200 bg-amber-50">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center justify-center w-6 h-6 bg-amber-600 text-white text-sm font-semibold rounded-full">
                    2
                  </span>
                  <h5 className="font-medium text-slate-900">
                    Escalate if Needed
                  </h5>
                </div>
                <p className="text-sm text-slate-600 mb-2">
                  Contact escalation person directly
                </p>
                <p className="text-xs text-slate-500 italic">
                  Only if ticket/chat is unresponsive or truly urgent
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Special Notes */}
        {department.first_step_method === 'qrt_chat' && (
          <div className="p-3 bg-green-100 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              <strong>Note:</strong> Escalation rarely needed for QRT proposals.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}