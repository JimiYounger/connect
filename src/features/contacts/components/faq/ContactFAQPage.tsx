'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, HelpCircle, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DepartmentFAQCard } from './DepartmentFAQCard';
import { CONTACT_METHODS, type ContactMethod, type DepartmentFAQ, type ContactFAQFilters } from '../../types/faq';

export function ContactFAQPage() {
  const [departments, setDepartments] = useState<DepartmentFAQ[]>([]);
  const [filters, setFilters] = useState<ContactFAQFilters>({
    searchQuery: '',
    contactMethod: null,
    selectedDepartment: null
  });
  const [isLoading, setIsLoading] = useState(true);
  const [expandedDepartment, setExpandedDepartment] = useState<string | null>(null);

  // Fetch departments with FAQ data and escalation contacts
  useEffect(() => {
    const fetchDepartmentsWithFAQ = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/contacts/list');
        
        if (!response.ok) {
          throw new Error('Failed to fetch departments and contacts');
        }

        const contacts = await response.json();
        
        // Group contacts by department and structure FAQ data
        const departmentMap = new Map<string, DepartmentFAQ>();
        
        contacts.forEach((contact: any) => {
          if (contact.department_id && contact.departments) {
            const deptId = contact.department_id;
            
            if (!departmentMap.has(deptId)) {
              departmentMap.set(deptId, {
                id: deptId,
                name: contact.departments.name,
                typical_questions: contact.departments.typical_questions || [],
                first_step_method: contact.departments.first_step_method || 'fresh_service',
                first_step_details: contact.departments.first_step_details || '',
                queue_name: contact.departments.queue_name,
                has_phone_line: contact.departments.has_phone_line || false,
                order_index: contact.departments.order_index || 0,
                escalation_contacts: []
              });
            }
            
            // Add escalation contact if applicable
            if (contact.is_escalation_contact) {
              departmentMap.get(deptId)?.escalation_contacts.push({
                id: contact.id,
                first_name: contact.first_name,
                last_name: contact.last_name,
                email: contact.email,
                phone: contact.phone,
                job_title: contact.job_title,
                escalation_role: contact.escalation_role,
                can_text: contact.can_text,
                profile_image_url: contact.profile_image_url
              });
            }
          }
        });

        const sortedDepartments = Array.from(departmentMap.values())
          .sort((a, b) => a.order_index - b.order_index);
        
        setDepartments(sortedDepartments);
      } catch (error) {
        console.error('Error fetching FAQ data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDepartmentsWithFAQ();
  }, []);

  // Filter departments based on search and filters
  const filteredDepartments = useMemo(() => {
    return departments.filter(dept => {
      // Search filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const matchesName = dept.name.toLowerCase().includes(query);
        const matchesQuestions = dept.typical_questions.some(q => 
          q.toLowerCase().includes(query)
        );
        if (!matchesName && !matchesQuestions) return false;
      }

      // Contact method filter
      if (filters.contactMethod && dept.first_step_method !== filters.contactMethod) {
        return false;
      }

      // Department filter
      if (filters.selectedDepartment && dept.id !== filters.selectedDepartment) {
        return false;
      }

      return true;
    });
  }, [departments, filters]);

  const handleSearch = (query: string) => {
    setFilters(prev => ({ ...prev, searchQuery: query }));
    setExpandedDepartment(null); // Collapse all when searching
  };

  const handleContactMethodFilter = (method: ContactMethod | 'all') => {
    setFilters(prev => ({ 
      ...prev, 
      contactMethod: method === 'all' ? null : method 
    }));
  };

  const clearFilters = () => {
    setFilters({
      searchQuery: '',
      contactMethod: null,
      selectedDepartment: null
    });
    setExpandedDepartment(null);
  };

  const hasActiveFilters = filters.searchQuery || filters.contactMethod || filters.selectedDepartment;

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 px-4 md:px-8 lg:max-w-6xl">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded mb-6"></div>
          <div className="h-12 bg-slate-200 rounded mb-4"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-slate-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 md:py-6 px-3 md:px-8 lg:max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <HelpCircle className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
            Contact FAQ
          </h1>
        </div>
        <p className="text-slate-600 text-sm md:text-base">
          Find the right department for your question and follow our streamlined contact process
        </p>
      </div>

      {/* How to Use Guide */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
          <ArrowRight className="h-4 w-4" />
          How to Use This Guide
        </h3>
        <ol className="text-sm text-blue-800 space-y-1 ml-6">
          <li>1. Find the department that matches your question</li>
          <li>2. Start with the recommended first step (ticket or chat)</li>
          <li>3. Escalate to individual contact only if unresponsive or truly urgent</li>
        </ol>
        <div className="mt-3 text-xs text-blue-700 bg-blue-100 rounded p-2">
          <strong>Why this order?</strong> Tickets keep requests visible to the whole team and build our knowledge base. Direct messages are for follow-ups, not first contact.
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
          <Input 
            placeholder="Search departments or questions..." 
            className="pl-10 bg-white border-slate-200 h-12"
            value={filters.searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        
        <div className="flex flex-col md:flex-row gap-3">
          <Select onValueChange={(value) => handleContactMethodFilter(value as ContactMethod | 'all')}>
            <SelectTrigger className="w-full md:w-64">
              <SelectValue placeholder="Filter by contact method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All contact methods</SelectItem>
              {Object.values(CONTACT_METHODS).map(method => (
                <SelectItem key={method.type} value={method.type}>
                  {method.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="outline"
              onClick={clearFilters}
              className="whitespace-nowrap"
            >
              Clear Filters
            </Button>
          )}
        </div>

        {/* Filter Status */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2">
            {filters.contactMethod && (
              <Badge variant="secondary">
                Method: {CONTACT_METHODS[filters.contactMethod].label}
              </Badge>
            )}
            {filters.searchQuery && (
              <Badge variant="secondary">
                Search: &ldquo;{filters.searchQuery}&rdquo;
              </Badge>
            )}
            <Badge variant="outline">
              {filteredDepartments.length} of {departments.length} departments
            </Badge>
          </div>
        )}
      </div>

      {/* FAQ Departments */}
      <div className="space-y-4">
        {filteredDepartments.length === 0 ? (
          <div className="text-center py-12">
            <HelpCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-600 mb-2">
              No departments found
            </h3>
            <p className="text-slate-500">
              Try adjusting your search or filters to find what you&rsquo;re looking for.
            </p>
          </div>
        ) : (
          filteredDepartments.map(department => (
            <DepartmentFAQCard
              key={department.id}
              department={department}
              isExpanded={expandedDepartment === department.id}
              onToggle={() => setExpandedDepartment(
                expandedDepartment === department.id ? null : department.id
              )}
              searchQuery={filters.searchQuery}
            />
          ))
        )}
      </div>
    </div>
  );
}