// src/features/carousel/components/BannerForm.tsx

'use client'

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import { UploadcareUploader } from "@/components/uploadcare-uploader"
import { VimeoGallery } from "@/features/vimeo/components/VimeoGallery"
import { useToast } from "@/hooks/use-toast"
import { useBanners } from "../hooks/useBanners"
import { BannerFormData, BannerFormDataWithId, bannerFormSchema } from '../types'
import { RoleSelector } from "./RoleSelector"
import { createBrowserClient } from "@supabase/ssr"
import { Loader2, X, Play } from "lucide-react"
import Image from "next/image"
import type { Database } from "@/types/supabase"

interface BannerFormProps {
  initialData?: Partial<BannerFormDataWithId>
  onSuccess?: () => void
  mode?: 'create' | 'edit'
}

export function BannerForm({ initialData, onSuccess, mode = 'create' }: BannerFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null)
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { toast } = useToast()
  const { banners, refetch } = useBanners()

  // Fetch the image URL when initialData changes
  useEffect(() => {
    if (initialData?.fileId) {
      // Fetch the file details to get the CDN URL
      supabase
        .from('files')
        .select('cdn_url')
        .eq('id', initialData.fileId)
        .single()
        .then(({ data, error }) => {
          if (!error && data) {
            setCurrentImageUrl(data.cdn_url)
          }
        })
    }
  }, [initialData?.fileId])

  const form = useForm<BannerFormData & { id?: string }>({
    resolver: zodResolver(bannerFormSchema),
    defaultValues: {
      title: '',
      description: '',
      isActive: true,
      clickBehavior: 'url',
      url: '',
      openInIframe: false,
      vimeoVideoId: '',
      vimeoVideoTitle: '',
      roles: [],
      ...initialData,
    },
  })

  // Load existing banner data if editing
  useEffect(() => {
    if (initialData?.id) {
      const banner = banners.find(b => b.id === initialData.id)
      if (banner) {
        form.reset({
          title: banner.title || "",
          description: banner.description || "",
          fileId: banner.file_id || "",
          isActive: banner.is_active || false,
          clickBehavior: banner.click_behavior as "video" | "url",
          url: banner.url || "",
          openInIframe: banner.open_in_iframe || false,
          vimeoVideoId: banner.vimeo_video_id || "",
          vimeoVideoTitle: banner.vimeo_video_title || "",
          startDate: banner.start_date ? new Date(banner.start_date) : null,
          endDate: banner.end_date ? new Date(banner.end_date) : null,
          roles: [], // TODO: Load roles from banner_roles table
        })
      }
    }
  }, [initialData?.id, banners, form])

  async function onSubmit(data: BannerFormData & { id?: string }) {
    setIsLoading(true)
    try {
      if (mode === 'edit' && initialData?.id) {
        // Update existing banner
        const { error: updateError } = await supabase
          .from('carousel_banners')
          .update({
            title: data.title,
            description: data.description || null,
            is_active: data.isActive,
            click_behavior: data.clickBehavior,
            url: data.url || null,
            open_in_iframe: data.openInIframe,
            vimeo_video_id: data.vimeoVideoId || null,
            vimeo_video_title: data.vimeoVideoTitle || null,
            file_id: data.fileId || null,
            start_date: data.startDate?.toISOString() || null,
            end_date: data.endDate?.toISOString() || null,
            order_index: data.orderIndex || null,
          })
          .eq('id', initialData.id)

        if (updateError) throw updateError

        // Update roles
        if (data.roles.length > 0) {
          await supabase
            .from('carousel_banner_roles')
            .delete()
            .eq('banner_id', initialData.id)

          const roleInserts = data.roles.map((role: string) => ({
            banner_id: initialData.id,
            role_type: role
          }))

          const { error: rolesError } = await supabase
            .from('carousel_banner_roles')
            .insert(roleInserts)

          if (rolesError) throw rolesError
        }

        toast({
          title: "Success",
          description: "Banner has been updated successfully.",
        })
      } else {
        // First, insert the file information
        const { data: fileData, error: fileError } = await supabase
          .from('files')
          .insert({
            uploadcare_uuid: data.fileId,
            cdn_url: `https://ucarecdn.com/${data.fileId}/`,
            mime_type: 'image/*', // You might want to get the actual mime type
            original_filename: 'banner-image', // You might want to get the actual filename
            size: 0, // You might want to get the actual file size
          })
          .select()
          .single()

        if (fileError) throw new Error(`File error: ${fileError.message}`)

        // Get the next order index
        const { data: existingBanners, error: fetchError } = await supabase
          .from('carousel_banners')
          .select('order_index')
          .order('order_index', { ascending: false })
          .limit(1)

        if (fetchError) throw new Error(fetchError.message)

        const nextOrderIndex = existingBanners?.[0]?.order_index 
          ? existingBanners[0].order_index + 1 
          : 0

        const bannerData = {
          title: data.title,
          description: data.description || null,
          is_active: data.isActive,
          click_behavior: data.clickBehavior,
          url: data.url || null,
          open_in_iframe: data.openInIframe,
          vimeo_video_id: data.vimeoVideoId || null,
          vimeo_video_title: data.vimeoVideoTitle || null,
          file_id: fileData.id, // Use the ID from the newly inserted file
          start_date: data.startDate ? new Date(data.startDate).toISOString() : null,
          end_date: data.endDate ? new Date(data.endDate).toISOString() : null,
          order_index: nextOrderIndex,
        }

        // Insert the banner
        const { data: newBanner, error: insertError } = await supabase
          .from('carousel_banners')
          .insert(bannerData)
          .select()
          .single()

        if (insertError) throw new Error(insertError.message)

        // If we have roles, insert them
        if (data.roles.length > 0 && newBanner) {
          const roleInserts = data.roles.map((role: string) => ({
            banner_id: newBanner.id,
            role_type: role
          }))

          const { error: rolesError } = await supabase
            .from('carousel_banner_roles')
            .insert(roleInserts)

          if (rolesError) throw new Error(rolesError.message)
        }

        toast({
          title: "Success",
          description: "Banner has been created successfully.",
        })
      }

      await refetch()
      onSuccess?.()
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: error instanceof Error 
          ? error.message 
          : "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const clickBehavior = form.watch("clickBehavior")

  const handleDeleteImage = () => {
    form.setValue('fileId', '')
    setCurrentImageUrl(null)
  }

  const handleVideoSelect = ({ id, title }: { id: string; title: string }) => {
    form.setValue('vimeoVideoId', id)
    form.setValue('vimeoVideoTitle', title)
    // Also set click behavior to video when a video is selected
    form.setValue('clickBehavior', 'video')
  }

  return (
    <Card className="p-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="Enter banner title"
                      disabled={isLoading}
                      aria-required="true"
                    />
                  </FormControl>
                  <FormDescription>
                    The title will be displayed on the banner
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
                      placeholder="Enter banner description"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fileId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Banner Image</FormLabel>
                  <FormControl>
                    <div className="space-y-4">
                      {currentImageUrl ? (
                        <div 
                          className="relative w-full rounded-lg border bg-background"
                          style={{ 
                            paddingTop: '56.25%' // 16:9 aspect ratio (9/16 = 0.5625)
                          }}
                        >
                          <div className="absolute inset-0">
                            <Image
                              src={currentImageUrl}
                              alt="Banner preview"
                              fill
                              className="object-cover rounded-lg"
                              sizes="(max-width: 768px) 100vw, 50vw"
                              priority
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-2 right-2 z-10"
                              onClick={handleDeleteImage}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <UploadcareUploader
                          onUpload={(fileInfo) => {
                            field.onChange(fileInfo.uuid)
                            setCurrentImageUrl(fileInfo.cdnUrl)
                          }}
                          className="w-full"
                        />
                      )}
                    </div>
                  </FormControl>
                  <FormDescription>
                    Upload an image for your banner. Recommended size: 1920x1080px
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="clickBehavior"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Click Behavior</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="url" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Open URL
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="video" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Play Video
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          {clickBehavior === "url" && (
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value || ""}
                      placeholder="https://example.com"
                      type="url"
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    The URL where users will be directed when clicking the banner
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {form.watch('clickBehavior') === 'video' && (
            <div className="space-y-4">
              {form.watch('vimeoVideoId') && form.watch('vimeoVideoTitle') && (
                <div className="rounded-lg border bg-muted/50 p-4">
                  <div className="font-medium text-sm mb-2">Selected Video:</div>
                  <div className="flex gap-4">
                    {/* Thumbnail with Play Button */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <div className="relative w-48 cursor-pointer group">
                          <div className="aspect-video bg-gray-100 rounded-md overflow-hidden">
                            <img 
                              src={`https://vumbnail.com/${form.watch('vimeoVideoId')}.jpg`}
                              alt={form.watch('vimeoVideoTitle') || 'Video thumbnail'}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-12 h-12 rounded-full bg-black/75 flex items-center justify-center">
                              <Play className="w-6 h-6 text-white fill-current" />
                            </div>
                          </div>
                        </div>
                      </DialogTrigger>
                      <DialogContent className="!max-w-dialog !w-dialog !h-dialog !p-0 overflow-hidden rounded-lg">
                        <DialogTitle className="sr-only">
                          {form.watch('vimeoVideoTitle') || 'Video Preview'}
                        </DialogTitle>
                        <DialogClose className="absolute right-4 top-4 z-50">
                          <div className="rounded-full bg-black/75 p-2 hover:bg-black/90 transition-colors">
                            <X className="h-6 w-6 text-white" />
                          </div>
                        </DialogClose>
                        <div className="w-full h-full">
                          <iframe
                            src={`https://player.vimeo.com/video/${form.watch('vimeoVideoId')}?autoplay=1&h=00000000`}
                            className="w-full h-full"
                            allow="autoplay; fullscreen; picture-in-picture"
                            title={form.watch('vimeoVideoTitle') || 'Video player'}
                          />
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Video Info */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">
                        {form.watch('vimeoVideoTitle')}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        ID: {form.watch('vimeoVideoId')}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          form.setValue('vimeoVideoId', '')
                          form.setValue('vimeoVideoTitle', '')
                        }}
                        className="mt-2"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Remove Video
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              <VimeoGallery 
                onVideoSelect={handleVideoSelect}
                selectedVideoId={form.watch('vimeoVideoId') || undefined}
              />
            </div>
          )}

          <div className="flex gap-4">
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date</FormLabel>
                  <FormControl>
                    <Input 
                      type="date"
                      onChange={(e) => {
                        const date = e.target.value ? new Date(e.target.value) : null
                        field.onChange(date)
                      }}
                      value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Date</FormLabel>
                  <FormControl>
                    <Input 
                      type="date"
                      onChange={(e) => {
                        const date = e.target.value ? new Date(e.target.value) : null
                        field.onChange(date)
                      }}
                      value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    Active
                  </FormLabel>
                  <FormDescription>
                    Enable or disable this banner
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
            name="roles"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Visible to Roles</FormLabel>
                <FormControl>
                  <RoleSelector
                    value={field.value}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormDescription>
                  Select which roles can see this banner. If none selected, banner will be visible to all.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onSuccess?.()}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !form.formState.isValid}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === 'edit' ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>{mode === 'edit' ? 'Update Banner' : 'Create Banner'}</>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </Card>
  )
} 