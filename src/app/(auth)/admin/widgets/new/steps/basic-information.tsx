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
import { Switch as _Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { WidgetShape } from '@/features/widgets/types';
import { ImageUpload } from '@/components/ui/uploadcare-uploader';
// import { Image } from '@/components/ui/image';

interface BasicInformationProps {
  categories: any[];
}

export function BasicInformation({ categories }: BasicInformationProps) {
  const { control, register: _register, formState, setValue: _setValue, watch: _watch } = useFormContext();
  const { errors: _errors } = formState;
  
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
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Describe what this widget does" 
                className="min-h-[100px]"
                {...field} 
              />
            </FormControl>
            <FormDescription>
              Help users understand the purpose of this widget
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
            <FormLabel>Category</FormLabel>
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
                <SelectItem value="uncategorized">Uncategorized</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormDescription>
              Categorize your widget for easier discovery
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Widget Dimensions</h3>
        
        <FormField
          control={control}
          name="shape"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Shape</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value={WidgetShape.SQUARE} id="shape-square" />
                    <Label htmlFor="shape-square">Square</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value={WidgetShape.CIRCLE} id="shape-circle" />
                    <Label htmlFor="shape-circle">Circle</Label>
                  </div>
                </RadioGroup>
              </FormControl>
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
                  <SelectItem value="1:1">1:1 (Square - Small)</SelectItem>
                  <SelectItem value="2:2">2:2 (Square - Medium)</SelectItem>
                  <SelectItem value="4:4">4:4 (Square - Large)</SelectItem>
                  <SelectItem value="2:1">2:1 (Wide)</SelectItem>
                  <SelectItem value="4:2">4:2 (Wide - Large)</SelectItem>
                  <SelectItem value="1:2">1:2 (Tall)</SelectItem>
                  <SelectItem value="2:4">2:4 (Tall - Large)</SelectItem>
                  <SelectItem value="3:2">3:2 (Standard)</SelectItem>
                  <SelectItem value="2:3">2:3 (Portrait)</SelectItem>
                  <SelectItem value="4:3">4:3 (Classic)</SelectItem>
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
                onChange={(url: string, fileId?: string) => {
                  _setValue('thumbnail_url', url);
                  if (fileId) {
                    _setValue('file_id', fileId);
                  }
                  
                  field.onChange(url);
                }}
              />
            </FormControl>
            <FormDescription>
              Upload a preview image for this widget (optional)
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
} 