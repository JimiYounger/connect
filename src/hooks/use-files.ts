// src/hooks/use-files.ts

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import type { FileInfo, StoredFile } from '@/types/files'
import type { Database } from '@/types/supabase'

type Files = Database['public']['Tables']['files']

export function useFiles() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const saveFile = async (fileInfo: FileInfo) => {
    try {
      setIsLoading(true)
      setError(null)

      // Get user first
      const { data: { session }, error: userError } = await supabase.auth.getSession()
      
      if (userError) {
        console.error('User auth error:', userError)
        throw new Error('Authentication required')
      }

      if (!session?.user?.id) {
        throw new Error('No user ID found')
      }

      // Prepare the file data
      const fileData = {
        cdn_url: fileInfo.cdnUrl,
        uploadcare_uuid: fileInfo.uuid,
        original_filename: fileInfo.originalFilename,
        mime_type: fileInfo.mimeType,
        size: fileInfo.size,
        user_id: session.user.id
      } satisfies Partial<Files['Insert']>

      console.log('Attempting to save file with data:', fileData)

      const { data, error: supabaseError } = await supabase
        .from('files')
        .insert(fileData)
        .select()
        .single()

      if (supabaseError) {
        console.error('Supabase insert error:', supabaseError)
        throw supabaseError
      }

      if (!data) {
        throw new Error('No data returned from insert')
      }

      console.log('File saved successfully:', data)
      return data as StoredFile

    } catch (err) {
      console.error('Save file error details:', {
        error: err,
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined
      })
      
      const error = err instanceof Error 
        ? err 
        : new Error('Failed to save file: ' + JSON.stringify(err))
      
      setError(error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const getFiles = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const { data: { session }, error: userError } = await supabase.auth.getSession()
      
      if (userError || !session) {
        console.error('User auth error:', userError)
        throw new Error('Authentication required')
      }

      const { data, error: supabaseError } = await supabase
        .from('files')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      if (supabaseError) throw supabaseError

      return (data || []) as StoredFile[]
    } catch (err) {
      console.error('Get files error:', err)
      const error = err instanceof Error ? err : new Error('Failed to fetch files')
      setError(error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  return {
    saveFile,
    getFiles,
    isLoading,
    error,
  }
} 