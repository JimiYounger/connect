// my-app/src/features/widgets/components/admin/form-fields/interactive-tool-fields.tsx

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

export function InteractiveToolWidgetFields() {
  const { control, watch } = useFormContext();
  const toolType = watch('config.toolType');
  
  return (
    <div className="space-y-6">
      <FormField
        control={control}
        name="config.title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tool Title</FormLabel>
            <FormControl>
              <Input 
                placeholder="Interactive tool title" 
                {...field} 
              />
            </FormControl>
            <FormDescription>
              The title displayed above the tool
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
                placeholder="Brief description of what this tool does" 
                {...field} 
                className="min-h-[80px]"
              />
            </FormControl>
            <FormDescription>
              Explain what the tool does and how to use it
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      
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
                <SelectItem value="form">Interactive Form</SelectItem>
                <SelectItem value="search">Search Tool</SelectItem>
                <SelectItem value="quiz">Quiz</SelectItem>
                <SelectItem value="configurator">Configurator</SelectItem>
                <SelectItem value="custom">Custom Tool</SelectItem>
              </SelectContent>
            </Select>
            <FormDescription>
              Choose the type of interactive tool
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      
      {toolType === 'form' && (
        <FormField
          control={control}
          name="config.settings.formEndpoint"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Form Submission Endpoint</FormLabel>
              <FormControl>
                <Input 
                  placeholder="https://example.com/api/submit" 
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                API endpoint for form submissions
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
      
      {toolType === 'search' && (
        <FormField
          control={control}
          name="config.settings.searchEndpoint"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Search API Endpoint</FormLabel>
              <FormControl>
                <Input 
                  placeholder="https://example.com/api/search" 
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                API endpoint for search queries
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
      
      <div className="space-y-4 mt-4">
        <h3 className="text-lg font-medium">Tool Settings</h3>
        
        <FormField
          control={control}
          name="config.settings.storeResponses"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Store User Responses</FormLabel>
                <FormDescription>
                  Save user interactions with this tool
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
        
        <FormField
          control={control}
          name="config.settings.requireAuth"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Require Authentication</FormLabel>
                <FormDescription>
                  Users must be logged in to use this tool
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
    </div>
  );
} 