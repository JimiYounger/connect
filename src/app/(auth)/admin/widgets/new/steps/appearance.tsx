// my-app/src/app/(auth)/admin/widgets/new/steps/appearance.tsx

import { useFormContext } from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

// Define color options
const BACKGROUND_COLORS = [
  { value: '#222222', label: 'Dark Gray' },
  { value: '#C6FC36', label: 'Lime Green' },
  { value: '#39C0E0', label: 'Blue' },
];

const TEXT_COLORS = [
  { value: '#000000', label: 'Black' },
  { value: '#FFFFFF', label: 'White' },
];

export function Appearance() {
  const { control, setValue } = useFormContext();
  
  return (
    <div className="space-y-6">
      <FormField
        control={control}
        name="styles.backgroundColor"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Background Color</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value}
                className="flex flex-col space-y-3"
              >
                {BACKGROUND_COLORS.map((color) => (
                  <div key={color.value} className="flex items-center space-x-3">
                    <RadioGroupItem value={color.value} id={`bg-${color.value}`} />
                    <div 
                      className="w-8 h-8 rounded-full border"
                      style={{ backgroundColor: color.value }}
                    />
                    <Label htmlFor={`bg-${color.value}`}>{color.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </FormControl>
            <FormDescription>
              Select a background color for your widget
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
            <FormControl>
              <RadioGroup
                onValueChange={(value) => {
                  field.onChange(value);
                  // Automatically set text color to match title color for consistency
                  setValue('styles.textColor', value);
                }}
                defaultValue={field.value}
                className="flex space-x-4"
              >
                {TEXT_COLORS.map((color) => (
                  <div key={color.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={color.value} id={`title-${color.value}`} />
                    <div 
                      className="w-6 h-6 rounded border flex items-center justify-center"
                      style={{ 
                        backgroundColor: color.value === '#000000' ? 'white' : 'black',
                        color: color.value
                      }}
                    >
                      <span style={{ color: color.value }}>T</span>
                    </div>
                    <Label htmlFor={`title-${color.value}`}>{color.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </FormControl>
            <FormDescription>
              The title and text will use this color
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={control}
        name="styles.customCSS"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Custom CSS (Advanced)</FormLabel>
            <FormControl>
              <Textarea 
                {...field}
                placeholder=".widget-container { } /* Add custom styles */"
                className="font-mono text-sm h-32"
              />
            </FormControl>
            <FormDescription>
              Add custom CSS for advanced styling (optional)
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <div className="bg-muted p-4 rounded-md">
        <h4 className="text-sm font-medium mb-2">Standard Widget Styling</h4>
        <p className="text-sm text-muted-foreground">
          All widgets use a standard border radius of 34px and padding of 30px to maintain a consistent appearance.
        </p>
      </div>
    </div>
  );
} 