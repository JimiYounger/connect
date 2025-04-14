// my-app/src/features/documentLibrary/upload/handleUploadDocuments.ts

import { createClient } from '@/lib/supabase'
import { DocumentUploadInput } from './schema'
import { insertDocumentWithRelations } from './insertDocumentWithRelations'
import { triggerDocumentParse } from './triggerDocumentParse'

/**
 * Generates a storage path for a document file
 * @param userId ID of the user uploading the document
 * @param filename Name of the file being uploaded
 * @returns Formatted storage path
 */
function getStoragePath(userId: string, filename: string): string {
  const timestamp = Date.now()
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_')
  return `user-${userId}/${timestamp}-${sanitizedFilename}`
}

type UploadResult = {
  success: boolean;
  file: string;
  error?: any;
  documentId?: string;
}

type UploadSummary = {
  successful: UploadResult[];
  failed: UploadResult[];
}

/**
 * Uploads multiple documents to Supabase storage and creates metadata records
 * @param documents Array of document upload inputs with metadata and file
 * @param userId ID of the user uploading the documents
 * @returns Upload summary with successful and failed uploads
 */
export async function handleUploadDocuments(
  documents: DocumentUploadInput[],
  userId: string
): Promise<UploadSummary> {
  const supabase = createClient()
  
  // Check if the documents bucket exists and is accessible
  try {
    // Check for the documents bucket
    try {
      const { data: bucketFiles, error: bucketError } = await supabase.storage
        .from('documents')
        .list()
      
      if (bucketError) {
        console.error('Error accessing documents bucket:', bucketError.message)
        throw new Error(`Storage bucket access error: ${bucketError.message}`)
      }
      
      console.log('Documents bucket is accessible, contains files:', bucketFiles?.length || 0)
    } catch (storageError) {
      console.error('Error checking storage bucket:', storageError)
      throw new Error('Storage bucket error: ' + (storageError as Error).message)
    }
  
    try {
      // Process all document uploads in parallel for better performance
      const results = await Promise.all(
        documents.map(async (document) => {
          try {
            const filePath = getStoragePath(userId, document.file.name)
            
            // 1. Upload the file to storage
            const { error: uploadError } = await supabase
              .storage
              .from('documents')
              .upload(filePath, document.file, {
                cacheControl: '3600',
                upsert: false
              })
              
            if (uploadError) {
              throw new Error(`Error uploading file: ${uploadError.message}`)
            }
            
            // 2. Get the public URL for the file
            const { data: urlData } = supabase
              .storage
              .from('documents')
              .getPublicUrl(filePath)
              
            const fileUrl = urlData.publicUrl
            
            console.log('File uploaded successfully:', filePath)
            console.log('Public URL:', fileUrl)
            
            // 3. Insert document metadata and relationships using our specialized function
            const insertResult = await insertDocumentWithRelations({
              document,
              fileUrl,
              filePath,
              userId
            })
            
            if (!insertResult.success) {
              throw new Error(`Failed to insert document metadata: ${insertResult.error}`)
            }
            
            console.log('Document metadata stored in database successfully with ID:', insertResult.documentId)
            
            // 4. Trigger document parsing API to extract and chunk content
            const parseResult = await triggerDocumentParse({
              documentId: insertResult.documentId,
              fileUrl: urlData.publicUrl
            })
            
            if (!parseResult.success) {
              // The helper already logs the error, just add a summary log
              console.warn(
                'Document parsing was triggered but encountered an issue. ' +
                'Upload process will continue regardless.'
              )
            }
            
            // Return success with document ID
            return {
              success: true,
              file: document.file.name,
              documentId: insertResult.documentId
            }
            
          } catch (docError) {
            console.error('Error processing document:', document.title, docError)
            // Don't throw here - try to continue with other files if possible
            return {
              success: false,
              file: document.file.name,
              error: docError
            }
          }
        })
      )
      
      // Process the results to see what succeeded and what failed
      const successfulUploads = results.filter(r => r.success)
      const failedUploads = results.filter(r => !r.success)
      
      console.log(`Upload summary: ${successfulUploads.length} succeeded, ${failedUploads.length} failed`)
      
      if (failedUploads.length > 0) {
        console.warn('Failed uploads:', failedUploads.map(f => f.file))
        
        // Only throw if ALL uploads failed
        if (successfulUploads.length === 0) {
          throw new Error('All document uploads failed')
        }
      }
      
      // Return the results so the caller can handle successes and failures
      return {
        successful: successfulUploads,
        failed: failedUploads
      }
      
    } catch (error) {
      console.error('Document upload operation failed:', error)
      throw new Error('Failed to upload one or more documents')
    }
  } catch (error) {
    console.error('Storage bucket error:', error)
    throw error
  }
}