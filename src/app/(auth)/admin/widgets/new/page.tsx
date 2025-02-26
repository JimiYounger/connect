// my-app/src/app/(auth)/admin/widgets/new/page.tsx

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
import { WidgetType, WidgetShape, WidgetDisplayType } from '@/features/widgets/types';
import { WidgetRenderer as _WidgetRenderer } from '@/features/widgets/components/widget-renderer';
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
    '1:1', '2:1', '1:2', '3:2', '2:3', '4:3', '3:4', '2:2', '4:4', '2:4', '4:2'
  ] as const),
  shape: z.enum([
    WidgetShape.SQUARE, 
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
    customCSS: z.string().optional(),
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

// Utility function to calculate dimensions based on size ratio
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
      size_ratio: '2:2',
      shape: WidgetShape.SQUARE,
      is_public: true,
      config: {},
      styles: {
        backgroundColor: '#C6FC36',
        titleColor: '#000000',
        textColor: '#000000',
        borderRadius: '50px',
        padding: '30px',
        customCSS: ''
      },
    },
    mode: 'onChange',
  });
  
  const { watch, handleSubmit, setValue: _setValue, getValues: _getValues, trigger: _trigger, setError, formState } = methods;
  const { errors: _errors } = formState;
  
  // Watch for widget type changes to update schema
  const widgetType = watch('widget_type');
  const sizeRatio = watch('size_ratio');
  const widgetShape = watch('shape');
  
  // Calculate dimensions based on the selected size ratio
  const dimensions = calculateDimensions(sizeRatio);
  
  // Preview widget
  const _previewWidget = {
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
  const _previewConfig = {
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
  
  // Add an effect to ensure circle shapes only use square ratios
  useEffect(() => {
    // If the shape is a circle, ensure we're using a square ratio (1:1, 2:2, or 4:4)
    const currentShape = watch('shape');
    const currentSizeRatio = watch('size_ratio');
    
    if (currentShape === WidgetShape.CIRCLE) {
      if (currentSizeRatio !== '1:1' && currentSizeRatio !== '2:2' && currentSizeRatio !== '4:4') {
        methods.setValue('size_ratio', '2:2');
        toast({
          title: "Auto-adjusted ratio",
          description: "Circle shape requires a square ratio (1:1, 2:2, or 4:4)",
        });
      }
    }
  }, [watch, methods, toast]);
  
  // Handle step change
  const handleStepChange = (step: string) => {
    // Prevent form submission when changing steps
    // Validate the current step before allowing navigation
    if (step === 'info' && currentStep === 'type') {
      // Validate the type selection
      const typeResult = typeSchema.safeParse(_getValues());
      if (!typeResult.success) {
        setError('widget_type', { 
          type: 'manual', 
          message: 'Please select a widget type' 
        });
        return;
      }
    }
    
    // Other validation logic for other steps...
    
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
        display_type: WidgetDisplayType.IFRAME,
        is_public: true,
        is_published: true,
      });
      
      if (error) throw error;
      
      if (!widget) {
        throw new Error('Failed to create widget');
      }
      
      // Inside onSubmit function, before creating the widget configuration
      console.log('Original config data:', data.config);
      console.log('Widget name being used:', data.name);

      // Create widget configuration
      const configData = {
        ...data.config,
        // Only use widget name as title if no display title was provided
        title: data.config.title || data.name,
        description: data.description || data.config.description,
        styles: data.styles,
      };

      console.log('Final config data being saved:', configData);

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
                <TabsList className="grid w-full grid-cols-4">
                  {[
                    { value: 'type', label: '1. Type' },
                    { value: 'info', label: '2. Information' },
                    { value: 'config', label: '3. Configuration' },
                    { value: 'appearance', label: '4. Appearance' }
                  ].map((step) => (
                    <TabsTrigger
                      key={step.value}
                      value={step.value}
                      onClick={(e) => {
                        e.preventDefault();
                        handleStepChange(step.value);
                      }}
                      disabled={isCreating}
                    >
                      {step.label}
                    </TabsTrigger>
                  ))}
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
                        onClick={(e) => {
                          e.preventDefault();
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
                  <div
                    className="mx-auto flex flex-col justify-end overflow-hidden"
                    style={{
                      borderRadius: watch('shape') === WidgetShape.CIRCLE 
                        ? '50%' 
                        : '50px',
                      padding: '30px',
                      backgroundColor: watch('thumbnail_url') ? 'transparent' : (watch('styles.backgroundColor') || '#ffffff'),
                      backgroundImage: watch('thumbnail_url') ? `url(${watch('thumbnail_url')})` : 'none',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      width: `${dimensions.width}px`,
                      height: `${dimensions.height}px`,
                      maxWidth: '100%'
                    }}
                  >
                    {!watch('thumbnail_url') && (
                      <div className="flex flex-col items-start w-full pb-4">
                        <h3 
                          className="font-semibold text-2xl md:text-3xl" 
                          style={{ color: watch('styles.titleColor') || '#000000' }}
                        >
                          {watch('config.title') || watch('name') || 'Widget Title'}
                        </h3>
                        {watch('config.subtitle') && (
                          <p 
                            className="text-lg mt-1" 
                            style={{ color: watch('styles.textColor') || '#333333' }}
                          >
                            {watch('config.subtitle')}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="mt-2 text-center text-sm text-gray-500">
                    {sizeRatio} - {widgetShape}
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