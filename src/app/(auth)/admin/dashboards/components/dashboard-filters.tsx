'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';

export function DashboardFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [role, setRole] = useState(searchParams.get('role') || 'all');
  const [status, setStatus] = useState(searchParams.get('status') || 'all');
  
  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (search) params.set('search', search);
    if (role && role !== 'all') params.set('role', role);
    if (status !== 'all') params.set('status', status);
    
    const newUrl = `/admin/dashboards${params.toString() ? `?${params.toString()}` : ''}`;
    router.push(newUrl, { scroll: false });
  }, [search, role, status, router]);
  
  // Clear all filters
  const handleClearFilters = () => {
    setSearch('');
    setRole('all');
    setStatus('all');
  };
  
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-end">
      <div className="grid gap-2 flex-1">
        <label htmlFor="search" className="text-sm font-medium">
          Search
        </label>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="search"
            placeholder="Search dashboards..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      
      <div className="grid gap-2 w-full sm:w-[180px]">
        <label htmlFor="role" className="text-sm font-medium">
          Role
        </label>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger id="role">
            <SelectValue placeholder="All roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="manager">Manager</SelectItem>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="guest">Guest</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid gap-2 w-full sm:w-[180px]">
        <label htmlFor="status" className="text-sm font-medium">
          Status
        </label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger id="status">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {(search || role !== 'all' || status !== 'all') && (
        <Button 
          variant="ghost" 
          onClick={handleClearFilters}
          className="h-10"
        >
          Clear filters
        </Button>
      )}
    </div>
  );
} 