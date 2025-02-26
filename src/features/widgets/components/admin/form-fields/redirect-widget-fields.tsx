// my-app/src/features/widgets/components/admin/form-fields/redirect-widget-fields.tsx

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

export function RedirectWidgetFields() {
  const { control } = useFormContext();
  
  return (
    <div className="space-y-6">
      <FormField
        control={control}
        name="config.title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Display Title</FormLabel>
            <FormControl>
              <Input 
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
      
      <FormField
        control={control}
        name="config.subtitle"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Subtitle (optional)</FormLabel>
            <FormControl>
              <Input 
                placeholder="Brief subtitle or tagline" 
                {...field} 
              />
            </FormControl>
            <FormDescription>
              A short subtitle displayed under the title
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
                placeholder="More detailed description" 
                {...field} 
                className="min-h-[100px]"
              />
            </FormControl>
            <FormDescription>
              Additional text to help users understand this link
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={control}
        name="config.redirectUrl"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Redirect URL</FormLabel>
            <FormControl>
              <Input 
                placeholder="https://example.com/destination" 
                {...field} 
              />
            </FormControl>
            <FormDescription>
              The URL where users will be redirected when clicking this widget
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={control}
        name="config.settings.openInNewTab"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Open in New Tab</FormLabel>
              <FormDescription>
                Open the link in a new browser tab when clicked
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