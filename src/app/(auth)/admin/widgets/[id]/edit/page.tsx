// my-app/src/app/(auth)/admin/widgets/[id]/edit/page.tsx

'use client'

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Clock, Layout } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter,
  DialogHeader,
  DialogTitle,
  // Remove or rename DialogTrigger
  DialogTrigger as _DialogTrigger
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from '@/hooks/use-toast';
import { widgetService } from '@/features/widgets/services/widget-service';
import { useAuth } from '@/features/auth/context/auth-context';
import { useProfile } from '@/features/users/hooks/useProfile';
import { usePermissions } from '@/features/permissions/hooks/usePermissions';
import { hasPermissionLevel } from '@/features/permissions/constants/roles';
import { WidgetType, WidgetShape, WidgetSizeRatio } from '@/features/widgets/types';
import { WidgetRenderer } from '@/features/widgets/components/widget-renderer';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

// Step components
import { TypeSelection as _TypeSelection } from '../../new/steps/type-selection';
import { BasicInformation } from '../../new/steps/basic-information';
import { WidgetConfiguration } from '../../new/steps/widget-configuration';
import { Appearance } from '../../new/steps/appearance';

// Validation schemas (similar to the new widget page)
const formSchema = z.object({
  widget_type: z.enum([
    WidgetType.REDIRECT, 
    WidgetType.DATA_VISUALIZATION, 
    WidgetType.INTERACTIVE_TOOL,
    WidgetType.CONTENT,
    WidgetType.EMBED,
    WidgetType.CUSTOM
  ]),
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().optional(),
  category_id: z.string().optional(),
  size_ratio: z.enum([
    '1:1', '2:1', '1:2', '3:2', '2:3', '4:3', '3:4'
  ] as const),
  shape: z.enum([
    WidgetShape.SQUARE, 
    WidgetShape.RECTANGLE, 
    WidgetShape.CIRCLE
  ]),
  thumbnail_url: z.string().optional(),
  is_public: z.boolean().default(false),
  config: z.any(), // Will be validated dynamically based on widget type
  styles: z.object({
    backgroundColor: z.string().optional(),
    titleColor: z.string().optional(),
    textColor: z.string().optional(),
    borderRadius: z.string().optional(),
    padding: z.string().optional(),
    showTitle: z.boolean().optional(),
    showDescription: z.boolean().optional(),
    customCSS: z.string().optional(),
  }).optional(),
});

// Add the calculateDimensions utility function (same as in new/page.tsx)
const calculateDimensions = (ratio: string, maxSize: number = 300): { width: number, height: number } => {
  const [widthRatio, heightRatio] = ratio.split(':').map(Number);
  
  if (widthRatio >= heightRatio) {
    // Width is the limiting factor
    const width = maxSize;
    const height = (heightRatio / widthRatio) * maxSize;
    return { width, height };
  } else {
    // Height is the limiting factor
    const height = maxSize;
    const width = (widthRatio / heightRatio) * maxSize;
    return { width, height };
  }
};

export default function EditWidgetPage() {
  const router = useRouter();
  const params = useParams();
  const widgetId = params.id as string;
  const { toast } = useToast();
  const { session, loading } = useAuth();
  const { profile } = useProfile(session);
  const { userPermissions } = usePermissions(profile);
  
  const [currentTab, setCurrentTab] = useState('info');
  const [widget, setWidget] = useState<any>(null);
  const [widgetUsage, setWidgetUsage] = useState<any[]>([]);
  const [versions, setVersions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  
  // Set up form with default values
  const methods = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      widget_type: WidgetType.REDIRECT,
      name: '',
      description: '',
      category_id: '',
      size_ratio: '1:1' as const,
      shape: WidgetShape.SQUARE,
      thumbnail_url: '',
      is_public: false,
      config: {},
      styles: {
        backgroundColor: '#ffffff',
        titleColor: '#000000',
        textColor: '#333333',
        borderRadius: '8px',
        padding: '16px',
        showTitle: true,
        showDescription: true,
        customCSS: ''
      }
    }
  });
  
  const { reset, watch, handleSubmit, formState: _formState } = methods;
  const widgetType = watch('widget_type');
  
  // Load widget data
  useEffect(() => {
    const fetchWidgetData = async () => {
      setIsLoading(true);
      
      try {
        // Load widget details
        const { data: widgetData, error: widgetError } = await widgetService.getWidgetById(widgetId);
        
        if (widgetError) throw widgetError;
        if (!widgetData) throw new Error('Widget not found');
        
        setWidget(widgetData);
        
        // Load widget versions/configurations
        const { data: configurationsData, error: configError } = 
          await widgetService.getWidgetConfigurations(widgetId);
          
        if (!configError && configurationsData) {
          setVersions(configurationsData);
        }
        
        // Load widget usage
        const { data: usageData, error: usageError } = 
          await widgetService.getWidgetUsage(widgetId);
          
        if (!usageError && usageData) {
          setWidgetUsage(usageData);
        }
        
        // Load categories for the form
        const { data: categoriesData } = await widgetService.getWidgetCategories();
        if (categoriesData) {
          setCategories(categoriesData);
        }
        
        // Set form values from widget data
        reset({
          widget_type: widgetData.widget_type as WidgetType,
          name: widgetData.name,
          description: widgetData.description || '',
          category_id: widgetData.category_id || '',
          size_ratio: widgetData.size_ratio as WidgetSizeRatio || '1:1',
          shape: widgetData.shape as WidgetShape || WidgetShape.SQUARE,
          thumbnail_url: widgetData.thumbnail_url || '',
          is_public: widgetData.public || false,
          // Load config from the most recent configuration if available
          ...(configurationsData && configurationsData.length > 0 
            ? {
                config: configurationsData[0].config || {},
                styles: {} // Default empty styles
              }
            : {
                config: {},
                styles: {}
              }
          )
        });
        
      } catch (error) {
        console.error('Error loading widget:', error);
        toast({
          title: 'Error',
          description: 'Failed to load widget. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (session && widgetId) {
      fetchWidgetData();
    }
  }, [widgetId, session, reset, toast]);
  
  // Handle form submission
  const onSubmit = async (data: any) => {
    // If widget is used in dashboards, show warning before saving
    if (widgetUsage.length > 0 && !showWarningDialog) {
      setShowWarningDialog(true);
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Update widget basic info
      const widgetData = {
        name: data.name,
        description: data.description || '',
        widget_type: data.widget_type,
        category_id: data.category_id === 'uncategorized' || !data.category_id ? null : data.category_id,
        thumbnail_url: data.thumbnail_url,
        shape: data.shape,
        size_ratio: data.size_ratio,
        public: true,
      };
      
      const { error: updateError } = await widgetService.updateWidget(widget.id, widgetData);
      
      if (updateError) throw updateError;
      
      // Save new configuration version
      const { error: configError } = await widgetService.saveWidgetConfiguration(
        widget.id,
        {
          config: data.config,
        },
        session?.user?.id || 'unknown-user'
      );
      
      if (configError) throw configError;
      
      toast({
        title: 'Success',
        description: 'Widget updated successfully.',
      });
      
      // Refresh data
      router.refresh();
      
    } catch (error) {
      console.error('Error updating widget:', error);
      toast({
        title: 'Error',
        description: 'Failed to update widget. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
      setShowWarningDialog(false);
    }
  };
  
  const previewConfig = {
    ...watch('config'),
    styles: watch('styles'),
  };
  
  // Calculate dimensions based on the selected size ratio
  const sizeRatio = watch('size_ratio') || '1:1';
  const widgetShape = watch('shape') || WidgetShape.SQUARE;
  const dimensions = calculateDimensions(sizeRatio);
  
  // Loading states
  if (loading.initializing || isLoading) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-2">Loading widget...</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Permission check
  if (!session) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-center">
            <p>Please sign in to access this page.</p>
            <Button className="mt-4" asChild>
              <Link href="/auth/signin">Sign In</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  // Fix permission check
  if (userPermissions?.roleType && !hasPermissionLevel('Admin', userPermissions.roleType)) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Permission Denied</h1>
          <p className="mt-2">You don&apos;t have permission to edit widgets.</p>
          <Button asChild className="mt-4">
            <Link href="/admin/widgets">Back to Widgets</Link>
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Edit Widget</h1>
          <p className="text-muted-foreground">
            Edit the widget details and configuration
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/widgets">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Widgets
          </Link>
        </Button>
      </div>
      
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Tabs value={currentTab} onValueChange={setCurrentTab}>
                <TabsList className="grid grid-cols-4">
                  <TabsTrigger value="info">Basic Info</TabsTrigger>
                  <TabsTrigger value="config">Configuration</TabsTrigger>
                  <TabsTrigger value="appearance">Appearance</TabsTrigger>
                  <TabsTrigger value="usage">Usage & History</TabsTrigger>
                </TabsList>
                
                <TabsContent value="info">
                  <Card>
                    <CardHeader>
                      <CardTitle>Basic Information</CardTitle>
                      <CardDescription>
                        Edit the basic details of your widget
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <BasicInformation categories={categories} />
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="config">
                  <Card>
                    <CardHeader>
                      <CardTitle>Widget Configuration</CardTitle>
                      <CardDescription>
                        Configure how the widget will work
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <WidgetConfiguration type={widgetType} />
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="appearance">
                  <Card>
                    <CardHeader>
                      <CardTitle>Appearance</CardTitle>
                      <CardDescription>
                        Customize how the widget looks
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Appearance />
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="usage">
                  <Card>
                    <CardHeader>
                      <CardTitle>Usage & Version History</CardTitle>
                      <CardDescription>
                        See where this widget is being used and previous versions
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold mb-2 flex items-center">
                          <Layout className="mr-2 h-5 w-5" />
                          Dashboards Using This Widget
                        </h3>
                        {widgetUsage.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            This widget is not currently used in any dashboards.
                          </p>
                        ) : (
                          <ul className="divide-y">
                            {widgetUsage.map((usage) => (
                              <li key={usage.id} className="py-2">
                                <Link 
                                  href={`/admin/dashboards/${usage.dashboard_id}`}
                                  className="text-primary hover:underline"
                                >
                                  {usage.dashboard_name || 'Unnamed Dashboard'}
                                </Link>
                                <p className="text-sm text-muted-foreground">
                                  {usage.is_published ? 'Published' : 'Draft'} dashboard
                                </p>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-semibold mb-2 flex items-center">
                          <Clock className="mr-2 h-5 w-5" />
                          Version History
                        </h3>
                        {versions.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            No previous versions found.
                          </p>
                        ) : (
                          <ul className="divide-y">
                            {versions.map((version, index) => (
                              <li key={version.id} className="py-2">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium">
                                      Version {versions.length - index}
                                      {index === 0 && (
                                        <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                                          Current
                                        </span>
                                      )}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      Created {formatDistanceToNow(new Date(version.created_at), { addSuffix: true })}
                                    </p>
                                  </div>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    disabled={index === 0}
                                    onClick={() => {
                                      // Restore this version
                                      const configData = {
                                        config: version.config || {},
                                        styles: version.styles || {}
                                      };
                                      
                                      methods.setValue('config', configData.config);
                                      methods.setValue('styles', configData.styles);
                                      
                                      toast({
                                        title: 'Version Restored',
                                        description: 'Save changes to apply this version.',
                                      });
                                    }}
                                  >
                                    Restore
                                  </Button>
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <CardFooter className="flex justify-end space-x-4 mt-6">
                  <Button
                    type="submit"
                    disabled={isSaving}
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                    <Save className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Tabs>
            </div>
            
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Widget Preview</CardTitle>
                  <CardDescription>
                    This is how your widget will look
                  </CardDescription>
                </CardHeader>
                <CardContent className="border-t pt-4">
                  <div 
                    className="bg-white rounded-md shadow-sm mx-auto flex items-center justify-center overflow-hidden"
                    style={{
                      borderRadius: widget.shape === 'circle' ? '50%' : (watch('styles.borderRadius') || '8px'),
                      padding: watch('styles.padding') || '16px',
                      backgroundColor: watch('styles.backgroundColor') || '#ffffff',
                      backgroundImage: widget.thumbnail_url ? `url(${widget.thumbnail_url})` : 'none',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      width: `${dimensions.width}px`,
                      height: `${dimensions.height}px`,
                      maxWidth: '100%'
                    }}
                  >
                    {!widget.thumbnail_url && (
                      <WidgetRenderer
                        widget={widget}
                        configuration={previewConfig}
                        width={dimensions.width}
                        height={dimensions.height}
                      />
                    )}
                  </div>
                  <div className="mt-2 text-center text-sm text-gray-500">
                    {sizeRatio} - {widgetShape}
                  </div>
                </CardContent>
              </Card>
              
              {widget && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Widget Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <span className="text-sm font-medium">ID:</span>
                      <span className="text-sm ml-2 text-muted-foreground">{widget.id}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Type:</span>
                      <span className="text-sm ml-2 text-muted-foreground">{widget.widget_type}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Created:</span>
                      <span className="text-sm ml-2 text-muted-foreground">
                        {formatDistanceToNow(new Date(widget.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Status:</span>
                      <span className={`text-sm ml-2 ${widget.is_published ? 'text-green-600' : 'text-amber-600'}`}>
                        {widget.is_published ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Used in:</span>
                      <span className="text-sm ml-2 text-muted-foreground">
                        {widgetUsage.length} dashboard{widgetUsage.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </form>
      </FormProvider>
      
      {/* Warning dialog for editing widgets used in dashboards */}
      <Dialog open={showWarningDialog} onOpenChange={setShowWarningDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Warning: This widget is used in dashboards
            </DialogTitle>
            <DialogDescription>
              Changes to this widget will affect {widgetUsage.length} dashboard{widgetUsage.length !== 1 ? 's' : ''}.
              Are you sure you want to continue?
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Alert variant="destructive">
              <AlertTitle>Usage Warning</AlertTitle>
              <AlertDescription>
                This widget is being used in {widgetUsage.length} dashboard(s).
                Changing it may affect how it appears in those dashboards.
              </AlertDescription>
            </Alert>
            
            <div className="mt-4 max-h-40 overflow-auto">
              <h4 className="font-medium mb-2">Affected dashboards:</h4>
              <ul className="text-sm space-y-1">
                {widgetUsage.map((usage) => (
                  <li key={usage.id}>
                    • {usage.dashboard_name || 'Unnamed Dashboard'} {usage.is_published ? '(Published)' : '(Draft)'}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowWarningDialog(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => {
                setShowWarningDialog(false);
                handleSubmit(onSubmit)();
              }}
            >
              Proceed Anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 