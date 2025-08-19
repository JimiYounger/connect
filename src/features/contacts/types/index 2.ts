export interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  job_title: string | null;
  department_id: string | null;
  departments?: {
    name: string;
  };
  can_text: boolean;
  profile_image_url: string | null;
  google_user_id: string | null;
  company_id: string | null;
  location: string | null;
  timezone: string | null;
  order_index: number;
  tags: Array<{
    id: string;
    name: string;
  }>;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  name: string;
}

export interface SortableContactItem {
  id: string;
  contact: Contact;
} 