// my-app/src/features/widgets/components/admin/form-fields/type-selection.tsx

import { useFormContext } from 'react-hook-form';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { WidgetType } from '../../../types';
import { 
  Link, 
  BarChart4, 
  ExternalLink, 
  Wrench,
  FileText, 
  Puzzle 
} from 'lucide-react';

export function TypeSelection() {
  const { register, setValue, watch } = useFormContext();
  const widgetType = watch('widget_type');
  
  const handleTypeSelect = (type: WidgetType) => {
    setValue('widget_type', type, { shouldValidate: true });
  };
  
  // Widget type options with icons and descriptions
  const typeOptions = [
    {
      id: WidgetType.REDIRECT,
      icon: <Link className="h-8 w-8 text-blue-500" />,
      title: 'Redirect',
      description: 'A simple widget that redirects users to another URL when clicked.'
    },
    {
      id: WidgetType.DATA_VISUALIZATION,
      icon: <BarChart4 className="h-8 w-8 text-green-500" />,
      title: 'Data Visualization',
      description: 'Displays data in charts, graphs, or other visual formats.'
    },
    {
      id: WidgetType.EMBED,
      icon: <ExternalLink className="h-8 w-8 text-purple-500" />,
      title: 'Embed',
      description: 'Embeds external content like iframes, videos, or other media.'
    },
    {
      id: WidgetType.INTERACTIVE_TOOL,
      icon: <Wrench className="h-8 w-8 text-orange-500" />,
      title: 'Interactive Tool',
      description: 'Interactive widgets with user inputs and dynamic behavior.'
    },
    {
      id: WidgetType.CONTENT,
      icon: <FileText className="h-8 w-8 text-red-500" />,
      title: 'Content',
      description: 'Static content like text, images, or formatted information.'
    },
    {
      id: WidgetType.CUSTOM,
      icon: <Puzzle className="h-8 w-8 text-indigo-500" />,
      title: 'Custom',
      description: 'A custom widget type with advanced configuration options.'
    },
  ];
  
  return (
    <div className="space-y-4">
      <input
        type="hidden"
        {...register('widget_type')}
      />
      
      <RadioGroup 
        value={widgetType}
        onValueChange={(value) => handleTypeSelect(value as WidgetType)}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {typeOptions.map((option) => (
          <div key={option.id} className="relative">
            <RadioGroupItem
              value={option.id}
              id={`type-${option.id}`}
              className="sr-only"
            />
            <Label
              htmlFor={`type-${option.id}`}
              className="cursor-pointer"
            >
              <Card className={`h-full transition-all ${widgetType === option.id ? 'border-primary ring-2 ring-primary/20' : 'hover:border-gray-300'}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    {option.icon}
                    <CardTitle className="text-xl">{option.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>{option.description}</CardDescription>
                </CardContent>
              </Card>
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
} 