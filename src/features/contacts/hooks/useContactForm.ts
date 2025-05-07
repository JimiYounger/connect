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
  selectedTagIds: z.array(z.string()).default([]),
  can_text: z.boolean().default(false),
  profile_image_url: z.string().optional().nullable(),
  google_user_id: z.string().optional().nullable(),
  company_id: z.string().optional().nullable(),
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

export function useContactForm(contactId?: string, onGoogleSync?: (data: any) => void) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(contactId ? true : false);
  const [isCreatingTag, setIsCreatingTag] = useState(false);
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
      selectedTagIds: [],
      can_text: false,
      profile_image_url: '',
      google_user_id: '',
      company_id: '',
      location: '',
      timezone: '',
    },
  });
  
  // Load departments and tags on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch departments
        const { data: departmentsData, error: departmentsError } = await supabase
          .from('departments')
          .select('id, name')
          .order('name');
        
        if (departmentsError) throw departmentsError;
        setDepartments(departmentsData || []);
        
        // Fetch available tags
        const { data: tagsData, error: tagsError } = await supabase
          .from('contact_tags')
          .select('id, name')
          .order('name');
        
        if (tagsError) throw tagsError;
        setTags(tagsData || []);
        
        // If editing an existing contact, fetch its data
        if (contactId) {
          // Fetch contact data using API
          const response = await fetch(`/api/contacts/${contactId}`);
          
          if (!response.ok) {
            throw new Error('Failed to fetch contact details');
          }
          
          const contact = await response.json();
          
          if (contact) {
            // Populate form with contact data
            form.reset({
              first_name: contact.first_name,
              last_name: contact.last_name,
              email: contact.email,
              phone: contact.phone,
              job_title: contact.job_title,
              department_id: contact.department_id,
              can_text: contact.can_text,
              profile_image_url: contact.profile_image_url,
              google_user_id: contact.google_user_id,
              company_id: contact.company_id,
              location: contact.location,
              timezone: contact.timezone,
              // Extract tag IDs from the tags array
              selectedTagIds: contact.tags?.map((tag: { id: string; name: string }) => tag.id) || [],
            });
          }
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load data',
          variant: 'destructive',
        });
        setIsLoading(false);
      }
    };

    fetchData();
  }, [contactId, form, supabase, toast]);
  
  // Create a new tag function
  const createTag = async (name: string): Promise<string | null> => {
    setIsCreatingTag(true);
    try {
      // Check if tag with the same name already exists
      const { data: existingTags, error: existingTagsError } = await supabase
        .from('contact_tags')
        .select('id')
        .ilike('name', name)
        .limit(1);
      
      if (existingTagsError) throw existingTagsError;
      
      // If the tag already exists, return it
      if (existingTags && existingTags.length > 0) {
        toast({
          title: 'Tag exists',
          description: `Tag "${name}" already exists and has been selected`,
        });
        return existingTags[0].id;
      }
      
      // Insert new tag
      const { data: newTag, error: insertError } = await supabase
        .from('contact_tags')
        .insert({ name })
        .select('id, name')
        .single();
      
      if (insertError) throw insertError;
      
      // Add to local tags list
      setTags(prevTags => [...prevTags, newTag]);
      
      toast({
        title: 'Success',
        description: `Tag "${name}" created successfully`,
      });
      
      return newTag.id;
    } catch (error) {
      console.error('Error creating tag:', error);
      toast({
        title: 'Error',
        description: 'Failed to create tag',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsCreatingTag(false);
    }
  };

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
      form.setValue('company_id', data.company_id || '');
      form.setValue('location', data.location || '');
      form.setValue('timezone', data.timezone || '');
      
      // If department_id is returned from API, set it
      if (data.department_id) {
        form.setValue('department_id', data.department_id);
      }
      
      // Call the onGoogleSync callback if provided
      if (onGoogleSync && typeof onGoogleSync === 'function') {
        const syncPreviewData = {
          profile_image_url: data.profile_image_url,
          first_name,
          last_name,
          ...data
        };
        onGoogleSync(syncPreviewData);
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
      let response;
      
      // If updating an existing contact
      if (contactId) {
        // Call the update API
        response = await fetch(`/api/contacts/update/${contactId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(values),
        });
      } 
      // Creating a new contact
      else {
        // Call the create API
        response = await fetch('/api/contacts/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(values),
        });
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save contact');
      }
      
      await response.json();
      
      toast({
        title: 'Success',
        description: contactId ? 'Contact updated successfully' : 'Contact created successfully',
      });
      
      // Redirect to contacts list
      router.push('/admin/contacts');
      router.refresh();
    } catch (error) {
      console.error('Error saving contact:', error);
      let errorMessage = 'Unknown error';
      
      if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = typeof error.message === 'string' ? error.message : 'Unknown error';
      }
      
      toast({
        title: 'Error',
        description: `Failed to save contact: ${errorMessage}`,
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
    isLoading,
    isCreatingTag,
    syncWithGoogle,
    createTag,
    onSubmit
  };
} 