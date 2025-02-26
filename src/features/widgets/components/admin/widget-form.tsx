// my-app/src/features/widgets/components/admin/widget-form.tsx

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { widgetService } from '../../services/widget-service';
import { WidgetType, WidgetShape, WidgetConfigData, Widget } from '../../types';
import { WidgetRenderer } from '../widget-renderer';
import { Prompt } from '@/components/ui/prompt';

// Import form field components for different widget types
import { TypeSelection } from './form-fields/type-selection';
import { BasicInformation } from './form-fields/basic-information';
import { RedirectWidgetFields } from './form-fields/redirect-widget-fields';
import { DataVisualizationWidgetFields } from './form-fields/data-visualization-fields';
import { EmbedWidgetFields } from './form-fields/embed-widget-fields';
import { InteractiveToolWidgetFields } from './form-fields/interactive-tool-fields';
import { ContentWidgetFields } from './form-fields/content-widget-fields';
import { CustomWidgetFields } from './form-fields/custom-widget-fields';
import { AppearanceFields } from './form-fields/appearance-fields';

// Define the form value types
export interface WidgetFormValues {
  widget_type: WidgetType;
  name: string;
  description?: string;
  category_id?: string;
  size_ratio: '1:1' | '2:1' | '1:2' | '3:2' | '2:3' | '4:3' | '3:4';
  shape: WidgetShape;
  thumbnail_url?: string;
  is_public: boolean;
  config: {
    title?: string;
    subtitle?: string;
    description?: string;
    
    // Redirect widget specific
    redirectUrl?: string;
    
    // Data visualization specific
    dataSource?: string;
    chartType?: string;
    refreshInterval?: number;
    
    // Embed widget specific
    embedUrl?: string;
    allowFullscreen?: boolean;
    
    // Interactive tool specific
    toolType?: string;
    
    // Content widget specific
    content?: string;
    contentType?: string;
    
    // Settings for all types
    settings?: Record<string, any>;
  };
  styles: {
    backgroundColor: string;
    titleColor: string;
    textColor: string;
    borderRadius: string;
    padding: string;
    showTitle: boolean;
    showDescription: boolean;
    customCSS?: string;
  };
}

// Props for the WidgetForm component
export interface WidgetFormProps {
  initialData?: Widget & { config?: WidgetConfigData };
  onSubmit?: (data: WidgetFormValues) => Promise<void>;
  onCancel?: () => void;
  mode: 'create' | 'edit';
}

// Create validation schemas for different widget types
const baseSchema = z.object({
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
  size_ratio: z.enum(['1:1', '2:1', '1:2', '3:2', '2:3', '4:3', '3:4'] as const),
  shape: z.enum([WidgetShape.SQUARE, WidgetShape.RECTANGLE, WidgetShape.CIRCLE]),
  thumbnail_url: z.string().optional(),
  is_public: z.boolean().default(false),
  styles: z.object({
    backgroundColor: z.string(),
    titleColor: z.string(),
    textColor: z.string(),
    borderRadius: z.string(),
    padding: z.string(),
    showTitle: z.boolean(),
    showDescription: z.boolean(),
    customCSS: z.string().optional(),
  })
});

// Conditional schema based on widget type
const widgetFormSchema = z.discriminatedUnion('widget_type', [
  // Redirect widget
  z.object({
    widget_type: z.literal(WidgetType.REDIRECT),
    name: z.string().min(3),
    description: z.string().optional(),
    category_id: z.string().optional(),
    size_ratio: z.enum(['1:1', '2:1', '1:2', '3:2', '2:3', '4:3', '3:4'] as const),
    shape: z.enum([WidgetShape.SQUARE, WidgetShape.RECTANGLE, WidgetShape.CIRCLE]),
    thumbnail_url: z.string().optional(),
    is_public: z.boolean(),
    config: z.object({
      title: z.string().optional(),
      subtitle: z.string().optional(),
      description: z.string().optional(),
      redirectUrl: z.string().url('Must be a valid URL'),
      settings: z.record(z.any()).optional(),
    }),
    styles: z.object({
      backgroundColor: z.string(),
      titleColor: z.string(),
      textColor: z.string(),
      borderRadius: z.string(),
      padding: z.string(),
      showTitle: z.boolean(),
      showDescription: z.boolean(),
      customCSS: z.string().optional(),
    }),
  }),
  
  // Data visualization widget
  z.object({
    widget_type: z.literal(WidgetType.DATA_VISUALIZATION),
    name: z.string().min(3),
    description: z.string().optional(),
    category_id: z.string().optional(),
    size_ratio: z.enum(['1:1', '2:1', '1:2', '3:2', '2:3', '4:3', '3:4'] as const),
    shape: z.enum([WidgetShape.SQUARE, WidgetShape.RECTANGLE, WidgetShape.CIRCLE]),
    thumbnail_url: z.string().optional(),
    is_public: z.boolean(),
    config: z.object({
      title: z.string().optional(),
      subtitle: z.string().optional(),
      description: z.string().optional(),
      dataSource: z.string().url('Must be a valid API endpoint or data source URL'),
      chartType: z.string(),
      refreshInterval: z.number().min(0).optional(),
      settings: z.record(z.any()).optional(),
    }),
    styles: z.object({
      backgroundColor: z.string(),
      titleColor: z.string(),
      textColor: z.string(),
      borderRadius: z.string(),
      padding: z.string(),
      showTitle: z.boolean(),
      showDescription: z.boolean(),
      customCSS: z.string().optional(),
    }),
  }),
  
  // More widget types...
  // (For brevity I'm not including all types, but you would add them all here)
  
  // Default for all other widget types 
  baseSchema,
]);

/**
 * Reusable form component for creating and editing widgets
 */
export function WidgetForm({ initialData, onSubmit, onCancel, mode }: WidgetFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [currentTab, setCurrentTab] = useState('info');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [showUnsavedChangesPrompt, setShowUnsavedChangesPrompt] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  
  // Set up form with default values or initialData if we're editing
  const methods = useForm<WidgetFormValues>({
    resolver: zodResolver(widgetFormSchema) as any,
    defaultValues: initialData ? {
      widget_type: initialData.widget_type as WidgetType,
      name: initialData.name,
      description: initialData.description || '',
      category_id: initialData.category_id || '',
      size_ratio: (initialData.size_ratio as any) || '1:1',
      shape: initialData.shape as WidgetShape,
      thumbnail_url: initialData.thumbnail_url || '',
      is_public: !!initialData.is_public,
      config: initialData.config || {
        title: '',
        subtitle: '',
        description: '',
      },
      styles: initialData.config?.styles || {
        backgroundColor: '#ffffff',
        titleColor: '#000000',
        textColor: '#333333',
        borderRadius: '8px',
        padding: '16px',
        showTitle: true,
        showDescription: true,
      }
    } : {
      widget_type: WidgetType.REDIRECT,
      name: '',
      description: '',
      category_id: '',
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
      }
    },
    mode: 'onChange'
  });
  
  const { formState, watch, handleSubmit, reset } = methods;
  const widgetType = watch('widget_type');
  
  // Load categories for the select dropdown
  useEffect(() => {
    async function fetchCategories() {
      try {
        const { data, error } = await widgetService.getWidgetCategories();
        if (error) throw error;
        if (data) setCategories(data);
      } catch (err) {
        console.error('Error fetching categories:', err);
        toast({
          title: 'Error',
          description: 'Failed to load widget categories',
          variant: 'destructive',
        });
      }
    }
    
    fetchCategories();
  }, [toast]);
  
  // Track form dirty state for unsaved changes
  useEffect(() => {
    setIsDirty(formState.isDirty);
  }, [formState.isDirty]);
  
  // Create a preview widget based on form values
  const previewWidget = useMemo(() => {
    const formValues = watch();
    return {
      id: initialData?.id || 'preview',
      name: formValues.name || 'Widget Preview',
      description: formValues.description || 'This is a preview of your widget',
      widget_type: formValues.widget_type,
      created_at: initialData?.created_at || new Date().toISOString(),
      is_active: true,
      is_published: false,
      thumbnail_url: formValues.thumbnail_url,
      is_public: formValues.is_public,
      shape: formValues.shape,
      size_ratio: formValues.size_ratio,
      category_id: formValues.category_id || null,
      component_path: null,
      display_type: null,
    } as unknown as Widget;
  }, [watch, initialData]);
  
  // Create a preview configuration based on form values
  const previewConfig = useMemo(() => {
    const formValues = watch();
    
    // Convert boolean values to strings for compatibility
    const convertedStyles = {
      ...formValues.styles,
      showTitle: formValues.styles.showTitle ? 'true' : 'false',
      showDescription: formValues.styles.showDescription ? 'true' : 'false'
    };
    
    return {
      ...formValues.config,
      styles: convertedStyles
    } as unknown as WidgetConfigData;
  }, [watch]);
  
  // Handle tab change - validate current tab before allowing change
  const handleTabChange = async (value: string) => {
    // Create a mapping of tabs to fields that need validation
    const tabFields: Record<string, string[]> = {
      info: ['name', 'description', 'category_id', 'size_ratio', 'shape'],
      config: ['config'],
      appearance: ['styles'],
    };
    
    // Only validate when moving forward
    const currentTabIndex = ['type', 'info', 'config', 'appearance'].indexOf(currentTab);
    const nextTabIndex = ['type', 'info', 'config', 'appearance'].indexOf(value);
    
    if (nextTabIndex > currentTabIndex) {
      // Get fields to validate
      const fieldsToValidate = tabFields[currentTab] || [];
      
      // Validate the fields
      const isValid = await methods.trigger(fieldsToValidate as any);
      
      if (!isValid) {
        // Show toast error
        toast({
          title: 'Validation Error',
          description: 'Please fix the errors before proceeding',
          variant: 'destructive',
        });
        return;
      }
    }
    
    setCurrentTab(value);
  };
  
  // Form submission handler
  const onFormSubmit = async (data: WidgetFormValues) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      if (onSubmit) {
        await onSubmit(data);
      } else {
        if (mode === 'create') {
          // Create new widget
          const { data: createdWidget, error } = await widgetService.createWidget({
            name: data.name,
            description: data.description,
            widget_type: data.widget_type,
            category_id: data.category_id || undefined,
            thumbnail_url: data.thumbnail_url,
            is_public: data.is_public,
            created_by: "current-user-id" // You should get the actual user ID from your auth context
          });
          
          if (error) throw error;
          
          if (createdWidget) {
            // Create configuration for the widget
            await widgetService.createWidgetConfiguration(createdWidget.id, {
              name: data.name,
              config: {
                ...data.config,
                styles: data.styles,
              }
            });
            
            toast({
              title: 'Success',
              description: 'Widget created successfully',
            });
            
            router.push(`/admin/widgets/${createdWidget.id}/edit`);
          }
        } else if (mode === 'edit' && initialData) {
          // Update existing widget
          const { error } = await widgetService.updateWidget(initialData.id, {
            name: data.name,
            description: data.description,
            category_id: data.category_id || undefined,
            size_ratio: data.size_ratio,
            shape: data.shape,
            thumbnail_url: data.thumbnail_url,
            is_public: data.is_public,
          });
          
          if (error) throw error;
          
          // Update widget configuration
          await widgetService.createWidgetConfiguration(initialData.id, {
            name: data.name,
            config: {
              ...data.config,
              styles: data.styles,
            }
          });
          
          toast({
            title: 'Success',
            description: 'Widget updated successfully',
          });
          
          // Reset form to mark as pristine
          reset(data);
        }
      }
    } catch (err) {
      console.error('Error saving widget:', err);
      toast({
        title: 'Error',
        description: (err as Error).message || 'Failed to save widget',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Cancel handler
  const handleCancel = () => {
    if (isDirty) {
      setShowUnsavedChangesPrompt(true);
    } else {
      if (onCancel) {
        onCancel();
      } else {
        router.push('/admin/widgets');
      }
    }
  };
  
  // Render type-specific fields based on selected widget type
  const renderTypeSpecificFields = () => {
    switch (widgetType) {
      case WidgetType.REDIRECT:
        return <RedirectWidgetFields />;
      case WidgetType.DATA_VISUALIZATION:
        return <DataVisualizationWidgetFields />;
      case WidgetType.INTERACTIVE_TOOL:
        return <InteractiveToolWidgetFields />;
      case WidgetType.EMBED:
        return <EmbedWidgetFields />;
      case WidgetType.CONTENT:
        return <ContentWidgetFields />;
      case WidgetType.CUSTOM:
        return <CustomWidgetFields />;
      default:
        return null;
    }
  };
  
  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onFormSubmit)}>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="md:col-span-3">
            <Tabs value={currentTab} onValueChange={handleTabChange}>
              <TabsList className="grid grid-cols-4 mb-4">
                {mode === 'create' && <TabsTrigger value="type">1. Type</TabsTrigger>}
                <TabsTrigger value="info">{mode === 'create' ? '2. ' : ''}Information</TabsTrigger>
                <TabsTrigger value="config">{mode === 'create' ? '3. ' : ''}Configuration</TabsTrigger>
                <TabsTrigger value="appearance">{mode === 'create' ? '4. ' : ''}Appearance</TabsTrigger>
              </TabsList>
              
              <Card>
                {mode === 'create' && (
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
                )}
                
                <TabsContent value="info">
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                    <CardDescription>
                      Enter the details for your widget
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
                      Configure how your widget works and behaves
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {renderTypeSpecificFields()}
                  </CardContent>
                </TabsContent>
                
                <TabsContent value="appearance">
                  <CardHeader>
                    <CardTitle>Widget Appearance</CardTitle>
                    <CardDescription>
                      Customize the look and feel of your widget
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <AppearanceFields />
                  </CardContent>
                </TabsContent>
                
                <div className="flex justify-between items-center p-6 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                  
                  <div className="flex space-x-2">
                    <Button 
                      type="submit"
                      disabled={isSubmitting || !formState.isValid}
                    >
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {mode === 'create' ? 'Create Widget' : 'Save Changes'}
                      <Save className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </Tabs>
          </div>
          
          {/* Preview Column */}
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
                      widget={previewWidget}
                      configuration={previewConfig}
                      width={300}
                      height={300}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Widget Type Description */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>
                  {widgetType.charAt(0).toUpperCase() + widgetType.slice(1).replace('_', ' ')} Widget
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">
                  {getWidgetTypeDescription(widgetType)}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
      
      {/* Unsaved Changes Prompt */}
      <Prompt
        open={showUnsavedChangesPrompt}
        title="Unsaved Changes"
        description="You have unsaved changes. Are you sure you want to leave?"
        confirmText="Leave"
        cancelText="Stay"
        onConfirm={() => {
          setShowUnsavedChangesPrompt(false);
          if (onCancel) {
            onCancel();
          } else {
            router.push('/admin/widgets');
          }
        }}
        onCancel={() => setShowUnsavedChangesPrompt(false)}
      />
    </FormProvider>
  );
}

// Helper function to get description for widget types
function getWidgetTypeDescription(type: WidgetType): string {
  switch (type) {
    case WidgetType.REDIRECT:
      return 'Redirect widgets link users to other pages, tools, or resources when clicked.';
    case WidgetType.DATA_VISUALIZATION:
      return 'Data visualization widgets display charts, graphs, and other visual representations of data.';
    case WidgetType.INTERACTIVE_TOOL:
      return 'Interactive tool widgets allow users to input data, make selections, and receive responses.';
    case WidgetType.EMBED:
      return 'Embed widgets allow you to embed external content like videos, iframes, or other media.';
    case WidgetType.CONTENT:
      return 'Content widgets display formatted text, images, and other static content.';
    case WidgetType.CUSTOM:
      return 'Custom widgets allow for advanced functionality and custom code.';
    default:
      return 'Select a widget type to see its description.';
  }
} 