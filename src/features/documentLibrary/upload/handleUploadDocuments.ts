import { createClient } from '@/lib/supabase'
import { DocumentUploadInput } from './schema'

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

/**
 * Uploads multiple documents to Supabase storage and creates metadata records
 * @param documents Array of document upload inputs with metadata and file
 * @param userId ID of the user uploading the documents
 */
export async function handleUploadDocuments(
  documents: DocumentUploadInput[],
  userId: string
): Promise<void> {
  const supabase = createClient()
  
  try {
    // Process all document uploads in parallel for better performance
    await Promise.all(
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
          
          // 3. Insert record using raw SQL to avoid TypeScript errors with table definition
          const { error: insertError } = await supabase
            .from('document_library' as any)
            .insert({
              title: document.title,
              description: document.description || null,
              category_id: document.categoryId,
              tags: document.tags || [],
              version_label: document.versionLabel || null,
              visibility: document.visibility || null,
              file_url: fileUrl,
              uploaded_by: userId,
              uploaded_at: new Date().toISOString(),
              file_path: filePath, // Store the path for potential future operations
              file_type: document.file.type,
              file_size: document.file.size
            })
            
          if (insertError) {
            // If document metadata insertion fails, we should clean up the uploaded file
            await supabase.storage.from('documents').remove([filePath])
            throw new Error(`Error saving document metadata: ${insertError.message}`)
          }
          
        } catch (docError) {
          console.error('Error processing document:', document.title, docError)
          throw docError // Re-throw to be caught by the outer catch
        }
      })
    )
    
    console.log(`Successfully uploaded ${documents.length} documents`)
    
  } catch (error) {
    console.error('Document upload operation failed:', error)
    throw new Error('Failed to upload one or more documents')
  }
}