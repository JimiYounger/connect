'use client'

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { dashboardService } from '@/features/widgets/services/dashboard-service';
import { DashboardView } from '@/features/widgets/components/dashboard-view';
import { useAuth } from '@/features/auth/context/auth-context';
import { useProfile } from '@/features/users/hooks/useProfile';
import { usePermissions } from '@/features/permissions/hooks/usePermissions';
import { hasPermissionLevel } from '@/features/permissions/constants/roles';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  ArrowLeft, 
  Pencil, 
  Upload, 
  Smartphone, 
  Tablet, 
  Monitor,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export default function PreviewDashboardPage() {
  const params = useParams();
  const dashboardId = params.id as string;
  const router = useRouter();
  const { toast } = useToast();
  
  // Auth and permissions
  const { session, loading } = useAuth();
  const { profile } = useProfile(session);
  const { userPermissions } = usePermissions(profile);
  
  // Dashboard state
  const [dashboard, setDashboard] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Preview settings
  const [deviceSize, setDeviceSize] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [previewVersion, setPreviewVersion] = useState<'draft' | 'published'>('draft');
  
  // Publish dialog state
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [publishName, setPublishName] = useState('');
  const [publishDescription, setPublishDescription] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  
  // Fetch dashboard data
  useEffect(() => {
    async function fetchDashboard() {
      if (!dashboardId || !session?.user.id) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch dashboard details
        const { data, error } = await dashboardService.getDashboardById(dashboardId);
        
        if (error) throw error;
        
        if (!data) {
          throw new Error('Dashboard not found');
        }
        
        setDashboard(data);
        
        // Set default publish name if not already set
        if (!publishName) {
          setPublishName(`Version ${new Date().toLocaleDateString()}`);
        }
      } catch (err) {
        console.error('Error fetching dashboard:', err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    }
    
    if (session?.user.id) {
      fetchDashboard();
    }
  }, [dashboardId, session, publishName]);
  
  // Handle publish
  const handlePublish = async () => {
    if (!session) return;
    if (!publishName) {
      toast({
        title: 'Validation error',
        description: 'Please enter a version name',
        variant: 'destructive',
      });
      return;
    }
    
    setIsPublishing(true);
    
    try {
      // Use saveDraft and then updateDashboard to publish instead of non-existent publishDashboard
      const { error: draftError } = await dashboardService.saveDraftWidgetPlacements(
        dashboardId,
        [] // We're not changing placements, just publishing the current draft
      );
      
      if (draftError) throw draftError;
      
      // Update the dashboard to mark it as published
      const { error: publishError } = await dashboardService.updateDashboard(
        dashboardId,
        {
          is_published: true,
          name: publishName,
          description: publishDescription,
        }
      );
      
      if (publishError) throw publishError;
      
      toast({
        title: 'Dashboard published',
        description: 'Your dashboard has been published successfully.',
      });
      
      setPublishDialogOpen(false);
      router.push(`/admin/dashboards`);
    } catch (error) {
      console.error('Error publishing dashboard:', error);
      toast({
        title: 'Error',
        description: `Failed to publish dashboard: ${(error as Error).message}`,
        variant: 'destructive',
      });
    } finally {
      setIsPublishing(false);
    }
  };
  
  // Get device width based on selected size
  const getDeviceWidth = () => {
    switch (deviceSize) {
      case 'mobile':
        return 'max-w-[375px]';
      case 'tablet':
        return 'max-w-[768px]';
      case 'desktop':
      default:
        return 'max-w-full';
    }
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
  
  // Error state
  if (error) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex items-center gap-2 mb-6">
          <Link href="/admin/dashboards" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Preview Dashboard</h1>
        </div>
        
        <div className="bg-destructive/10 p-6 rounded-md text-center">
          <AlertTriangle className="h-10 w-10 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-destructive mb-2">Error Loading Dashboard</h3>
          <p className="text-sm text-destructive/90 mb-4">
            {error.message || 'An unexpected error occurred'}
          </p>
          <Button 
            variant="outline" 
            onClick={() => router.push('/admin/dashboards')}
          >
            Return to Dashboards
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Link 
            href={`/admin/dashboards/${dashboardId}/edit`} 
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">
            {isLoading ? 'Loading...' : `Preview: ${dashboard?.name}`}
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center border rounded-md p-1 bg-background">
            <Button
              variant={deviceSize === 'mobile' ? 'default' : 'ghost'}
              size="sm"
              className="h-8 px-2"
              onClick={() => setDeviceSize('mobile')}
              title="Mobile view"
            >
              <Smartphone className="h-4 w-4" />
            </Button>
            <Button
              variant={deviceSize === 'tablet' ? 'default' : 'ghost'}
              size="sm"
              className="h-8 px-2"
              onClick={() => setDeviceSize('tablet')}
              title="Tablet view"
            >
              <Tablet className="h-4 w-4" />
            </Button>
            <Button
              variant={deviceSize === 'desktop' ? 'default' : 'ghost'}
              size="sm"
              className="h-8 px-2"
              onClick={() => setDeviceSize('desktop')}
              title="Desktop view"
            >
              <Monitor className="h-4 w-4" />
            </Button>
          </div>
          
          <Select
            value={previewVersion}
            onValueChange={(value: 'draft' | 'published') => setPreviewVersion(value)}
          >
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue placeholder="Select version" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft Version</SelectItem>
              {dashboard?.is_published && (
                <SelectItem value="published">Published Version</SelectItem>
              )}
            </SelectContent>
          </Select>
          
          <Link href={`/admin/dashboards/${dashboardId}/edit`}>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-1"
            >
              <Pencil className="h-4 w-4" />
              <span>Edit</span>
            </Button>
          </Link>
          
          <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                size="sm" 
                className="gap-1"
              >
                <Upload className="h-4 w-4" />
                <span>Publish</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Publish Dashboard</DialogTitle>
                <DialogDescription>
                  This will create a new version of the dashboard that will be visible to users.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="version-name">Version Name *</Label>
                  <Input 
                    id="version-name" 
                    placeholder="e.g., Version 1.0"
                    value={publishName}
                    onChange={(e) => setPublishName(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="version-description">Description (Optional)</Label>
                  <Textarea 
                    id="version-description" 
                    placeholder="Enter a description for this version"
                    value={publishDescription}
                    onChange={(e) => setPublishDescription(e.target.value)}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setPublishDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handlePublish}
                  disabled={isPublishing || !publishName}
                >
                  {isPublishing ? 'Publishing...' : 'Publish'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {/* Preview banner */}
      <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 rounded-md flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          <span>
            This is a preview of the {previewVersion === 'draft' ? 'draft' : 'published'} version. 
            {previewVersion === 'draft' && !dashboard?.is_published && ' This dashboard has not been published yet.'}
          </span>
        </div>
        
        {previewVersion === 'draft' && (
          <Button 
            variant="outline" 
            size="sm" 
            className="bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100"
            onClick={() => setPublishDialogOpen(true)}
          >
            Publish Now
          </Button>
        )}
      </div>
      
      {/* Dashboard preview with responsive container */}
      <div className={`mx-auto ${getDeviceWidth()} transition-all duration-300`}>
        <div className="border rounded-lg overflow-hidden bg-white shadow">
          <DashboardView 
            dashboardId={dashboardId} 
            isDraft={previewVersion === 'draft'}
            className="p-4"
          />
        </div>
      </div>
    </div>
  );
} 