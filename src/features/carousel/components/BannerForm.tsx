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
import { UploadcareUploader } from "@/components/uploadcare-uploader"
import { VideoLibraryGallery } from "@/features/videoLibrary/components/VideoLibraryGallery"
import { useToast } from "@/hooks/use-toast"
import { useBanners } from "../hooks/useBanners"
import { BannerFormData, BannerFormDataWithId, bannerFormSchema } from '../types'
import { RoleSelector } from "./RoleSelector"
import { createBrowserClient } from "@supabase/ssr"
import { Loader2, X, Play } from "lucide-react"
import Image from "next/image"
import type { Database } from "@/types/supabase"

// Define the type for role assignments
type CarouselBannerRole = Database['public']['Tables']['carousel_banner_roles']['Insert'];

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
  }, [initialData?.fileId, supabase])

  const form = useForm<BannerFormData & { id?: string }>({
    resolver: zodResolver(bannerFormSchema),
    defaultValues: {
      title: '',
      description: null,
      isActive: true,
      clickBehavior: 'url' as const,
      url: null,
      openInIframe: false,
      videoId: null,
      videoTitle: null,
      fileId: '',
      startDate: null,
      endDate: null,
      roleAssignments: {
        roleTypes: [],
        teams: [],
        areas: [],
        regions: []
      },
      orderIndex: undefined,
      ...initialData,
    } as Partial<BannerFormData & { id?: string }>,
  })

  // Fetch existing banner data if editing
  useEffect(() => {
    if (initialData?.id) {
      const banner = banners.find(b => b.id === initialData.id)
      if (banner) {
        // Fetch roles for this banner
        supabase
          .from('carousel_banner_roles')
          .select('role_type, team, area, region')
          .eq('banner_id', initialData.id)
          .then(({ data: rolesData, error: rolesError }) => {
            if (!rolesError && rolesData) {
              // Group roles by type
              const roleTypes = new Set<string>()
              const teams = new Set<string>()
              const areas = new Set<string>()
              const regions = new Set<string>()
              
              rolesData.forEach(role => {
                // If role_type is not 'Any', it's a role type assignment
                if (role.role_type && role.role_type !== 'Any') {
                  roleTypes.add(role.role_type)
                }
                
                // Add team, area, region if they exist
                if (role.team) teams.add(role.team)
                if (role.area) areas.add(role.area)
                if (role.region) regions.add(role.region)
              })
              
              form.reset({
                title: banner.title || "",
                description: banner.description || "",
                fileId: banner.file_id || "",
                isActive: banner.is_active || false,
                clickBehavior: banner.click_behavior as "video" | "url",
                url: banner.url || "",
                openInIframe: banner.open_in_iframe || false,
                videoId: banner.video_id || "",
                videoTitle: banner.video_title || "",
                startDate: banner.start_date ? new Date(banner.start_date) : null,
                endDate: banner.end_date ? new Date(banner.end_date) : null,
                roleAssignments: {
                  roleTypes: Array.from(roleTypes),
                  teams: Array.from(teams),
                  areas: Array.from(areas),
                  regions: Array.from(regions)
                },
              })
            }
          })
      }
    }
  }, [initialData?.id, banners, form, supabase])

  async function onSubmit(data: BannerFormData & { id?: string }) {
    setIsLoading(true)
    try {
      // Ensure roleAssignments exists with default empty arrays
      const safeRoleAssignments = {
        roleTypes: data.roleAssignments?.roleTypes || [],
        teams: data.roleAssignments?.teams || [],
        areas: data.roleAssignments?.areas || [],
        regions: data.roleAssignments?.regions || []
      }

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
            video_id: data.videoId || null,
            video_title: data.videoTitle || null,
            file_id: data.fileId || null,
            start_date: data.startDate?.toISOString() || null,
            end_date: data.endDate?.toISOString() || null,
            order_index: data.orderIndex || null,
          })
          .eq('id', initialData.id)

        if (updateError) throw updateError

        // Fetch existing role assignments to compare with new ones
        const { data: existingRoles, error: fetchError } = await supabase
          .from('carousel_banner_roles')
          .select('id, role_type, team, area, region')
          .eq('banner_id', initialData.id)

        if (fetchError) throw fetchError

        // Create role assignments array for the new configuration
        const newRoleAssignments = createRoleAssignments(initialData.id, safeRoleAssignments)
        
        // If there are no new assignments and no existing ones, we're done
        if (newRoleAssignments.length === 0 && existingRoles.length === 0) {
          // No changes needed
        } 
        // If there are no new assignments but there are existing ones, delete all existing
        else if (newRoleAssignments.length === 0 && existingRoles.length > 0) {
          const { error: deleteError } = await supabase
            .from('carousel_banner_roles')
            .delete()
            .eq('banner_id', initialData.id)
            
          if (deleteError) throw deleteError
        }
        // If there are new assignments, handle the update efficiently
        else {
          // For simplicity and to avoid complex diffing, delete all and insert new
          // This is a reasonable approach since the number of records is typically small
          const { error: deleteError } = await supabase
            .from('carousel_banner_roles')
            .delete()
            .eq('banner_id', initialData.id)
            
          if (deleteError) throw deleteError
          
          // Insert new role assignments
          const { error: insertError } = await supabase
            .from('carousel_banner_roles')
            .insert(newRoleAssignments as CarouselBannerRole[])
            
          if (insertError) throw insertError
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
          video_id: data.videoId || null,
          video_title: data.videoTitle || null,
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

        // Create role assignments array
        const roleAssignments = createRoleAssignments(newBanner.id, safeRoleAssignments)
        
        // Insert new role assignments if we have any
        if (roleAssignments.length > 0) {
          const { error: rolesError } = await supabase
            .from('carousel_banner_roles')
            .insert(roleAssignments as CarouselBannerRole[])

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
    form.setValue('videoId', id)
    form.setValue('videoTitle', title)
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
              {form.watch('videoId') && form.watch('videoTitle') && (
                <div className="rounded-lg border bg-muted/50 p-4">
                  <div className="font-medium text-sm mb-2">Selected Video:</div>
                  <div className="flex gap-4">
                    {/* Video Info Display */}
                    <div className="w-48 h-auto">
                      <div className="aspect-video bg-gray-100 rounded-md overflow-hidden flex items-center justify-center">
                        <div className="text-center p-4">
                          <Play className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                          <div className="text-xs text-gray-500">Video Selected</div>
                        </div>
                      </div>
                    </div>

                    {/* Video Info */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">
                        {form.watch('videoTitle')}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        ID: {form.watch('videoId')}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          form.setValue('videoId', '')
                          form.setValue('videoTitle', '')
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
              
              <VideoLibraryGallery 
                onVideoSelect={handleVideoSelect}
                selectedVideoId={form.watch('videoId') || undefined}
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
            name="roleAssignments"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Visible to Roles</FormLabel>
                <FormControl>
                  <RoleSelector
                    value={field.value || { roleTypes: [], teams: [], areas: [], regions: [] }}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormDescription>
                  Select which roles can see this banner. If none selected, banner will be visible to all.
                  <br />
                  <strong>Note:</strong> When selecting both roles and teams/areas/regions, the banner will be visible to those roles in those teams/areas/regions.
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

// Create role assignments for the database
const createRoleAssignments = (
  bannerId: string,
  roleAssignments: {
    roleTypes: string[];
    teams: string[];
    areas: string[];
    regions: string[];
  }
): CarouselBannerRole[] => {
  const result: CarouselBannerRole[] = [];
  const { roleTypes, teams, areas, regions } = roleAssignments;
  
  // If no specific filters are selected, make it visible to everyone
  if (roleTypes.length === 0 && teams.length === 0 && areas.length === 0 && regions.length === 0) {
    return [];
  }
  
  // If only role types are selected (no teams/areas/regions)
  // Then create entries for each role type with no team/area/region
  if (teams.length === 0 && areas.length === 0 && regions.length === 0 && roleTypes.length > 0) {
    for (const roleType of roleTypes) {
      result.push({
        banner_id: bannerId,
        role_type: roleType,
        team: null,
        area: null,
        region: null
      });
    }
    return result;
  }
  
  // If we have teams/areas/regions but no role types, use 'Any' as the role type
  const effectiveRoleTypes = roleTypes.length > 0 ? roleTypes : ['Any'];
  
  // For each team, create entries for each role type
  for (const team of teams) {
    for (const roleType of effectiveRoleTypes) {
      result.push({
        banner_id: bannerId,
        role_type: roleType,
        team,
        area: null,
        region: null
      });
    }
  }
  
  // For each area, create entries for each role type
  for (const area of areas) {
    for (const roleType of effectiveRoleTypes) {
      result.push({
        banner_id: bannerId,
        role_type: roleType,
        team: null,
        area,
        region: null
      });
    }
  }
  
  // For each region, create entries for each role type
  for (const region of regions) {
    for (const roleType of effectiveRoleTypes) {
      result.push({
        banner_id: bannerId,
        role_type: roleType,
        team: null,
        area: null,
        region
      });
    }
  }
  
  return result;
}; 


