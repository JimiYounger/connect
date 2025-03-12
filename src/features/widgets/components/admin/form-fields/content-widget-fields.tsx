// my-app/src/features/widgets/components/admin/form-fields/content-widget-fields.tsx

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

export function ContentWidgetFields() {
  const { control, watch } = useFormContext();
  const contentType = watch('config.contentType');
  
  return (
    <div className="space-y-6">
      <FormField
        control={control}
        name="config.title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Content Title</FormLabel>
            <FormControl>
              <Input 
                placeholder="Content title" 
                {...field} 
              />
            </FormControl>
            <FormDescription>
              The title displayed above the content
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={control}
        name="config.contentType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Content Type</FormLabel>
            <Select 
              onValueChange={field.onChange} 
              defaultValue={field.value}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select content type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="text">Rich Text</SelectItem>
                <SelectItem value="markdown">Markdown</SelectItem>
                <SelectItem value="html">HTML</SelectItem>
                <SelectItem value="image">Image</SelectItem>
              </SelectContent>
            </Select>
            <FormDescription>
              The type of content to display
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      
      {contentType === 'image' ? (
        <FormField
          control={control}
          name="config.content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Image URL</FormLabel>
              <FormControl>
                <Input 
                  placeholder="https://example.com/image.jpg" 
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                URL of the image to display
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : (
        <FormField
          control={control}
          name="config.content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{contentType === 'text' ? 'Rich Text' : contentType === 'markdown' ? 'Markdown' : 'HTML'} Content</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder={`Enter ${contentType} content here...`}
                  {...field} 
                  className="min-h-[200px] font-mono"
                />
              </FormControl>
              <FormDescription>
                The content to display in the widget
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
      
      {contentType === 'image' && (
        <FormField
          control={control}
          name="config.settings.altText"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Alternative Text</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Description of the image" 
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                Accessible description of the image
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  );
} 