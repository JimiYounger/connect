// my-app/src/features/widgets/components/admin/form-fields/data-visualization-fields.tsx

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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';

export function DataVisualizationWidgetFields() {
  const { control, watch } = useFormContext();
  const _chartType = watch('config.chartType');
  
  return (
    <div className="space-y-6">
      <FormField
        control={control}
        name="config.title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Chart Title</FormLabel>
            <FormControl>
              <Input 
                placeholder="Chart title" 
                {...field} 
              />
            </FormControl>
            <FormDescription>
              The title displayed above the chart
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
                placeholder="Chart subtitle" 
                {...field} 
              />
            </FormControl>
            <FormDescription>
              Additional context about the chart data
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={control}
        name="config.dataSource"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Data Source URL</FormLabel>
            <FormControl>
              <Input 
                placeholder="https://api.example.com/data" 
                {...field} 
              />
            </FormControl>
            <FormDescription>
              API endpoint that returns chart data in JSON format
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
            <FormLabel>Refresh Interval (seconds): {field.value || 0}</FormLabel>
            <FormControl>
              <Slider
                min={0}
                max={300}
                step={15}
                defaultValue={[field.value || 0]}
                onValueChange={([value]) => field.onChange(value)}
              />
            </FormControl>
            <FormDescription>
              How often to refresh the data (0 = no auto-refresh)
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