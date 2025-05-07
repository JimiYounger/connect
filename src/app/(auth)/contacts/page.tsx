'use client';

import { useState, useEffect } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { ContactsDirectory } from '@/features/contacts/components/ContactsDirectory';
import { Input } from '@/components/ui/input';

export default function ContactsDirectoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<Array<{id: string, name: string}>>([]);
  const [departments, setDepartments] = useState<Array<{id: string, name: string}>>([]);
  
  // Fetch tags and departments for filtering
  useEffect(() => {
    // Function to fetch tags
    const fetchFilters = async () => {
      try {
        // This is a fallback - ideally, we'd get tags from the API directly
        const contactsResponse = await fetch('/api/contacts/list');
        if (contactsResponse.ok) {
          const contactsData = await contactsResponse.json();
          
          // Extract unique tags from contacts
          const tagMap = new Map();
          contactsData.forEach((contact: any) => {
            contact.tags?.forEach((tag: any) => {
              tagMap.set(tag.id, tag);
            });
          });
          setAvailableTags(Array.from(tagMap.values()));
          
          // Extract unique departments
          const deptMap = new Map();
          contactsData.forEach((contact: any) => {
            if (contact.department_id && contact.departments?.name) {
              deptMap.set(contact.department_id, {
                id: contact.department_id,
                name: contact.departments.name
              });
            }
          });
          setDepartments(Array.from(deptMap.values()));
        }
      } catch (error) {
        console.error('Error fetching filter data:', error);
      }
    };
    
    fetchFilters();
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDepartment(e.target.value || null);
  };

  const handleTagChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    // For simplicity we're just handling a single tag, but you could enhance this
    const value = e.target.value;
    setSelectedTags(value ? [value] : []);
  };

  return (
    <div className="container mx-auto py-6 px-4 md:px-8">
      <div className="mb-6">
        <p className="text-slate-600">
          Find and connect with team members across all departments
        </p>
      </div>
      
      <div className="mb-6">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
          <Input 
            placeholder="Search by name or job title..." 
            className="pl-10 bg-white border-slate-200"
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Department</label>
            <div className="relative">
              <select 
                className="w-full rounded-md border border-slate-200 py-2 pl-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                value={selectedDepartment || ''}
                onChange={handleDepartmentChange}
              >
                <option value="">All departments</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4 pointer-events-none" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Tags</label>
            <div className="relative">
              <select 
                className="w-full rounded-md border border-slate-200 py-2 pl-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                value={selectedTags[0] || ''}
                onChange={handleTagChange}
              >
                <option value="">Select tags</option>
                {availableTags.map((tag) => (
                  <option key={tag.id} value={tag.id}>
                    {tag.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
      
      <ContactsDirectory 
        initialFilters={{
          searchQuery,
          selectedDepartment,
          selectedTags
        }}
      />
    </div>
  );
} 