'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Eye, 
  Pencil, 
  MoreVertical, 
  Copy, 
  Trash2, 
  CheckCircle, 
  XCircle 
} from 'lucide-react';
import { dashboardService } from '@/features/widgets/services/dashboard-service';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { widgetService as _widgetService } from '@/features/widgets/services/widget-service';

interface DashboardsTableProps {
  dashboards: Dashboard[];
  userId: string;
}

// Define Dashboard type locally if needed
type Dashboard = {
  id: string;
  name: string;
  created_by: string;
  is_published: boolean;
  is_default: boolean;
  updated_at: string | null;
  role_access: string[];
  // Add other properties as needed
};

export function DashboardsTable({ dashboards, userId }: DashboardsTableProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [searchTerm, _setSearchTerm] = useState('');
  const [roleFilter, _setRoleFilter] = useState<string | null>(null);
  const [statusFilter, _setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  
  // Group dashboards by role type
  const dashboardsByRole = useMemo(() => {
    // Apply filters
    const filteredDashboards = dashboards.filter(dashboard => {
      // Search filter
      if (searchTerm && !dashboard.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Role filter
      if (roleFilter && !dashboard.role_access.includes(roleFilter)) {
        return false;
      }
      
      // Status filter
      if (statusFilter === 'published' && !dashboard.is_published) {
        return false;
      } else if (statusFilter === 'draft' && dashboard.is_published) {
        return false;
      }
      
      return true;
    });
    
    // Group by role
    return filteredDashboards.reduce<Record<string, Dashboard[]>>((acc, dashboard) => {
      const role = dashboard.role_access[0] || 'No Role';
      if (!acc[role]) {
        acc[role] = [];
      }
      acc[role].push(dashboard);
      return acc;
    }, {});
  }, [dashboards, searchTerm, roleFilter, statusFilter]);
  
  // Handle dashboard publish/unpublish
  const handlePublishToggle = async (dashboard: Dashboard) => {
    try {
      const { error } = await dashboardService.updateDashboard(
        dashboard.id, 
        { is_published: !dashboard.is_published }
      );
      
      if (error) throw error;
      
      toast({
        title: dashboard.is_published ? 'Dashboard unpublished' : 'Dashboard published',
        description: `${dashboard.name} has been ${dashboard.is_published ? 'unpublished' : 'published'} successfully.`,
      });
      
      // Refresh the page to show updated data
      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to ${dashboard.is_published ? 'unpublish' : 'publish'} dashboard: ${(error as Error).message}`,
        variant: 'destructive',
      });
    }
  };
  
  // Handle dashboard deletion
  const handleDelete = async (dashboard: Dashboard) => {
    if (!confirm(`Are you sure you want to delete "${dashboard.name}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      const { error } = await dashboardService.deleteDashboard(dashboard.id);
      
      if (error) throw error;
      
      toast({
        title: 'Dashboard deleted',
        description: `${dashboard.name} has been deleted successfully.`,
      });
      
      // Refresh the page to show updated data
      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to delete dashboard: ${(error as Error).message}`,
        variant: 'destructive',
      });
    }
  };
  
  // Handle dashboard duplication
  const handleDuplicate = async (dashboard: Dashboard) => {
    try {
      // Use a method that actually exists on dashboardService
      const { data: _data, error } = await dashboardService.createDashboard({
        name: `${dashboard.name} (Copy)`,
        // Include other properties as needed for duplication
      }, userId);
      
      if (error) throw error;
      
      // Success notification
      toast({
        title: "Dashboard duplicated",
        description: "Dashboard has been successfully duplicated.",
      });
      
      // Refresh the data
      router.refresh();
    } catch (error) {
      console.error("Error duplicating dashboard:", error);
      toast({
        title: "Failed to duplicate dashboard",
        description: "There was an error duplicating the dashboard.",
        variant: "destructive",
      });
    }
  };
  
  // If no dashboards match the filters
  if (Object.keys(dashboardsByRole).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="rounded-full bg-muted p-3 mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6 text-muted-foreground"
          >
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <path d="M9 9h.01" />
            <path d="M15 9h.01" />
            <path d="M9 15h.01" />
            <path d="M15 15h.01" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold">No dashboards found</h3>
        <p className="text-muted-foreground mt-1 mb-4 max-w-md">
          {searchTerm || roleFilter || statusFilter !== 'all'
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
    <div className="space-y-8">
      {Object.entries(dashboardsByRole).map(([role, roleDashboards]) => (
        <div key={role} className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            {role}
            <Badge variant="outline" className="ml-2">
              {roleDashboards.length} {roleDashboards.length === 1 ? 'dashboard' : 'dashboards'}
            </Badge>
          </h2>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roleDashboards.map((dashboard) => (
                  <TableRow key={dashboard.id}>
                    <TableCell className="font-medium">{dashboard.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        Published
                      </Badge>
                      {dashboard.is_default && (
                        <Badge variant="outline" className="ml-2">Default</Badge>
                      )}
                    </TableCell>
                    <TableCell>{dashboard.created_by}</TableCell>
                    <TableCell>
                      {dashboard.updated_at
                        ? formatDistanceToNow(new Date(dashboard.updated_at), { addSuffix: true })
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/dashboards/${dashboard.id}`}>
                          <Button variant="ghost" size="icon" title="View Dashboard">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        
                        <Link href={`/admin/dashboards/${dashboard.id}/edit`}>
                          <Button variant="ghost" size="icon" title="Edit Dashboard">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handlePublishToggle(dashboard)}
                            >
                              {dashboard.is_published ? (
                                <>
                                  <XCircle className="mr-2 h-4 w-4" />
                                  <span>Unpublish</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  <span>Publish</span>
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDuplicate(dashboard)}
                            >
                              <Copy className="mr-2 h-4 w-4" />
                              <span>Duplicate</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(dashboard)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>Delete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ))}
    </div>
  );
} 