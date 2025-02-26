// my-app/src/features/widgets/components/admin/form-fields/basic-information.tsx

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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { WidgetShape } from '../../../types';
import { ImageUpload } from '@/components/ui/uploadcare-uploader';

interface BasicInformationProps {
  categories: any[];
}

export function BasicInformation({ categories }: BasicInformationProps) {
  const { control, setValue } = useFormContext();
  
  return (
    <div className="space-y-6">
      <FormField
        control={control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Widget Name</FormLabel>
            <FormControl>
              <Input 
                placeholder="Enter widget name" 
                {...field} 
              />
            </FormControl>
            <FormDescription>
              A descriptive name for your widget
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description (optional)</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Enter a description" 
                {...field} 
                className="min-h-[100px]"
              />
            </FormControl>
            <FormDescription>
              A brief description of what this widget does
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={control}
        name="category_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Category (optional)</FormLabel>
            <Select 
              onValueChange={field.onChange} 
              defaultValue={field.value}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormDescription>
              Group widgets by category
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={control}
          name="shape"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Widget Shape</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value={WidgetShape.SQUARE} id="shape-square" />
                    <Label htmlFor="shape-square">Square</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value={WidgetShape.RECTANGLE} id="shape-rectangle" />
                    <Label htmlFor="shape-rectangle">Rectangle</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value={WidgetShape.CIRCLE} id="shape-circle" />
                    <Label htmlFor="shape-circle">Circle</Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormDescription>
                The overall shape of the widget
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={control}
          name="size_ratio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Size Ratio</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a size ratio" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="1:1">1:1 (Square)</SelectItem>
                  <SelectItem value="2:1">2:1 (Horizontal)</SelectItem>
                  <SelectItem value="1:2">1:2 (Vertical)</SelectItem>
                  <SelectItem value="3:2">3:2 (Horizontal)</SelectItem>
                  <SelectItem value="2:3">2:3 (Vertical)</SelectItem>
                  <SelectItem value="4:3">4:3 (Horizontal)</SelectItem>
                  <SelectItem value="3:4">3:4 (Vertical)</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                The width-to-height ratio of the widget
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      
      <FormField
        control={control}
        name="thumbnail_url"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Thumbnail Image</FormLabel>
            <FormControl>
              <ImageUpload
                value={field.value}
                onChange={(url) => setValue('thumbnail_url', url)}
              />
            </FormControl>
            <FormDescription>
              Upload a preview image for this widget (optional)
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={control}
        name="is_public"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Public Widget</FormLabel>
              <FormDescription>
                Make this widget available to all users
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