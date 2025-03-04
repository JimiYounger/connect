// my-app/src/app/(auth)/admin/dashboards/[id]/edit/page.tsx

'use client'

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Eye, Plus, Calendar } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';
import { dashboardService } from '@/features/dashboards/services/dashboard-service';
import { useAuth } from '@/features/auth/context/auth-context';
import { useProfile } from '@/features/users/hooks/useProfile';
import { usePermissions } from '@/features/permissions/hooks/usePermissions';
import { hasPermissionLevel } from '@/features/permissions/constants/roles';
import Link from 'next/link';
import { WidgetLibrary } from '@/features/widgets/components/widget-library';
import { WidgetDndProvider } from '@/features/widgets/components/widget-library/widget-dnd-context';
import { DashboardGrid } from '@/features/dashboards/components/dashboard-grid';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import '@/features/widgets/styles/widget-library.css';
import { initializeWidgets } from '@/features/widgets/init-widgets';

// Form validation schema
const formSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().optional(),
  role_type: z.string(),
  is_active: z.boolean().default(true),
});

// Grid dimensions
const DESKTOP_GRID = { rows: 4, cols: 11 };
const MOBILE_GRID = { rows: 11, cols: 4 };

export default function EditDashboardPage() {
  const router = useRouter();
  const params = useParams();
  const dashboardId = params.id as string;
  const isNew = dashboardId === 'new';
  const { toast } = useToast();
  const { session } = useAuth();
  const { profile } = useProfile(session);
  const { userPermissions } = usePermissions(profile);
  
  const [currentTab, setCurrentTab] = useState('details');
  const [_dashboard, setDashboard] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [scheduledPublishDate, setScheduledPublishDate] = useState<Date | undefined>(undefined);
  const [desktopRows, setDesktopRows] = useState(DESKTOP_GRID.rows);
  const [mobileRows, setMobileRows] = useState(MOBILE_GRID.rows);
  
  // Form setup
  const methods = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      role_type: 'User',
      is_active: true,
    }
  });
  
  const { reset, handleSubmit } = methods;
  
  // Memoize the fetchDashboard function
  const fetchDashboard = useCallback(async () => {
    if (isNew) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await dashboardService.getDashboardById(dashboardId);
      
      if (error) {
        console.error('Error loading dashboard:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to load dashboard',
          variant: 'destructive',
        });
        router.push('/admin/dashboards');
        return;
      }

      if (!data) {
        toast({
          title: 'Not Found',
          description: 'Dashboard not found',
          variant: 'destructive',
        });
        router.push('/admin/dashboards');
        return;
      }

      setDashboard(data);
      reset({
        name: data.name,
        description: data.description || '',
        role_type: data.role_type,
        is_active: data.is_active ?? true,
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
      router.push('/admin/dashboards');
    } finally {
      setIsLoading(false);
    }
  }, [dashboardId, isNew, reset, toast, router]);

  // Use the memoized function in useEffect
  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]); // Only depend on the memoized function
  
  useEffect(() => {
    // Initialize all widgets when the page loads
    initializeWidgets();
  }, []);
  
  // Handle form submission
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      setIsSaving(true);
      
      let response;
      if (isNew) {
        response = await dashboardService.createDashboard({
          ...data,
          created_by: session?.user?.id,
        });
      } else {
        response = await dashboardService.updateDashboard(dashboardId, data);
      }

      if (response.error) {
        throw response.error;
      }

      if (!response.data) {
        throw new Error('No data returned from operation');
      }

      toast({
        title: 'Success',
        description: isNew ? 'Dashboard created' : 'Dashboard updated',
      });

      if (isNew && response.data) {
        router.push(`/admin/dashboards/${response.data.id}/edit`);
      }
    } catch (error) {
      console.error('Error saving dashboard:', error);
      toast({
        title: 'Error',
        description: 'Failed to save dashboard',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle publishing
  const handlePublish = async (scheduleDate: Date | undefined) => {
    try {
      const { error } = await dashboardService.publishDashboard(dashboardId, scheduleDate);
      
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: scheduleDate 
          ? `Dashboard scheduled for publication on ${scheduleDate.toLocaleString()}`
          : 'Dashboard published successfully.',
      });
      
      setShowPublishDialog(false);
      setScheduledPublishDate(undefined);
      router.refresh();
      
    } catch (error) {
      console.error('Error publishing dashboard:', error);
      toast({
        title: 'Error',
        description: 'Failed to publish dashboard. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-2">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Permission check
  if (!session || (userPermissions?.roleType && !hasPermissionLevel('Admin', userPermissions.roleType))) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Permission Denied</h1>
          <p className="mt-2">You don&apos;t have permission to edit dashboards.</p>
          <Button asChild className="mt-4">
            <Link href="/admin/dashboards">Back to Dashboards</Link>
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {isNew ? 'Create Dashboard' : 'Edit Dashboard'}
          </h1>
          <p className="text-muted-foreground">
            {isNew ? 'Create a new dashboard' : 'Edit dashboard details and layout'}
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/dashboards">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboards
          </Link>
        </Button>
      </div>
      
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <WidgetDndProvider onDragEnd={(widget, _configuration) => {
            console.log('Widget dragged:', widget);
          }}>
            {/* Widget Library - Horizontal at the top without redundant title */}
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="widget-library-container" style={{ height: '485px', overflowX: 'auto', overflowY: 'hidden' }}>
                  <WidgetLibrary
                    userId={session?.user?.id || ''}
                    className="h-full"
                  />
                </div>
              </CardContent>
            </Card>
            
            {/* Main Content Area */}
            <div className="space-y-6">
              {/* Dashboard Details Card - Only shown when "details" tab is active */}
              {currentTab === 'details' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Dashboard Details</CardTitle>
                    <CardDescription>
                      Edit the basic information for your dashboard
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        {...methods.register('name')}
                        placeholder="Enter dashboard name"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        {...methods.register('description')}
                        placeholder="Enter dashboard description"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="role_type">Access Level</Label>
                      <Select
                        onValueChange={(value) => methods.setValue('role_type', value)}
                        defaultValue={methods.getValues('role_type')}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select access level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="User">User</SelectItem>
                          <SelectItem value="Admin">Admin</SelectItem>
                          <SelectItem value="SuperAdmin">Super Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Dashboard Grid - Only shown when "desktop" or "mobile" tab is active */}
              {(currentTab === 'desktop' || currentTab === 'mobile') && (
                <Card>
                  <CardHeader>
                    <CardTitle>{currentTab === 'desktop' ? 'Desktop Layout' : 'Mobile Layout'}</CardTitle>
                    <CardDescription>
                      {currentTab === 'desktop' 
                        ? 'Design how your dashboard will look on desktop devices' 
                        : 'Design how your dashboard will look on mobile devices'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="dashboard-grid-container" style={{
                      gridTemplateColumns: `repeat(${currentTab === 'desktop' ? DESKTOP_GRID.cols : MOBILE_GRID.cols}, 74px)`,
                      gridAutoRows: '74px'
                    }}>
                      <DashboardGrid
                        layout={currentTab}
                        rows={currentTab === 'desktop' ? desktopRows : mobileRows}
                        cols={currentTab === 'desktop' ? DESKTOP_GRID.cols : MOBILE_GRID.cols}
                        dashboardId={dashboardId}
                        draftId={_dashboard?.current_draft?.id}
                        userId={session?.user?.id}
                        onPlacementChange={() => fetchDashboard()}
                      />
                    </div>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => currentTab === 'desktop' 
                        ? setDesktopRows(prev => prev + 1) 
                        : setMobileRows(prev => prev + 1)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Row
                    </Button>
                  </CardContent>
                </Card>
              )}
              
              {/* Tabs Navigation - Moved below the grid */}
              <Tabs value={currentTab} onValueChange={setCurrentTab} className="mt-6">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="desktop">Desktop Layout</TabsTrigger>
                  <TabsTrigger value="mobile">Mobile Layout</TabsTrigger>
                </TabsList>
              </Tabs>
              
              {/* Action Buttons - Moved to the bottom */}
              <div className="flex flex-wrap gap-4 mt-6 justify-end">
                <Button type="submit" disabled={isSaving} className="flex-1 md:flex-none">
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
                
                {!isNew && (
                  <>
                    <Button
                      variant="outline"
                      className="flex-1 md:flex-none"
                      onClick={() => window.open(`/dashboards/${dashboardId}/preview`, '_blank')}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Preview
                    </Button>
                    
                    <Button
                      variant="secondary"
                      className="flex-1 md:flex-none"
                      onClick={() => setShowPublishDialog(true)}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      Publish Options
                    </Button>
                  </>
                )}
              </div>
            </div>
          </WidgetDndProvider>
        </form>
      </FormProvider>
      
      {/* Publish Dialog */}
      <Dialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publish Dashboard</DialogTitle>
            <DialogDescription>
              Choose when to publish this dashboard
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Label>Schedule Publication (Optional)</Label>
            <DateTimePicker
              date={scheduledPublishDate}
              setDate={setScheduledPublishDate}
              className="mt-2"
            />
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPublishDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => handlePublish(scheduledPublishDate || undefined)}
            >
              {scheduledPublishDate ? 'Schedule Publication' : 'Publish Now'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
