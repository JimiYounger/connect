// my-app/src/app/(auth)/admin/dashboards/[id]/edit/page.tsx

'use client'

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { dashboardService } from '@/features/widgets/services/dashboard-service';
import { useDashboardEditor } from '@/features/widgets/hooks/use-dashboard-editor';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/features/auth/context/auth-context';
import { useProfile } from '@/features/users/hooks/useProfile';
import { usePermissions } from '@/features/permissions/hooks/usePermissions';
import { hasPermissionLevel } from '@/features/permissions/constants/roles';
import { Button } from '@/components/ui/button';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Upload, 
  AlertTriangle,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { WidgetPalette } from '@/features/widgets/components/admin/widget-palette';
import { DashboardEditor } from '@/features/widgets/components/admin/dashboard-editor';

export default function EditDashboardPage() {
  const params = useParams();
  const dashboardId = typeof params.id === 'string' ? params.id : '';
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
  
  // Publish dialog state
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [publishName, setPublishName] = useState('');
  const [publishDescription, setPublishDescription] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  
  // Unsaved changes warning
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  
  // Initialize dashboard editor
  const {
    layout,
    isDirty,
    addWidget,
    removeWidget: _removeWidget,
    updateWidgetPosition: _updateWidgetPosition,
    updateWidgetSize: _updateWidgetSize,
    saveDraft,
    publishDashboard,
    loadDraftLayout,
  } = useDashboardEditor({
    dashboardId,
    userId: session?.user.id || '',
    onSave: (_draftId) => {
      toast({
        title: 'Dashboard saved',
        description: 'Your changes have been saved as a draft.',
      });
    },
    onPublish: (_versionId) => {
      toast({
        title: 'Dashboard published',
        description: 'Your dashboard has been published successfully.',
      });
      setPublishDialogOpen(false);
      router.push(`/admin/dashboards/${dashboardId}`);
    },
  });
  
  // Fetch dashboard data
  useEffect(() => {
    async function fetchDashboard() {
      if (!dashboardId || dashboardId.trim() === '' || !session?.user.id) {
        setError(new Error('Invalid dashboard ID'));
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        setError(null);
        
        const { data, error } = await dashboardService.getDashboardById(dashboardId);
        
        if (error) throw error;
        
        if (!data) {
          throw new Error('Dashboard not found');
        }
        
        setDashboard(data);
        
        // Load draft layout
        await loadDraftLayout();
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
  }, [dashboardId, session, loadDraftLayout]);
  
  // Handle save
  const handleSave = async () => {
    await saveDraft();
  };
  
  // Handle publish
  const handlePublish = async () => {
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
      await publishDashboard(publishName, publishDescription);
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
  
  // Handle preview
  const handlePreview = () => {
    if (isDirty) {
      setShowUnsavedWarning(true);
    } else {
      router.push(`/admin/dashboards/${dashboardId}/preview`);
    }
  };
  
  // Handle widget drop
  const _handleWidgetDrop = useCallback((widget: any) => {
    addWidget(widget);
  }, [addWidget]);
  
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
          <h1 className="text-3xl font-bold tracking-tight">Edit Dashboard</h1>
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
          <Link href="/admin/dashboards" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">
            {isLoading ? 'Loading...' : `Edit: ${dashboard?.name}`}
          </h1>
          {isDirty && (
            <span className="text-sm text-amber-500 font-medium ml-2">
              (Unsaved changes)
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-1"
            onClick={handlePreview}
          >
            <Eye className="h-4 w-4" />
            <span>Preview</span>
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-1"
            onClick={handleSave}
            disabled={!isDirty || isLoading}
          >
            <Save className="h-4 w-4" />
            <span>Save Draft</span>
          </Button>
          
          <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                size="sm" 
                className="gap-1"
                disabled={isLoading}
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
                  {isPublishing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    'Publish'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <WidgetPalette
            userId={profile?.id || ''}
            onSelectWidget={addWidget}
          />
        </div>
        
        <div className="lg:col-span-3">
          <DashboardEditor 
            dashboardId={dashboardId}
            initialLayout={layout}
            onSave={() => saveDraft()}
            onPublish={() => setPublishDialogOpen(true)}
          />
        </div>
      </div>
      
      {/* Unsaved changes warning dialog */}
      <Dialog open={showUnsavedWarning} onOpenChange={setShowUnsavedWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unsaved Changes</DialogTitle>
            <DialogDescription>
              You have unsaved changes. What would you like to do?
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => setShowUnsavedWarning(false)}
            >
              Continue Editing
            </Button>
            <Button 
              variant="default"
              onClick={async () => {
                await saveDraft();
                setShowUnsavedWarning(false);
                router.push(`/admin/dashboards/${dashboardId}/preview`);
              }}
            >
              Save and Preview
            </Button>
            <Button 
              variant="secondary"
              onClick={() => {
                setShowUnsavedWarning(false);
                router.push(`/admin/dashboards/${dashboardId}/preview`);
              }}
            >
              Preview Without Saving
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 