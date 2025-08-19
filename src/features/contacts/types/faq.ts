// FAQ-specific types for the Contact FAQ feature
export type ContactMethod = 'fresh_service' | 'qrt_chat' | 'phone_line';

export interface DepartmentFAQ {
  id: string;
  name: string;
  typical_questions: string[];
  first_step_method: ContactMethod;
  first_step_details: string;
  queue_name: string | null;
  has_phone_line: boolean;
  order_index: number;
  escalation_contacts: EscalationContact[];
}

export interface EscalationContact {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  job_title: string | null;
  escalation_role: string | null;
  can_text: boolean;
  profile_image_url: string | null;
}

export interface ContactFAQFilters {
  searchQuery: string;
  contactMethod: ContactMethod | null;
  selectedDepartment: string | null;
}

export interface ContactMethodInfo {
  type: ContactMethod;
  label: string;
  icon: string;
  description: string;
  action_label: string;
}

export const CONTACT_METHODS: Record<ContactMethod, ContactMethodInfo> = {
  fresh_service: {
    type: 'fresh_service',
    label: 'Fresh Service Ticket',
    icon: 'ticket',
    description: 'Create a ticket in the appropriate queue',
    action_label: 'Create Ticket'
  },
  qrt_chat: {
    type: 'qrt_chat',
    label: 'QRT Group Chat',
    icon: 'message-circle',
    description: 'Post in QRT group chat for proposal emergencies',
    action_label: 'Open Chat'
  },
  phone_line: {
    type: 'phone_line',
    label: 'Department Phone',
    icon: 'phone',
    description: 'Call the department phone line directly',
    action_label: 'Call Now'
  }
};

export interface FAQSearchResult {
  department: DepartmentFAQ;
  matchedQuestions: string[];
  relevanceScore: number;
}