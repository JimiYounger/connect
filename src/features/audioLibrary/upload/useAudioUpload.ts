import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { createClient } from '@/lib/supabase'
import { UploadAudioRequest, UploadAudioResponse } from './types'

// Type for validated form data
type ValidatedFormData = {
  title: string;
  description?: string;
  audio_series_id?: string;
  file: File;
};

interface UseAudioUploadProps {
  currentUserId: string
  onSuccess?: (audioFileId: string) => void
}

interface UseAudioUploadResult {
  uploadAudio: (formData: ValidatedFormData) => Promise<string | null>
  isUploading: boolean
  error: string | null
  resetError: () => void
}

/**
 * Custom hook for handling audio file uploads
 */
export function useAudioUpload({ 
  currentUserId,
  onSuccess
}: UseAudioUploadProps): UseAudioUploadResult {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resetError = () => setError(null)

  /**
   * Uploads an audio file and metadata to the server
   */
  const uploadAudio = async (formData: ValidatedFormData): Promise<string | null> => {
    setIsUploading(true)
    setError(null)
    
    try {
      // Get Supabase client
      const supabase = createClient()
      
      // Generate a unique file path for storage
      const fileName = `audio/${uuidv4()}_${formData.file.name}`
      
      // Upload the file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('audio-library')
        .upload(fileName, formData.file, {
          cacheControl: '3600',
          upsert: false,
          contentType: formData.file.type
        })
        
      if (uploadError || !uploadData) {
        throw new Error(uploadError?.message || 'Failed to upload audio file')
      }
      
      // Get the public URL for the uploaded file
      const { data: { publicUrl } } = supabase
        .storage
        .from('audio-library')
        .getPublicUrl(fileName)
        
      if (!publicUrl) {
        throw new Error('Failed to get public URL for uploaded file')
      }
      
      // Prepare the request body for the API
      const requestBody: UploadAudioRequest = {
        title: formData.title,
        description: formData.description,
        audio_series_id: formData.audio_series_id,
        file_url: publicUrl,
        file_type: formData.file.type,
        user_id: currentUserId
      }
      
      // Submit to the upload API
      const response = await fetch('/api/audio-library/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`API error: ${response.status} ${errorText}`)
      }
      
      const data = await response.json() as UploadAudioResponse
      
      if (!data.success || !data.audioFileId) {
        throw new Error(data.error || 'Upload failed')
      }
      
      // Call the success callback if provided
      if (onSuccess && data.audioFileId) {
        onSuccess(data.audioFileId)
      }
      
      return data.audioFileId
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error during upload'
      console.error('Audio upload error:', err)
      setError(errorMessage)
      return null
    } finally {
      setIsUploading(false)
    }
  }
  
  return {
    uploadAudio,
    isUploading,
    error,
    resetError
  }
}