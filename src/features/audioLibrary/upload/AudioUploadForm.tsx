"use client"

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useToast } from '@/hooks/use-toast'

// UI Components
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'

// Local imports
import { audioUploadSchema } from './schema'
import { useAudioUpload } from './useAudioUpload'

// Define our form data type directly to avoid issues with Zod inference
type FormData = {
  title: string;
  description?: string;
  audio_series_id?: string | null;
  file: File | null;
};

interface AudioUploadFormProps {
  seriesOptions: { label: string; value: string }[]
  currentUserId: string
  onSuccess?: (audioFileId: string) => void
}

export function AudioUploadForm({
  seriesOptions,
  currentUserId,
  onSuccess,
}: AudioUploadFormProps) {
  const { toast } = useToast()
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null)
  
  // Initialize form with react-hook-form
  // We cast the zodResolver to any to avoid type issues
  const form = useForm<FormData>({
    resolver: zodResolver(audioUploadSchema) as any,
    defaultValues: {
      title: '',
      description: '',
      audio_series_id: null,
      file: null,
    },
  })
  
  // Get the custom upload hook
  const { uploadAudio, isUploading, error } = useAudioUpload({
    currentUserId,
    onSuccess: (audioFileId) => {
      // Show success toast
      toast({
        title: 'Upload successful',
        description: '✅ Audio uploaded and processing started.',
        duration: 5000,
      })
      
      // Reset the form
      form.reset({
        title: '',
        description: '',
        audio_series_id: null,
        file: null,
      })
      setSelectedFileName(null)
      
      // Call the parent's onSuccess callback if provided
      if (onSuccess) {
        onSuccess(audioFileId)
      }
    },
  })
  
  // Handle form submission
  const handleSubmit = form.handleSubmit(async (data: FormData) => {
    if (!data.file) {
      toast({
        title: 'Error',
        description: 'Please select an audio file',
        variant: 'destructive',
      })
      return
    }
    
    // Check file size before upload
    const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
    if (data.file.size > MAX_FILE_SIZE) {
      toast({
        title: 'File too large',
        description: `File size exceeds the 25MB limit. Your file is ${Math.round(data.file.size / (1024 * 1024))}MB. For larger files, please split them into smaller segments using tools like Audacity before uploading.`,
        variant: 'destructive',
        duration: 7000, // Longer duration to give users time to read the guidance
      })
      return
    }
    
    const result = await uploadAudio({
      title: data.title,
      description: data.description,
      audio_series_id: data.audio_series_id || undefined,
      file: data.file
    })
    
    if (!result && error) {
      toast({
        title: 'Upload failed',
        description: error,
        variant: 'destructive',
        duration: 5000,
      })
    }
  })
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    
    if (file) {
      form.setValue('file', file, { shouldValidate: true })
      setSelectedFileName(file.name)
    } else {
      form.setValue('file', null, { shouldValidate: true })
      setSelectedFileName(null)
    }
  }
  
  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title field */}
        <FormField
          control={form.control as any}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title*</FormLabel>
              <FormControl>
                <Input placeholder="Enter audio title" {...field} />
              </FormControl>
              <FormDescription>
                Provide a descriptive title for this audio file.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Description field */}
        <FormField
          control={form.control as any}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter a description (optional)"
                  className="min-h-[120px] resize-y"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Add details about the content of this audio.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Audio Series field */}
        {seriesOptions.length > 0 && (
          <FormField
            control={form.control as any}
            name="audio_series_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Audio Series</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value || undefined}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a series (optional)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {seriesOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Assign this audio to a series (optional).
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        
        {/* File upload field */}
        <FormField
          control={form.control as any}
          name="file"
          render={({ field: { value: _value, onChange: _onChange, ...fieldProps } }) => (
            <FormItem>
              <FormLabel>Audio File*</FormLabel>
              <FormControl>
                <div className="grid w-full gap-2">
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept="audio/*"
                      onChange={handleFileChange}
                      className={selectedFileName ? "hidden" : ""}
                      {...fieldProps}
                    />
                    {selectedFileName && (
                      <div className="flex items-center gap-2 border rounded-md p-2 w-full text-sm">
                        <span className="truncate flex-1">{selectedFileName}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            form.setValue('file', null, { shouldValidate: true })
                            setSelectedFileName(null)
                          }}
                        >
                          Change
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </FormControl>
              <FormDescription>
                Upload an audio file (MP3, WAV, AAC, etc.) up to 25MB. For larger files, please split them into smaller segments using software like Audacity.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Submit button */}
        <div className="flex justify-end">
          <Button type="submit" disabled={isUploading}>
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              'Upload Audio'
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}