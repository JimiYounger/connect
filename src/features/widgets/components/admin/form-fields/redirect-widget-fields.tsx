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
import { DynamicUrlBuilder } from './dynamic-url-builder';

export function RedirectWidgetFields() {
  const { control, setValue } = useFormContext();
  
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
            <FormLabel>Dynamic Redirect URL</FormLabel>
            <FormControl>
              <DynamicUrlBuilder
                value={field.value || ''}
                onChange={(value) => {
                  field.onChange(value);
                  setValue('config.redirectUrl', value);
                }}
              />
            </FormControl>
            <FormDescription>
              The URL where users will be redirected. You can insert dynamic user fields that will be replaced with each user&apos;s data.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <div className="mt-4 p-3 bg-gray-50 rounded-md">
        <p className="text-sm text-muted-foreground">
          Links will automatically open in a new tab and track clicks for analytics.
        </p>
      </div>
    </div>
  );
} 