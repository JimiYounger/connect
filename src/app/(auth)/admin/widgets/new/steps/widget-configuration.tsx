// my-app/src/app/(auth)/admin/widgets/new/steps/widget-configuration.tsx

import { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label as _Label } from '@/components/ui/label';
import { Slider as _Slider } from '@/components/ui/slider';
import { WidgetType } from '@/features/widgets/types';
import { RedirectWidgetFields } from '@/features/widgets/components/admin/form-fields/redirect-widget-fields';

interface WidgetConfigurationProps {
  type: WidgetType;
}

const SafeInput = ({ value, ...props }: { value: any } & React.ComponentProps<typeof Input>) => (
  <Input value={value || ''} {...props} />
);

const SafeTextarea = ({ value, ...props }: { value: any } & React.ComponentProps<typeof Textarea>) => (
  <Textarea value={value || ''} {...props} />
);

const SafeSwitch = ({ checked, ...props }: { checked: any } & React.ComponentProps<typeof Switch>) => (
  <Switch checked={!!checked} {...props} />
);

export function WidgetConfiguration({ type }: WidgetConfigurationProps) {
  const { control, watch, setValue } = useFormContext();
  const _config = watch('config') || {};
  
  // Initialize config based on widget type
  useEffect(() => {
    // Set default values for all config fields when type changes
    setValue('config.title', _config.title || '');
    setValue('config.subtitle', _config.subtitle || '');
    
    // Type-specific defaults
    if (type === WidgetType.REDIRECT) {
      setValue('config.redirectUrl', _config.redirectUrl || '');
      setValue('config.description', _config.description || '');
      setValue('config.settings.openInNewTab', true);
      setValue('config.settings.trackClicks', true);
      
      // Important: Initialize the full deep link structure before setting individual fields
      if (!_config.deepLink) {
        setValue('config.deepLink', {
          enabled: false,
          iosScheme: '',
          androidPackage: '',
          webFallbackUrl: _config.redirectUrl || ''
        });
      } else {
        // Ensure all deep link fields have values
        setValue('config.deepLink.enabled', _config.deepLink.enabled || false);
        setValue('config.deepLink.iosScheme', _config.deepLink.iosScheme || '');
        setValue('config.deepLink.androidPackage', _config.deepLink.androidPackage || '');
        setValue('config.deepLink.webFallbackUrl', _config.deepLink.webFallbackUrl || _config.redirectUrl || '');
      }
    } else if (type === WidgetType.DATA_VISUALIZATION) {
      setValue('config.dataSource', _config.dataSource || '');
      setValue('config.chartType', _config.chartType || '');
      setValue('config.refreshInterval', _config.refreshInterval || 0);
      setValue('config.settings.showLegend', _config.settings?.showLegend || false);
      setValue('config.settings.responsive', _config.settings?.responsive || true);
    }
    // Add defaults for other widget types...
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, setValue]);
  
  // Render type-specific configuration fields
  const renderTypeSpecificFields = () => {
    switch (type) {
      case WidgetType.REDIRECT:
        return <RedirectWidgetFields />;
        
      case WidgetType.DATA_VISUALIZATION:
        return (
          <>
            <FormField
              control={control}
              name="config.dataSource"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data Source</FormLabel>
                  <FormControl>
                    <SafeInput 
                      placeholder="API endpoint or data source identifier" 
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    The source of data for this visualization
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={control}
              name="config.chartType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chart Type</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select chart type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="bar">Bar Chart</SelectItem>
                      <SelectItem value="line">Line Chart</SelectItem>
                      <SelectItem value="pie">Pie Chart</SelectItem>
                      <SelectItem value="scatter">Scatter Plot</SelectItem>
                      <SelectItem value="table">Data Table</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose how to visualize the data
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={control}
              name="config.refreshInterval"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Refresh Interval (seconds)</FormLabel>
                  <FormControl>
                    <SafeInput 
                      type="number" 
                      min="0"
                      placeholder="0 (disabled)" 
                      {...field}
                      value={field.value ?? 0}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormDescription>
                    How often to refresh data (0 = no auto-refresh)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="space-y-4 mt-4">
              <h3 className="text-lg font-medium">Chart Settings</h3>
              
              <FormField
                control={control}
                name="config.settings.showLegend"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Show Legend</FormLabel>
                      <FormDescription>
                        Display a legend for the chart
                      </FormDescription>
                    </div>
                    <FormControl>
                      <SafeSwitch
                        checked={!!field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={control}
                name="config.settings.responsive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Responsive</FormLabel>
                      <FormDescription>
                        Automatically resize chart to fit container
                      </FormDescription>
                    </div>
                    <FormControl>
                      <SafeSwitch
                        checked={!!field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </>
        );
        
      case WidgetType.EMBED:
        return (
          <>
            <FormField
              control={control}
              name="config.embedUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Embed URL</FormLabel>
                  <FormControl>
                    <SafeInput 
                      placeholder="https://example.com/embed" 
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    URL of the content to embed (iframe)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={control}
              name="config.allowFullscreen"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 mt-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Allow Fullscreen</FormLabel>
                    <FormDescription>
                      Let users view the embedded content in fullscreen mode
                    </FormDescription>
                  </div>
                  <FormControl>
                    <SafeSwitch
                      checked={!!field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={control}
              name="config.settings.allowScripts"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 mt-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Allow Scripts</FormLabel>
                    <FormDescription>
                      Allow embedded content to run JavaScript (potentially unsafe)
                    </FormDescription>
                  </div>
                  <FormControl>
                    <SafeSwitch
                      checked={!!field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </>
        );
        
      case WidgetType.CONTENT:
        return (
          <>
            <FormField
              control={control}
              name="config.content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <SafeTextarea 
                      placeholder="Enter content to display in the widget" 
                      className="min-h-[200px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    The content to display in this widget
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={control}
              name="config.settings.allowHtml"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 mt-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Allow HTML</FormLabel>
                    <FormDescription>
                      Allow HTML in content (potentially unsafe)
                    </FormDescription>
                  </div>
                  <FormControl>
                    <SafeSwitch
                      checked={!!field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </>
        );
        
      case WidgetType.INTERACTIVE_TOOL:
        return (
          <>
            <FormField
              control={control}
              name="config.toolType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tool Type</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select tool type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="calculator">Calculator</SelectItem>
                      <SelectItem value="form">Form</SelectItem>
                      <SelectItem value="quiz">Quiz</SelectItem>
                      <SelectItem value="configurator">Configurator</SelectItem>
                      <SelectItem value="custom">Custom Tool</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The type of interactive tool
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={control}
              name="config.settings"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tool Settings (JSON)</FormLabel>
                  <FormControl>
                    <SafeTextarea 
                      placeholder="{}" 
                      className="font-mono text-sm min-h-[150px]"
                      {...field}
                      value={typeof field.value === 'object' ? JSON.stringify(field.value, null, 2) : (field.value || '{}')}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                        try {
                          const parsed = JSON.parse(e.target.value);
                          field.onChange(parsed);
                        } catch {
                          field.onChange(e.target.value);
                        }
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Tool-specific configuration settings in JSON format
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        );
        
      default:
        return (
          <div className="py-4 text-center text-muted-foreground">
            This widget type has no specific configuration options.
          </div>
        );
    }
  };
  
  return (
    <div className="space-y-6">
      <FormField
        control={control}
        name="config.title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Display Title</FormLabel>
            <FormControl>
              <SafeInput 
                placeholder="Widget title (shown to users)" 
                {...field}
              />
            </FormControl>
            <FormDescription>
              The title displayed to users (can be different from widget name)
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      
      {(type === WidgetType.REDIRECT || type === WidgetType.DATA_VISUALIZATION) && (
        <FormField
          control={control}
          name="config.subtitle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subtitle</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Optional subtitle" 
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormDescription>
                Secondary text displayed under the title
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
      
      {renderTypeSpecificFields()}
    </div>
  );
} 