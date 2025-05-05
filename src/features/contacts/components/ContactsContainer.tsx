'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DepartmentGroup } from './DepartmentGroup';
import { Contact, Department } from '../types';

export function ContactsContainer() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<Array<Department & { contacts: Contact[] }>>([]);

  useEffect(() => {
    const fetchContacts = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch contacts from API
        const response = await fetch('/api/contacts/list');
        
        if (!response.ok) {
          throw new Error('Failed to fetch contacts');
        }
        
        const contacts = await response.json();
        
        // Group contacts by department
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
        contacts.forEach((contact: Contact) => {
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
        const sortedDepartments = Array.from(departmentMap.values())
          .sort((a, b) => a.name.localeCompare(b.name));
        
        setDepartments(sortedDepartments);
      } catch (err) {
        console.error('Error fetching contacts:', err);
        setError('Failed to load contacts. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchContacts();
  }, []);
  
  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  
  if (departments.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">No contacts found. Add some contacts to get started.</p>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      {departments.map((department) => (
        <DepartmentGroup 
          key={department.id} 
          department={department} 
        />
      ))}
    </div>
  );
} 