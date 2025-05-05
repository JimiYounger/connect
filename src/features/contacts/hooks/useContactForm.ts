// my-app/src/features/contacts/hooks/useContactForm.ts

'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

// Define the schema for the form
export const contactFormSchema = z.object({
  first_name: z.string().min(1, { message: 'First name is required' }),
  last_name: z.string().min(1, { message: 'Last name is required' }),
  email: z.string().email({ message: 'Must be a valid email address' }).optional().nullable(),
  phone: z.string().optional().nullable(),
  job_title: z.string().optional().nullable(),
  department_id: z.string().optional().nullable(),
  tags: z.array(z.string()).optional().default([]),
  can_text: z.boolean().default(false),
  profile_image_url: z.string().optional().nullable(),
  google_user_id: z.string().optional().nullable(),
  work_id: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  timezone: z.string().optional().nullable(),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;

export interface Department {
  id: string;
  name: string;
}

export interface Tag {
  id: string;
  name: string;
}

export function useContactForm() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [tags, _setTags] = useState<Tag[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const supabase = createClient();
  
  // Initialize form
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      job_title: '',
      department_id: '',
      tags: [],
      can_text: false,
      profile_image_url: '',
      google_user_id: '',
      work_id: '',
      location: '',
      timezone: '',
    },
  });
  
  // Load departments on component mount
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        // Fetch departments
        const { data: departmentsData, error: departmentsError } = await supabase
          .from('departments')
          .select('id, name')
          .order('name');
        
        if (departmentsError) throw departmentsError;
        setDepartments(departmentsData || []);
        
        // We're removing the tags query since the table doesn't exist yet
        // You'll need to create this table in Supabase before adding this code back
        
      } catch (error) {
        console.error('Error fetching departments:', error);
        toast({
          title: 'Error',
          description: 'Failed to load departments',
          variant: 'destructive',
        });
      }
    };

    fetchDepartments();
  }, [supabase, toast]);
  
  // Sync with Google function
  const syncWithGoogle = async () => {
    const { first_name, last_name } = form.getValues();
    
    if (!first_name || !last_name) {
      toast({
        title: 'Error',
        description: 'First name and last name are required to sync with Google',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSyncing(true);
    
    try {
      const response = await fetch('/api/contacts/sync-google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ first_name, last_name }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to sync with Google');
      }
      
      const data = await response.json();
      
      // Update form with fetched data
      form.setValue('email', data.email || '');
      form.setValue('phone', data.phone || '');
      form.setValue('job_title', data.job_title || '');
      form.setValue('profile_image_url', data.profile_image_url || '');
      form.setValue('google_user_id', data.google_user_id || '');
      form.setValue('work_id', data.work_id || '');
      form.setValue('location', data.location || '');
      form.setValue('timezone', data.timezone || '');
      
      // If department_id is returned from API, set it
      if (data.department_id) {
        form.setValue('department_id', data.department_id);
      }
      
      toast({
        title: 'Success',
        description: 'Contact information synced with Google',
      });
    } catch (error) {
      console.error('Error syncing with Google:', error);
      toast({
        title: 'Error',
        description: 'Failed to sync with Google',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  };
  
  // Submit form function
  const onSubmit = async (values: ContactFormValues) => {
    setIsSubmitting(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Insert contact into database
      const { error } = await supabase
        .from('contacts')
        .insert({
          ...values,
          created_by: user.id,
          updated_by: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Contact created successfully',
      });
      
      // Redirect to contacts list
      router.push('/admin/contacts');
      router.refresh();
    } catch (error) {
      console.error('Error creating contact:', error);
      toast({
        title: 'Error',
        description: 'Failed to create contact',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return {
    form,
    departments,
    tags,
    isSyncing,
    isSubmitting,
    syncWithGoogle,
    onSubmit
  };
} 