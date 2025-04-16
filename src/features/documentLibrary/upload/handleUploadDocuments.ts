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

// Add a type for the progress callback
type ProgressCallback = (fileIndex: number, progress: number, fileName: string) => void;

/**
 * Uploads multiple documents to Supabase storage and creates metadata records
 * @param documents Array of document upload inputs with metadata and file
 * @param userId The authenticated user ID (auth.uid()) - not the profile ID
 * @param onProgress Optional callback to report upload progress (0-100)
 * @returns Upload summary with successful and failed uploads
 */
export async function handleUploadDocuments(
  documents: DocumentUploadInput[],
  userId: string, // This is auth.uid() - the authentication user ID
  onProgress?: ProgressCallback
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
        documents.map(async (document, index) => {
          try {
            const filePath = getStoragePath(userId, document.file.name)
            
            // Initialize progress for this file
            if (onProgress) {
              onProgress(index, 0, document.file.name);
            }
            
            // 1. Upload the file to storage with progress reporting
            // Note: Supabase's upload doesn't directly support progress reporting,
            // so we'll simulate progress updates based on file size
            
            // Report starting upload
            if (onProgress) {
              onProgress(index, 10, document.file.name);
            }
            
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
            
            // Report file upload complete
            if (onProgress) {
              onProgress(index, 50, document.file.name);
            }
            
            // 2. Get the public URL for the file
            const { data: urlData } = supabase
              .storage
              .from('documents')
              .getPublicUrl(filePath)
              
            const fileUrl = urlData.publicUrl
            
            console.log('File uploaded successfully:', filePath)
            console.log('Public URL:', fileUrl)
            
            // Report metadata processing
            if (onProgress) {
              onProgress(index, 75, document.file.name);
            }
            
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
            
            // Report document parsing
            if (onProgress) {
              onProgress(index, 90, document.file.name);
            }
            
            // 4. Trigger document parsing API to extract and chunk content
            const parseResult = await triggerDocumentParse({
              documentId: insertResult.documentId,
              fileUrl: urlData.publicUrl
            })
            
            if (!parseResult.success) {
              // Enhanced error logging for parse failures
              console.warn(
                'Document parsing was triggered but encountered an issue: ' +
                (parseResult.error || 'Unknown error')
              );
              
              // Log file details for debugging
              console.warn('File details:', {
                name: document.file.name,
                type: document.file.type,
                size: `${Math.round(document.file.size / 1024)} KB`,
                url: urlData.publicUrl
              });
              
              // Check for common issues
              const fileExtension = document.file.name.split('.').pop()?.toLowerCase();
              if (!['pdf', 'docx', 'jpg', 'jpeg', 'png'].includes(fileExtension || '')) {
                console.error(`Unsupported file type for parsing: ${fileExtension}. Only PDF, DOCX, JPG, JPEG, and PNG are supported.`);
              } else if (document.file.size > 10 * 1024 * 1024) { // 10 MB
                console.warn('File may be too large for efficient parsing:', `${Math.round(document.file.size / 1024 / 1024)} MB`);
              }
            }
            
            // Report completion
            if (onProgress) {
              onProgress(index, 100, document.file.name);
            }
            
            // Even if parsing failed, we can still consider the upload itself successful
            // since the file is in storage and metadata is in the database
            // Return success with document ID
            return {
              success: true,
              file: document.file.name,
              documentId: insertResult.documentId
            }
            
          } catch (docError) {
            console.error('Error processing document:', document.title, docError)
            
            // Report error
            if (onProgress) {
              onProgress(index, -1, document.file.name); // -1 indicates error
            }
            
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