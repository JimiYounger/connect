'use client'

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { dashboardService } from '@/features/widgets/services/dashboard-service';
import { DashboardsTable } from './components/dashboards-table';
import { DashboardFilters } from './components/dashboard-filters';
import { Button } from '@/components/ui/button';
import { PlusIcon, RefreshCcw } from 'lucide-react';
import { DashboardsTableSkeleton } from './components/dashboards-table-skeleton';
import { ErrorDisplay } from '@/components/ui/error-display';
import { useAuth } from '@/features/auth/context/auth-context';
import { useProfile } from '@/features/users/hooks/useProfile';
import { usePermissions } from '@/features/permissions/hooks/usePermissions';
import { hasPermissionLevel } from '@/features/permissions/constants/roles';

export default function DashboardsPage() {
  const router = useRouter();
  const { session, loading } = useAuth();
  const { profile } = useProfile(session);
  const { userPermissions } = usePermissions(profile);
  
  const [dashboards, setDashboards] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Fetch dashboards
  useEffect(() => {
    async function fetchDashboards() {
      if (!session?.user.id) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const { data, error } = await dashboardService.getDashboardsByUser(
          session.user.id,
          { 
            // No filters initially - we'll apply them client-side
          }
        );
        
        if (error) throw error;
        
        setDashboards(data || []);
      } catch (err) {
        console.error('Error fetching dashboards:', err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    }
    
    if (session?.user.id) {
      fetchDashboards();
    }
  }, [session]);
  
  // Handle refresh
  const handleRefresh = () => {
    setIsLoading(true);
    router.refresh();
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
            Manage and configure dashboards for different user roles
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
            <Button size="sm" className="h-8 gap-1">
              <PlusIcon className="h-3.5 w-3.5" />
              <span>New Dashboard</span>
            </Button>
          </Link>
        </div>
      </div>
      
      <DashboardFilters />
      
      {isLoading ? (
        <DashboardsTableSkeleton />
      ) : error ? (
        <ErrorDisplay 
          title="Error loading dashboards" 
          error={error} 
          retry={handleRefresh}
        />
      ) : (
        <DashboardsTable 
          dashboards={dashboards} 
          userId={session.user.id}
        />
      )}
    </div>
  );
} 