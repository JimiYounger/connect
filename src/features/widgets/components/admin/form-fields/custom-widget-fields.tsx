// my-app/src/features/widgets/components/admin/form-fields/custom-widget-fields.tsx

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
import { Switch } from '@/components/ui/switch';

export function CustomWidgetFields() {
  const { control } = useFormContext();
  
  return (
    <div className="space-y-6">
      <FormField
        control={control}
        name="config.title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Widget Title</FormLabel>
            <FormControl>
              <Input 
                placeholder="Widget title" 
                {...field} 
              />
            </FormControl>
            <FormDescription>
              The title displayed in the widget
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={control}
        name="config.description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description (optional)</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Brief description of the widget" 
                {...field} 
                className="min-h-[80px]"
              />
            </FormControl>
            <FormDescription>
              Describe what this custom widget does
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={control}
        name="config.settings.componentPath"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Component Path</FormLabel>
            <FormControl>
              <Input 
                placeholder="components/custom/MyCustomWidget" 
                {...field} 
              />
            </FormControl>
            <FormDescription>
              Path to the custom component (if applicable)
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={control}
        name="config.settings.configJson"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Configuration JSON</FormLabel>
            <FormControl>
              <Textarea 
                placeholder='{ "key": "value" }' 
                {...field} 
                className="min-h-[150px] font-mono"
              />
            </FormControl>
            <FormDescription>
              Custom configuration in JSON format
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={control}
        name="config.settings.enableDevMode"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Developer Mode</FormLabel>
              <FormDescription>
                Enable developer features for this widget
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );
} 