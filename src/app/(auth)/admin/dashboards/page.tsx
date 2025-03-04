'use client'

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ErrorDisplay } from '@/components/ui/error-display';
import { PlusIcon, RefreshCcw, Search, Eye, Edit2, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/features/auth/context/auth-context';
import { useProfile } from '@/features/users/hooks/useProfile';
import { usePermissions } from '@/features/permissions/hooks/usePermissions';
import { hasPermissionLevel } from '@/features/permissions/constants/roles';
import { createClient } from '@/lib/supabase';
import { Tables } from '@/types/supabase';
import { formatDistanceToNow } from 'date-fns';

// Define dashboard type based on Supabase tables
type Dashboard = Tables<'dashboards'> & {
  active_version_count?: number;
  total_widgets?: number;
};

export default function DashboardsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session, loading } = useAuth();
  const { profile } = useProfile(session);
  const { userPermissions } = usePermissions(profile);
  
  // State for dashboards
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // State for filtering and pagination
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedRoleType, setSelectedRoleType] = useState<string>('all');
  const [roleTypes, setRoleTypes] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  
  const ITEMS_PER_PAGE = 12;
  
  // Create a supabase client
  const supabase = createClient();
  
  // Fetch dashboards
  useEffect(() => {
    async function fetchDashboards() {
      if (!session?.user.id) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Get query parameters
        const tabStatus = activeTab === 'active' ? true : 
                         activeTab === 'inactive' ? false : undefined;
        
        // Create base query
        let query = supabase
          .from('dashboards')
          .select(`
            *,
            dashboard_versions!inner(count)
          `, { count: 'exact' });
        
        // Apply filters
        if (searchQuery) {
          query = query.ilike('name', `%${searchQuery}%`);
        }
        
        if (selectedRoleType !== 'all') {
          query = query.eq('role_type', selectedRoleType);
        }
        
        if (tabStatus !== undefined) {
          query = query.eq('is_active', tabStatus);
        }
        
        // Apply pagination
        const from = (currentPage - 1) * ITEMS_PER_PAGE;
        const to = from + ITEMS_PER_PAGE - 1;
        
        query = query.range(from, to).order('created_at', { ascending: false });
        
        // Execute query
        const { data, error: fetchError, count } = await query;
        
        if (fetchError) throw fetchError;
        
        // Process results
        const processedDashboards = await Promise.all((data || []).map(async (dashboard: Tables<'dashboards'>) => {
          // Get active version count
          const { count: versionCount } = await supabase
            .from('dashboard_versions')
            .select('*', { count: 'exact' })
            .eq('dashboard_id', dashboard.id)
            .eq('is_active', true);
          
          // First get the active version IDs
          const { data: versionData } = await supabase
            .from('dashboard_versions')
            .select('id')
            .eq('dashboard_id', dashboard.id)
            .eq('is_active', true);
            
          // Then use those IDs to query widget placements
          const versionIds = versionData?.map(v => v.id) || [];
          
          const { count: widgetCount } = versionIds.length > 0 
            ? await supabase
                .from('widget_placements')
                .select('*', { count: 'exact' })
                .in('version_id', versionIds)
            : { count: 0 };  // If no versions, return count of 0
            
          return {
            ...dashboard,
            active_version_count: versionCount || 0,
            total_widgets: widgetCount || 0
          };
        }));
        
        setDashboards(processedDashboards);
        
        // Set total pages from count
        if (count !== null) {
          setTotalPages(Math.ceil(count / ITEMS_PER_PAGE));
        }
      } catch (err) {
        console.error('Error fetching dashboards:', err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    }
    
    // Fetch unique role types for filter
    async function fetchRoleTypes() {
      if (!session?.user.id) return;
      
      try {
        const { data, error } = await supabase
          .from('dashboards')
          .select('role_type')
          .not('role_type', 'is', null);
        
        if (error) throw error;
        
        // Get unique role types
        const uniqueRoleTypes = Array.from(new Set(data.map((item: { role_type: string }) => item.role_type))) as string[];
        setRoleTypes(uniqueRoleTypes);
      } catch (err) {
        console.error('Error fetching role types:', err);
      }
    }
    
    if (session?.user.id) {
      fetchDashboards();
      fetchRoleTypes();
    }
  }, [session, searchQuery, selectedRoleType, activeTab, currentPage, supabase]);
  
  // Handle refresh
  const handleRefresh = () => {
    setIsLoading(true);
    router.refresh();
  };
  
  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Reset to first page when searching
    setCurrentPage(1);
  };
  
  // Loading states
  if (loading.initializing) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-2">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Auth check
  if (!session) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p>Please sign in to access this page</p>
        </div>
      </div>
    );
  }

  // Profile and permissions loading
  if (!profile || !userPermissions) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-2">Loading user data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Permission check
  if (!hasPermissionLevel('Admin', userPermissions.roleType)) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Unauthorized</h2>
          <p>You don&apos;t have permission to access this page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboards</h1>
          <p className="text-muted-foreground">
            Create and manage dashboards for different user roles
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 gap-1"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCcw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
          
          <Link href="/admin/dashboards/new">
            <Button>
              <PlusIcon className="mr-2 h-4 w-4" />
              New Dashboard
            </Button>
          </Link>
        </div>
      </div>
      
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <TabsList>
            <TabsTrigger value="all">All Dashboards</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="inactive">Inactive</TabsTrigger>
          </TabsList>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <form onSubmit={handleSearch} className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search dashboards..."
                className="pl-8 h-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
            
            <div className="flex">
              <Button 
                variant={viewMode === 'grid' ? 'default' : 'outline'} 
                size="sm" 
                className="h-9 rounded-r-none"
                onClick={() => setViewMode('grid')}
              >
                <div className="grid grid-cols-2 gap-0.5 h-4 w-4">
                  <div className="bg-current rounded-sm"></div>
                  <div className="bg-current rounded-sm"></div>
                  <div className="bg-current rounded-sm"></div>
                  <div className="bg-current rounded-sm"></div>
                </div>
              </Button>
              <Button 
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm" 
                className="h-9 rounded-l-none"
                onClick={() => setViewMode('table')}
              >
                <div className="flex flex-col justify-between h-4 w-4">
                  <div className="h-0.5 w-full bg-current rounded-sm"></div>
                  <div className="h-0.5 w-full bg-current rounded-sm"></div>
                  <div className="h-0.5 w-full bg-current rounded-sm"></div>
                </div>
              </Button>
            </div>
            
            <Select
              value={selectedRoleType}
              onValueChange={(value) => {
                setSelectedRoleType(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue placeholder="Role Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Role Types</SelectItem>
                {roleTypes.map((roleType) => (
                  <SelectItem key={roleType} value={roleType}>
                    {roleType}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <TabsContent value="all" className="mt-0">
          {viewMode === 'grid' ? renderDashboardGrid() : renderDashboardTable()}
        </TabsContent>
        
        <TabsContent value="active" className="mt-0">
          {viewMode === 'grid' ? renderDashboardGrid() : renderDashboardTable()}
        </TabsContent>
        
        <TabsContent value="inactive" className="mt-0">
          {viewMode === 'grid' ? renderDashboardGrid() : renderDashboardTable()}
        </TabsContent>
      </Tabs>
    </div>
  );
  
  function renderDashboardGrid() {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-5 w-3/4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 w-full bg-gray-200 rounded mb-2"></div>
                <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
              </CardContent>
              <CardFooter>
                <div className="h-8 w-full bg-gray-200 rounded"></div>
              </CardFooter>
            </Card>
          ))}
        </div>
      );
    }
    
    if (error) {
      return (
        <ErrorDisplay 
          title="Error loading dashboards" 
          error={error} 
          retry={handleRefresh}
        />
      );
    }
    
    if (dashboards.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <div className="rounded-full bg-muted p-3 mb-4">
            <LayoutDashboard className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">No dashboards found</h3>
          <p className="text-muted-foreground mt-1 mb-4 max-w-md">
            {searchQuery || selectedRoleType !== 'all'
              ? "No dashboards match your current filters. Try adjusting your search criteria."
              : "You haven't created any dashboards yet. Get started by creating your first dashboard."}
          </p>
          <Link href="/admin/dashboards/new">
            <Button>Create Dashboard</Button>
          </Link>
        </div>
      );
    }
    
    return (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {dashboards.map((dashboard) => (
            <Card key={dashboard.id} className="overflow-hidden transition-all hover:shadow-md">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{dashboard.name}</CardTitle>
                  <Badge 
                    variant={dashboard.is_active ? "default" : "secondary"}
                    className={dashboard.is_active ? "bg-green-500 hover:bg-green-600" : ""}
                  >
                    {dashboard.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <CardDescription>
                  Role: {dashboard.role_type || "Not specified"}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {dashboard.description || 'No description available'}
                </p>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-muted/30 p-2 rounded">
                    <div className="text-muted-foreground">Active Versions</div>
                    <div className="font-medium">{dashboard.active_version_count}</div>
                  </div>
                  <div className="bg-muted/30 p-2 rounded">
                    <div className="text-muted-foreground">Widgets</div>
                    <div className="font-medium">{dashboard.total_widgets}</div>
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="flex justify-between border-t pt-4">
                <div className="text-xs text-muted-foreground">
                  Created {dashboard.created_at 
                    ? formatDistanceToNow(new Date(dashboard.created_at), { addSuffix: true })
                    : 'N/A'}
                </div>
                <div className="flex gap-2">
                  <Link href={`/dashboard/${dashboard.id}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="h-3.5 w-3.5 mr-1" />
                      Preview
                    </Button>
                  </Link>
                  <Link href={`/admin/dashboards/${dashboard.id}/edit`}>
                    <Button size="sm">
                      <Edit2 className="h-3.5 w-3.5 mr-1" />
                      Edit
                    </Button>
                  </Link>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
        
        {totalPages > 1 && (
          <Pagination className="mt-8">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
              
              {Array.from({ length: totalPages }).map((_, i) => {
                // Show first page, last page, and pages around current page
                if (
                  i === 0 || 
                  i === totalPages - 1 || 
                  (i >= currentPage - 2 && i <= currentPage + 2)
                ) {
                  return (
                    <PaginationItem key={i}>
                      <PaginationLink
                        isActive={currentPage === i + 1}
                        onClick={() => setCurrentPage(i + 1)}
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  );
                }
                
                // Show ellipsis
                if (
                  (i === 1 && currentPage > 3) ||
                  (i === totalPages - 2 && currentPage < totalPages - 3)
                ) {
                  return (
                    <PaginationItem key={i}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  );
                }
                
                return null;
              })}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </>
    );
  }
  
  function renderDashboardTable() {
    if (isLoading) {
      return (
        <div className="rounded-md border animate-pulse">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">Name</TableHead>
                <TableHead>Role Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Versions</TableHead>
                <TableHead>Widgets</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><div className="h-4 w-3/4 bg-gray-200 rounded"></div></TableCell>
                  <TableCell><div className="h-4 w-1/2 bg-gray-200 rounded"></div></TableCell>
                  <TableCell><div className="h-4 w-16 bg-gray-200 rounded"></div></TableCell>
                  <TableCell><div className="h-4 w-8 bg-gray-200 rounded"></div></TableCell>
                  <TableCell><div className="h-4 w-8 bg-gray-200 rounded"></div></TableCell>
                  <TableCell><div className="h-4 w-24 bg-gray-200 rounded"></div></TableCell>
                  <TableCell><div className="h-4 w-full bg-gray-200 rounded"></div></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      );
    }
    
    if (error) {
      return (
        <ErrorDisplay 
          title="Error loading dashboards" 
          error={error} 
          retry={handleRefresh}
        />
      );
    }
    
    if (dashboards.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <div className="rounded-full bg-muted p-3 mb-4">
            <LayoutDashboard className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">No dashboards found</h3>
          <p className="text-muted-foreground mt-1 mb-4 max-w-md">
            {searchQuery || selectedRoleType !== 'all'
              ? "No dashboards match your current filters. Try adjusting your search criteria."
              : "You haven't created any dashboards yet. Get started by creating your first dashboard."}
          </p>
          <Link href="/admin/dashboards/new">
            <Button>Create Dashboard</Button>
          </Link>
        </div>
      );
    }
    
    return (
      <>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">Name</TableHead>
                <TableHead>Role Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Versions</TableHead>
                <TableHead>Widgets</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dashboards.map((dashboard) => (
                <TableRow key={dashboard.id}>
                  <TableCell className="font-medium">{dashboard.name}</TableCell>
                  <TableCell>{dashboard.role_type || "Not specified"}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={dashboard.is_active ? "default" : "secondary"}
                      className={dashboard.is_active ? "bg-green-500 hover:bg-green-600" : ""}
                    >
                      {dashboard.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>{dashboard.active_version_count}</TableCell>
                  <TableCell>{dashboard.total_widgets}</TableCell>
                  <TableCell>
                    {dashboard.created_at
                      ? formatDistanceToNow(new Date(dashboard.created_at), { addSuffix: true })
                      : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/dashboard/${dashboard.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          Preview
                        </Button>
                      </Link>
                      <Link href={`/admin/dashboards/${dashboard.id}/edit`}>
                        <Button size="sm">
                          <Edit2 className="h-3.5 w-3.5 mr-1" />
                          Edit
                        </Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {totalPages > 1 && (
          <Pagination className="mt-8">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
              
              {Array.from({ length: totalPages }).map((_, i) => {
                // Show first page, last page, and pages around current page
                if (
                  i === 0 || 
                  i === totalPages - 1 || 
                  (i >= currentPage - 2 && i <= currentPage + 2)
                ) {
                  return (
                    <PaginationItem key={i}>
                      <PaginationLink
                        isActive={currentPage === i + 1}
                        onClick={() => setCurrentPage(i + 1)}
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  );
                }
                
                // Show ellipsis
                if (
                  (i === 1 && currentPage > 3) ||
                  (i === totalPages - 2 && currentPage < totalPages - 3)
                ) {
                  return (
                    <PaginationItem key={i}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  );
                }
                
                return null;
              })}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </>
    );
  }
} 