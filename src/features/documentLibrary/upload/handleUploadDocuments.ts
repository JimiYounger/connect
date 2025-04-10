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
          
          console.log('File uploaded successfully:', filePath)
          console.log('Public URL:', fileUrl)
          
          // 3. Insert record using raw SQL to avoid TypeScript errors with table definition
          // Try to detect table existence in a more compatible way
          console.log('Checking for document_library table')
          try {
            const { data: tableData, error: tableCheckError } = await supabase
              .from('document_library' as any)
              .select('count(*)', { count: 'exact', head: true })
              
            console.log('Table check result:', tableData)
            if (tableCheckError) {
              console.error('Table may not exist:', tableCheckError.message)
            }
          } catch (tableError) {
            console.error('Error checking table:', tableError)
          }
          
          console.log('Attempting to insert record into document_library table')
          // Try different approaches to insert the data
          
          // First approach: Using the standard API with minimal fields
          const insertResult = await supabase
            .from('document_library' as any)
            .insert({
              title: document.title,
              description: document.description || null,
              category_id: document.categoryId,
              file_url: fileUrl,
              uploaded_by: userId
            })
            
          // If that didn't work, we would try a different approach with fallbacks
          // For now, we'll continue with our debugging
            
          const { data: insertData, error: insertError } = insertResult
          
          console.log('Insert result:', insertData)
          
          if (insertError) {
            // If document metadata insertion fails, we should clean up the uploaded file
            console.error('Insert error:', insertError)
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
  } catch (error) {
    console.error('Storage bucket error:', error)
    throw error
  }
}