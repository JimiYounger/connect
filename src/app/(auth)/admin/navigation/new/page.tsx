// my-app/src/app/(auth)/admin/navigation/new/page.tsx

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { ArrowLeft } from 'lucide-react'
import { useNavigation } from '@/features/navigation/hooks/useNavigation'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'

const navigationMenuSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  is_active: z.boolean().default(true),
})

type NavigationMenuFormValues = z.infer<typeof navigationMenuSchema>

export default function NewNavigationMenuPage() {
  const router = useRouter()
  const { createMenu } = useNavigation()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<NavigationMenuFormValues>({
    resolver: zodResolver(navigationMenuSchema),
    defaultValues: {
      name: '',
      description: '',
      is_active: true,
    },
  })

  const onSubmit = async (data: NavigationMenuFormValues) => {
    try {
      setIsSubmitting(true)
      const newMenu = await createMenu(data)
      toast({
        title: 'Success',
        description: 'Navigation menu created successfully.',
      })
      router.push(`/admin/navigation/${newMenu.id}`)
    } catch (_error) {
      toast({
        title: 'Error',
        description: 'Failed to create navigation menu.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="shrink-0 text-gray-700">
            <Link href="/admin/navigation">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">New Navigation Menu</h1>
            <p className="text-gray-500 mt-1">Create a new navigation menu</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <Card className="shadow-md bg-white text-black border-gray-200 rounded-[14px]">
        <CardHeader>
          <CardTitle className="text-gray-900">Menu Details</CardTitle>
          <CardDescription className="text-gray-500">
            Enter the details for your new navigation menu
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter menu name" className="max-w-md" />
                    </FormControl>
                    <FormDescription>
                      A unique name for this navigation menu
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
                        placeholder="Enter menu description (optional)"
                        className="max-w-md"
                      />
                    </FormControl>
                    <FormDescription>
                      Provide additional details about this menu
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-200 p-4 max-w-md">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active Status</FormLabel>
                      <FormDescription>
                        Enable or disable this navigation menu
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

              <div className="flex justify-end space-x-4 pt-4">
                <Button
                  variant="outline"
                  onClick={() => router.push('/admin/navigation')}
                  type="button"
                  className="border-gray-300 text-gray-700"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-gray-800 text-white hover:bg-gray-700"
                >
                  {isSubmitting ? 'Creating...' : 'Create Menu'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
} 