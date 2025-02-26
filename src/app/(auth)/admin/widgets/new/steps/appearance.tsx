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
import { Switch } from '@/components/ui/switch';
import { Slider as _Slider } from '@/components/ui/slider';
import { Label as _Label } from '@/components/ui/label';

export function Appearance() {
  const { control } = useFormContext();
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={control}
          name="styles.backgroundColor"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Background Color</FormLabel>
              <div className="flex space-x-2">
                <FormControl>
                  <Input
                    {...field}
                    placeholder="#ffffff"
                  />
                </FormControl>
                <div 
                  className="w-10 h-10 rounded border"
                  style={{ backgroundColor: field.value }}
                />
              </div>
              <FormDescription>
                Background color for the widget
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={control}
          name="styles.titleColor"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title Color</FormLabel>
              <div className="flex space-x-2">
                <FormControl>
                  <Input
                    {...field}
                    placeholder="#000000"
                  />
                </FormControl>
                <div 
                  className="w-10 h-10 rounded border"
                  style={{ backgroundColor: field.value }}
                />
              </div>
              <FormDescription>
                Color for the widget title
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={control}
          name="styles.textColor"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Text Color</FormLabel>
              <div className="flex space-x-2">
                <FormControl>
                  <Input
                    {...field}
                    placeholder="#333333"
                  />
                </FormControl>
                <div 
                  className="w-10 h-10 rounded border"
                  style={{ backgroundColor: field.value }}
                />
              </div>
              <FormDescription>
                Color for widget text content
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={control}
          name="styles.borderRadius"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Border Radius</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="8px"
                />
              </FormControl>
              <FormDescription>
                Rounded corners (e.g., 8px, 0.5rem)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      
      <FormField
        control={control}
        name="styles.padding"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Padding ({field.value || '16px'})</FormLabel>
            <FormControl>
              <Input
                {...field}
                placeholder="16px"
              />
            </FormControl>
            <FormDescription>
              Internal spacing (e.g., 16px, 1rem)
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={control}
          name="styles.showTitle"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Show Title</FormLabel>
                <FormDescription>
                  Display the widget title
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
          name="styles.showDescription"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Show Description</FormLabel>
                <FormDescription>
                  Display the widget description
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
      
      <FormField
        control={control}
        name="styles.customCSS"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Custom CSS</FormLabel>
            <FormControl>
              <Input
                {...field}
                placeholder="Additional CSS classes"
              />
            </FormControl>
            <FormDescription>
              Add custom CSS classes to the widget container
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
} 