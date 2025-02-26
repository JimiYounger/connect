'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { ArrowLeft, ArrowRight, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { widgetService } from '@/features/widgets/services/widget-service';
import { useAuth } from '@/features/auth/context/auth-context';
import { useProfile } from '@/features/users/hooks/useProfile';
import { usePermissions } from '@/features/permissions/hooks/usePermissions';
import { hasPermissionLevel } from '@/features/permissions/constants/roles';
import { WidgetType, WidgetShape } from '@/features/widgets/types';
import { WidgetRenderer } from '@/features/widgets/components/widget-renderer';
import Link from 'next/link';

// Step components
import { TypeSelection } from './steps/type-selection';
import { BasicInformation } from './steps/basic-information';
import { WidgetConfiguration } from './steps/widget-configuration';
import { Appearance } from './steps/appearance';

// Validation schemas for each step
const typeSchema = z.object({
  widget_type: z.enum([
    WidgetType.REDIRECT, 
    WidgetType.DATA_VISUALIZATION, 
    WidgetType.INTERACTIVE_TOOL,
    WidgetType.CONTENT,
    WidgetType.EMBED,
    WidgetType.CUSTOM
  ]),
});

const basicInfoSchema = z.object({
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
});

// Dynamic schema based on widget type
const _getConfigSchema = (type: WidgetType) => {
  switch (type) {
    case WidgetType.REDIRECT:
      return z.object({
        config: z.object({
          redirectUrl: z.string().url('Must be a valid URL'),
          title: z.string().optional(),
          subtitle: z.string().optional(),
          description: z.string().optional(),
          settings: z.object({
            openInNewTab: z.boolean().default(true),
            trackClicks: z.boolean().default(true),
          }).optional(),
        }),
      });
    
    case WidgetType.DATA_VISUALIZATION:
      return z.object({
        config: z.object({
          dataSource: z.string().min(1, 'Data source is required'),
          title: z.string().optional(),
          subtitle: z.string().optional(),
          chartType: z.enum(['bar', 'line', 'pie', 'scatter', 'table']),
          refreshInterval: z.number().min(0).default(0),
          settings: z.object({
            showLegend: z.boolean().default(true),
            responsive: z.boolean().default(true),
          }).optional(),
        }),
      });
    
    case WidgetType.EMBED:
      return z.object({
        config: z.object({
          embedUrl: z.string().url('Must be a valid URL'),
          title: z.string().optional(),
          allowFullscreen: z.boolean().default(true),
          settings: z.object({
            allowScripts: z.boolean().default(false),
            responsive: z.boolean().default(true),
          }).optional(),
        }),
      });
    
    case WidgetType.INTERACTIVE_TOOL:
      return z.object({
        config: z.object({
          toolType: z.string().min(1, 'Tool type is required'),
          title: z.string().optional(),
          settings: z.record(z.any()).optional(),
        }),
      });
    
    default:
      return z.object({
        config: z.record(z.any()),
      });
  }
};

// Appearance schema
const _appearanceSchema = z.object({
  styles: z.object({
    backgroundColor: z.string().optional(),
    titleColor: z.string().optional(),
    textColor: z.string().optional(),
    borderRadius: z.string().optional(),
    padding: z.string().optional(),
    showTitle: z.boolean().default(true),
    showDescription: z.boolean().default(true),
  }),
});

// Combined schema
const combinedSchema = z.object({
  ...typeSchema.shape,
  ...basicInfoSchema.shape,
  config: z.record(z.any()),
  styles: z.record(z.any()),
});

type FormValues = z.infer<typeof combinedSchema>;

export default function NewWidgetPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState('type');
  const [isCreating, setIsCreating] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  
  // Auth and permissions
  const { session, loading } = useAuth();
  const { profile } = useProfile(session);
  const { userPermissions } = usePermissions(profile);
  
  // Form setup
  const methods = useForm<FormValues>({
    resolver: zodResolver(combinedSchema),
    defaultValues: {
      widget_type: WidgetType.REDIRECT,
      name: '',
      description: '',
      size_ratio: '1:1',
      shape: WidgetShape.SQUARE,
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
      },
    },
    mode: 'onChange',
  });
  
  const { watch, handleSubmit, setValue: _setValue, getValues: _getValues, trigger, formState } = methods;
  const { errors: _errors } = formState;
  
  // Watch for widget type changes to update schema
  const widgetType = watch('widget_type');
  
  // Preview widget
  const previewWidget = {
    id: 'preview',
    name: watch('name') || 'Widget Preview',
    description: watch('description') || 'This is a preview of your widget',
    widget_type: watch('widget_type'),
    created_at: new Date().toISOString(),
    created_by: session?.user.id || '',
    is_active: true,
    is_published: false,
    thumbnail_url: watch('thumbnail_url'),
    public: watch('is_public'),
  };
  
  // Preview config
  const previewConfig = {
    ...watch('config'),
    title: watch('name') || 'Widget Preview',
    description: watch('description') || 'This is a preview of your widget',
    styles: watch('styles'),
  };
  
  // Fetch categories
  useEffect(() => {
    async function fetchCategories() {
      const { data, error } = await widgetService.getWidgetCategories();
      if (error) {
        toast({
          title: "Error fetching categories",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      
      // Filter out categories with empty IDs
      const validCategories = (data || []).filter(category => category.id);
      setCategories(validCategories);
    }
    
    fetchCategories();
  }, [toast]);
  
  // Handle step change
  const handleStepChange = async (step: string) => {
    // Validate current step before proceeding
    let isValid = false;
    
    switch (currentStep) {
      case 'type':
        isValid = await trigger(['widget_type']);
        break;
      case 'info':
        isValid = await trigger(['name', 'description', 'category_id', 'size_ratio', 'shape']);
        break;
      case 'config':
        // Config validation depends on the widget type
        isValid = await trigger('config');
        break;
      case 'appearance':
        isValid = await trigger('styles');
        break;
      default:
        isValid = true;
    }
    
    if (!isValid && step !== currentStep) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before proceeding",
        variant: "destructive",
      });
      return;
    }
    
    setCurrentStep(step);
  };
  
  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    if (!session?.user.id) return;
    
    setIsCreating(true);
    
    try {
      // Create widget
      const { data: widget, error } = await widgetService.createWidget({
        name: data.name,
        description: data.description || '',
        widget_type: data.widget_type,
        created_by: session.user.id,
        category_id: data.category_id === 'uncategorized' ? undefined : data.category_id,
        thumbnail_url: data.thumbnail_url,
        is_public: data.is_public,
      });
      
      if (error) throw error;
      
      if (!widget) {
        throw new Error('Failed to create widget');
      }
      
      // Create widget configuration
      const configData = {
        ...data.config,
        title: data.name,
        description: data.description,
        styles: data.styles,
      };
      
      const { error: configError } = await widgetService.saveWidgetConfiguration(
        widget.id,
        { config: configData },
        session.user.id
      );
      
      if (configError) throw configError;
      
      toast({
        title: "Widget Created",
        description: "Your widget has been created successfully",
      });
      
      // Redirect to edit page
      router.push(`/admin/widgets/${widget.id}/edit`);
    } catch (err) {
      console.error('Error creating widget:', err);
      toast({
        title: "Error Creating Widget",
        description: (err as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
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

  // Permission check
  if (userPermissions?.roleType && !hasPermissionLevel('Admin', userPermissions.roleType)) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Permission Denied</h1>
          <p className="mt-2">You don&apos;t have permission to create widgets.</p>
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
        <div className="flex items-center gap-4">
          <Link href="/admin/widgets">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Widgets
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Create New Widget</h1>
        </div>
      </div>
      
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="md:col-span-3">
              <Tabs value={currentStep} onValueChange={handleStepChange}>
                <TabsList className="grid grid-cols-4 mb-4">
                  <TabsTrigger value="type">1. Type</TabsTrigger>
                  <TabsTrigger value="info">2. Information</TabsTrigger>
                  <TabsTrigger value="config">3. Configuration</TabsTrigger>
                  <TabsTrigger value="appearance">4. Appearance</TabsTrigger>
                </TabsList>
                
                <Card>
                  <TabsContent value="type">
                    <CardHeader>
                      <CardTitle>Select Widget Type</CardTitle>
                      <CardDescription>
                        Choose the type of widget you want to create
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <TypeSelection />
                    </CardContent>
                  </TabsContent>
                  
                  <TabsContent value="info">
                    <CardHeader>
                      <CardTitle>Basic Information</CardTitle>
                      <CardDescription>
                        Provide general information about your widget
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <BasicInformation categories={categories} />
                    </CardContent>
                  </TabsContent>
                  
                  <TabsContent value="config">
                    <CardHeader>
                      <CardTitle>Widget Configuration</CardTitle>
                      <CardDescription>
                        Configure settings specific to the {widgetType} widget type
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <WidgetConfiguration type={widgetType} />
                    </CardContent>
                  </TabsContent>
                  
                  <TabsContent value="appearance">
                    <CardHeader>
                      <CardTitle>Appearance</CardTitle>
                      <CardDescription>
                        Customize the visual appearance of your widget
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Appearance />
                    </CardContent>
                  </TabsContent>
                  
                  <CardFooter className="flex justify-between pt-4 border-t">
                    {currentStep !== 'type' ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          const steps = ['type', 'info', 'config', 'appearance'];
                          const currentIndex = steps.indexOf(currentStep);
                          if (currentIndex > 0) {
                            handleStepChange(steps[currentIndex - 1]);
                          }
                        }}
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Previous
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push('/admin/widgets')}
                      >
                        Cancel
                      </Button>
                    )}
                    
                    {currentStep !== 'appearance' ? (
                      <Button
                        type="button"
                        onClick={() => {
                          const steps = ['type', 'info', 'config', 'appearance'];
                          const currentIndex = steps.indexOf(currentStep);
                          if (currentIndex < steps.length - 1) {
                            handleStepChange(steps[currentIndex + 1]);
                          }
                        }}
                      >
                        Next
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                        disabled={isCreating}
                      >
                        {isCreating ? 'Creating...' : 'Create Widget'}
                        <Save className="ml-2 h-4 w-4" />
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              </Tabs>
            </div>
            
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Widget Preview</CardTitle>
                  <CardDescription>
                    This is how your widget will look
                  </CardDescription>
                </CardHeader>
                <CardContent className="border-t pt-4">
                  <div className="border rounded-md p-4 bg-gray-50">
                    <div 
                      className="bg-white rounded-md shadow-sm aspect-square max-w-xs mx-auto"
                      style={{
                        borderRadius: watch('styles.borderRadius') || '8px',
                        padding: watch('styles.padding') || '16px',
                        backgroundColor: watch('styles.backgroundColor') || '#ffffff'
                      }}
                    >
                      <WidgetRenderer
                        widget={previewWidget as any}
                        configuration={previewConfig}
                        width={300}
                        height={300}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </FormProvider>
    </div>
  );
} 