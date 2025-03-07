'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CalendarIcon, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'
import { useNavigation } from '@/features/navigation/hooks/useNavigation'
import type { NavigationItemWithChildren } from '../../types'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import { NavigationUrlBuilder } from './NavigationUrlBuilder'
import { RoleAssignment } from './RoleAssignment'

const navigationItemSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  url: z.string().min(1, 'URL is required'),
  description: z.string().optional(),
  parent_id: z.string(),
  is_public: z.boolean(),
  is_active: z.boolean(),
  is_external: z.boolean(),
  start_date: z.date().nullable(),
  end_date: z.date().nullable().refine(
    (date) => {
      if (!date) return true
      return date > new Date()
    },
    'End date must be in the future'
  ),
  order_index: z.number().int().min(0),
  roles: z.array(z.string())
})

type NavigationItemFormValues = z.infer<typeof navigationItemSchema>

interface NavigationItemFormProps {
  menuId: string
  itemId?: string | null
  onSubmit: (data: NavigationItemFormValues) => Promise<void>
  defaultValues?: Partial<NavigationItemFormValues>
}

export function NavigationItemForm({
  menuId,
  itemId,
  onSubmit,
  defaultValues = {
    title: '',
    url: '',
    description: '',
    is_public: true,
    is_active: true,
    is_external: false,
    parent_id: 'none',
    roles: [],
    order_index: 0,
    start_date: null,
    end_date: null,
  },
}: NavigationItemFormProps) {
  const [isUrlBuilderOpen, setIsUrlBuilderOpen] = useState(false)
  const { useNavigationItems } = useNavigation()
  const { data: items } = useNavigationItems(menuId)

  console.log('Form initialized with defaultValues:', defaultValues)
  console.log('Current items:', items)

  const form = useForm<NavigationItemFormValues>({
    resolver: zodResolver(navigationItemSchema),
    defaultValues,
  })

  // Add form state debugging
  const formState = form.formState
  console.log('Form State:', {
    isDirty: formState.isDirty,
    isSubmitting: formState.isSubmitting,
    errors: formState.errors
  })

  // Add watch for all fields to debug values
  const watchedFields = form.watch()
  console.log('Current form values:', watchedFields)

  const handleSubmit = async (data: NavigationItemFormValues) => {
    console.log('Form submission started with data:', data)
    
    try {
      const formattedData = {
        ...data,
        parent_id: data.parent_id === 'none' ? null : data.parent_id
      }
      console.log('Formatted data for submission:', formattedData)
      
      await onSubmit(formattedData)
      console.log('Form submission successful')
    } catch (error) {
      console.error('Form submission failed:', error)
      // Re-throw the error to be handled by the form's error boundary
      throw error
    }
  }

  const isPublic = form.watch('is_public')
  const isExternal = form.watch('is_external')

  // Filter out the current item and its children from parent options
  const availableParents = items?.filter(item => {
    if (!itemId) return true
    const isDescendant = (parent: NavigationItemWithChildren): boolean => {
      if (parent.id === itemId) return true
      return parent.children?.some(isDescendant) || false
    }
    return !isDescendant(item)
  })

  console.log('Available parent items:', availableParents)

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  placeholder="Enter title"
                  onChange={(e) => {
                    console.log('Title changed:', e.target.value)
                    field.onChange(e)
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL</FormLabel>
              <FormControl>
                <div className="flex space-x-2">
                  <Input
                    {...field}
                    placeholder={isExternal ? 'https://' : '/path/to/page'}
                    onChange={(e) => {
                      console.log('URL changed:', e.target.value)
                      field.onChange(e)
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      console.log('URL builder opened')
                      setIsUrlBuilderOpen(true)
                    }}
                    disabled={isExternal}
                  >
                    Build URL
                  </Button>
                </div>
              </FormControl>
              <FormDescription>
                {isExternal
                  ? 'Enter a complete URL for external links'
                  : 'Use the URL builder or enter a path manually'}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Enter description (optional)"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="parent_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Parent Item</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value || undefined}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a parent item (optional)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {availableParents?.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Make this a sub-item of another navigation item
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
          <FormField
            control={form.control}
            name="is_public"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Public Access</FormLabel>
                  <FormDescription>
                    Make this item visible to all users
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
            control={form.control}
            name="is_active"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Active Status</FormLabel>
                  <FormDescription>
                    Enable or disable this navigation item
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
            control={form.control}
            name="is_external"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    <div className="flex items-center space-x-2">
                      <ExternalLink className="h-4 w-4" />
                      <span>External Link</span>
                    </div>
                  </FormLabel>
                  <FormDescription>
                    Link to an external website
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

        {!isPublic && (
          <FormField
            control={form.control}
            name="roles"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role Access</FormLabel>
                <FormControl>
                  <RoleAssignment
                    value={field.value}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormDescription>
                  Select which roles can access this item
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Start Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value ? (
                          format(field.value, 'PPP')
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value || undefined}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date < new Date(new Date().setHours(0, 0, 0, 0))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  When this item becomes visible
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="end_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>End Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value ? (
                          format(field.value, 'PPP')
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value || undefined}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date < new Date(new Date().setHours(0, 0, 0, 0))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  When this item becomes hidden
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="order_index"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Order</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                />
              </FormControl>
              <FormDescription>
                Set the display order (lower numbers appear first)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-4">
          <Button 
            type="submit"
            onClick={() => {
              console.log('Submit button clicked')
              console.log('Current form values before submit:', form.getValues())
            }}
          >
            {itemId ? 'Update Item' : 'Create Item'}
          </Button>
        </div>
      </form>

      <NavigationUrlBuilder
        open={isUrlBuilderOpen}
        onOpenChange={setIsUrlBuilderOpen}
        onSelect={(url: string) => {
          console.log('URL selected from builder:', url)
          form.setValue('url', url)
          setIsUrlBuilderOpen(false)
        }}
      />
    </Form>
  )
} 