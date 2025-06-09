"use client"

import { useState } from 'react'
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
      
      // Check if the audio-library bucket exists and is accessible
      try {
        const { data: bucketFiles, error: bucketError } = await supabase.storage
          .from('audio-library')
          .list()
        
        if (bucketError) {
          console.error('Error accessing audio-library bucket:', bucketError.message)
          throw new Error(`Storage bucket access error: ${bucketError.message}`)
        }
        
        console.log('Audio-library bucket is accessible, contains files:', bucketFiles?.length || 0)
      } catch (storageError) {
        console.error('Error checking storage bucket:', storageError)
        throw new Error('Storage bucket error: ' + (storageError as Error).message)
      }
      
      // Check file size - 25MB limit
      const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB in bytes
      if (formData.file.size > MAX_FILE_SIZE) {
        throw new Error(`File size exceeds the maximum allowed size of 25MB. Your file is ${Math.round(formData.file.size / (1024 * 1024))}MB. For larger files, please split them into smaller segments using tools like Audacity before uploading.`);
      }
      
      // Create a user-specific path like the document library uses
      // This helps with permissions since that approach is working
      const sanitizedFilename = formData.file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const timestamp = Date.now()
      const fileName = `user-${currentUserId}/${timestamp}-${sanitizedFilename}`
      
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
        console.error('Upload error details:', uploadError)
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
      
      // Save the internal storage path for backend processing
      const file_path = fileName; // fileName is already the full relative path
      
      // Prepare the request body for the API
      const requestBody: UploadAudioRequest = {
        title: formData.title,
        description: formData.description,
        audio_series_id: formData.audio_series_id,
        file_url: publicUrl,
        file_path, // Include the internal path for backend processing
        file_type: formData.file.type,
        user_id: currentUserId
      }
      
      // Submit to the upload API
      let response;
      try {
        response = await fetch('/api/audio-library/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });
        
        if (!response.ok) {
          let errorData;
          try {
            // Try to parse as JSON first
            errorData = await response.json();
            console.error('API response error:', {
              status: response.status,
              statusText: response.statusText,
              errorData
            });
            
            // Use the specific error message if available
            const errorMessage = errorData.error || JSON.stringify(errorData);
            throw new Error(`API error: ${response.status} ${errorMessage}`);
          } catch (_parseError) {
            // If not JSON, get as text
            const errorText = await response.text();
            console.error('API response error (text):', {
              status: response.status,
              statusText: response.statusText,
              errorText
            });
            throw new Error(`API error: ${response.status} ${errorText}`);
          }
        }
      } catch (fetchError) {
        console.error('API fetch error:', fetchError);
        if (fetchError instanceof Error) {
          throw fetchError;
        } else {
          throw new Error('Failed to connect to API');
        }
      }
      
      const data = await response.json() as UploadAudioResponse
      
      if (!data.success) {
        throw new Error(data.error || 'Upload failed')
      }
      
      // For backward compatibility, create an ID if one wasn't returned
      const audioFileId = data.audioFileId || `temp-${new Date().getTime()}`
      
      // Call the success callback if provided
      if (onSuccess) {
        onSuccess(audioFileId)
      }
      
      return audioFileId
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