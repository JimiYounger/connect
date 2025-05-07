'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Contact, Department } from '../types';

interface Tag {
  id: string;
  name: string;
}

interface ContactsDirectoryFilters {
  searchQuery: string;
  selectedDepartment: string | null;
  selectedTags: string[];
}

interface UseContactsDirectoryReturn {
  isLoading: boolean;
  error: string | null;
  contacts: Contact[];
  departments: Department[];
  tags: Tag[];
  filters: ContactsDirectoryFilters;
  setFilters: (filters: Partial<ContactsDirectoryFilters>) => void;
  filteredAndGroupedContacts: Array<{
    id: string;
    name: string;
    contacts: Contact[];
  }>;
  totalContacts: number;
  filteredContactsCount: number;
}

export function useContactsDirectory(
  initialContacts?: Contact[],
  initialDepartments?: Department[],
  initialTags?: Tag[]
): UseContactsDirectoryReturn {
  const [isLoading, setIsLoading] = useState(!initialContacts);
  const [error, setError] = useState<string | null>(null);
  const [contacts, setContacts] = useState<Contact[]>(initialContacts || []);
  const [departments, setDepartments] = useState<Department[]>(initialDepartments || []);
  const [tags, setTags] = useState<Tag[]>(initialTags || []);
  
  // Filter state
  const [filters, setFiltersState] = useState<ContactsDirectoryFilters>({
    searchQuery: '',
    selectedDepartment: null,
    selectedTags: [],
  });
  
  const setFilters = useCallback((newFilters: Partial<ContactsDirectoryFilters>) => {
    setFiltersState((prev) => ({
      ...prev,
      ...newFilters,
    }));
  }, []);
  
  useEffect(() => {
    // Skip fetching if data was provided as props
    if (initialContacts && initialDepartments && initialTags) {
      return;
    }
    
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch contacts from API
        const contactsResponse = await fetch('/api/contacts/list');
        
        if (!contactsResponse.ok) {
          throw new Error('Failed to fetch contacts');
        }
        
        const contactsData = await contactsResponse.json();
        setContacts(contactsData);
        
        // Extract unique departments from contacts (fallback if no separate department endpoint)
        const uniqueDepartments = Array.from(
          new Map(
            contactsData
              .filter((c: Contact) => c.department_id && c.departments?.name)
              .map((c: Contact) => [
                c.department_id,
                { id: c.department_id!, name: c.departments!.name },
              ])
          ).values()
        ) as Department[];
        
        setDepartments(uniqueDepartments);
        
        // Extract unique tags from contacts
        const allTags: Tag[] = [];
        contactsData.forEach((contact: Contact) => {
          contact.tags?.forEach((tag) => {
            if (!allTags.some((t) => t.id === tag.id)) {
              allTags.push(tag);
            }
          });
        });
        
        setTags(allTags);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load contacts. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [initialContacts, initialDepartments, initialTags]);
  
  // Filter and group contacts based on current filters
  const filteredAndGroupedContacts = useMemo(() => {
    // Apply filters
    const filtered = contacts.filter((contact) => {
      // Text search filter (name or job title)
      const matchesSearch = !filters.searchQuery
        ? true
        : (
            `${contact.first_name} ${contact.last_name}`.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
            (contact.job_title?.toLowerCase().includes(filters.searchQuery.toLowerCase()) ?? false)
          );
      
      // Department filter
      const matchesDepartment = !filters.selectedDepartment
        ? true
        : contact.department_id === filters.selectedDepartment;
      
      // Tags filter (contact must have ALL selected tags)
      const matchesTags = filters.selectedTags.length === 0
        ? true
        : filters.selectedTags.every((tagId) => 
            contact.tags?.some((tag) => tag.id === tagId) ?? false
          );
      
      return matchesSearch && matchesDepartment && matchesTags;
    });
    
    // Group by department
    const departmentMap = new Map<string, {
      id: string;
      name: string;
      contacts: Contact[];
    }>();
    
    // Add "No Department" group
    departmentMap.set('no-department', {
      id: 'no-department',
      name: 'No Department',
      contacts: []
    });
    
    // Group contacts by department
    filtered.forEach((contact) => {
      const departmentId = contact.department_id || 'no-department';
      const departmentName = contact.departments?.name || 'No Department';
      
      if (!departmentMap.has(departmentId)) {
        departmentMap.set(departmentId, {
          id: departmentId,
          name: departmentName,
          contacts: []
        });
      }
      
      departmentMap.get(departmentId)?.contacts.push(contact);
    });
    
    // Sort contacts within each department by order_index
    departmentMap.forEach((department) => {
      department.contacts.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
    });
    
    // Convert map to array and sort departments alphabetically
    return Array.from(departmentMap.values())
      .filter((dept) => dept.contacts.length > 0) // Remove empty departments
      .sort((a, b) => a.name.localeCompare(b.name));
      
  }, [contacts, filters.searchQuery, filters.selectedDepartment, filters.selectedTags]);
  
  // Calculate counts for stats
  const totalContacts = contacts.length;
  const filteredContactsCount = filteredAndGroupedContacts.reduce(
    (acc, dept) => acc + dept.contacts.length, 
    0
  );
  
  return {
    isLoading,
    error,
    contacts,
    departments,
    tags,
    filters,
    setFilters,
    filteredAndGroupedContacts,
    totalContacts,
    filteredContactsCount,
  };
} 