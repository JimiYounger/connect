// my-app/src/features/documentLibrary/upload/insertDocumentWithRelations.ts

import { createClient } from '@/lib/supabase'
import { DocumentUploadInput } from './schema'

type InsertInput = {
  document: DocumentUploadInput
  fileUrl: string // public URL of the file in storage
  filePath: string // storage path of the uploaded file
  userId: string // maps to user_profiles.id
}

type InsertResult =
  | { success: true; documentId: string }
  | { success: false; error: string }

/**
 * Inserts document metadata and relationships into the database after upload
 * 
 * This function handles inserting a document record and all its relationships:
 * - Document metadata in the documents table
 * - Document version in document_versions
 * - Document visibility settings in document_visibility
 * - Document tags in document_tags and document_tag_assignments
 * 
 * @param input Object containing document data, file info, and user ID
 * @returns Object with success status and document ID or error message
 */
export async function insertDocumentWithRelations(input: InsertInput): Promise<InsertResult> {
  const { document, fileUrl, filePath, userId } = input
  const supabase = createClient()
  
  console.log('📌 insertDocumentWithRelations received userId:', userId)
  console.log('📌 userId type:', typeof userId)
  
  // First, check if this userId exists in user_profiles table
  try {
    const { data: userProfile, error: userProfileError } = await supabase
      .from('user_profiles')
      .select('id, email, first_name, last_name')
      .eq('id', userId)
      .single()
    
    if (userProfileError) {
      console.error('❌ Error checking user profile:', userProfileError.message)
      // Continue execution - we'll see the FK constraint error if user doesn't exist
    }
    
    if (!userProfile) {
      console.warn('⚠️ User profile not found for userId:', userId)
    } else {
      console.log('✅ User profile found:', userProfile)
    }
  } catch (profileCheckError) {
    console.error('❌ Exception checking user profile:', profileCheckError)
  }
  
  // Helper to extract file extension from file name
  const getFileExtension = (filename: string): string => {
    const parts = filename.split('.')
    return parts.length > 1 ? parts.pop()?.toLowerCase() || '' : ''
  }
  
  try {
    // Log the document data we're about to insert
    console.log('📝 Attempting to insert document with:', {
      title: document.title,
      category_id: document.categoryId,
      uploaded_by: userId
    })
    
    // 1. Insert document record
    const { data: documentData, error: documentError } = await supabase
      .from('documents')
      .insert({
        title: document.title,
        description: document.description || null,
        category_id: document.categoryId,
        uploaded_by: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
        // Content field will be filled later with actual document text
      })
      .select('id')
      .single()
    
    if (documentError) {
      console.error('❌ Document insert error details:', documentError)
      throw new Error(`Failed to insert document: ${documentError.message}`)
    }
    
    if (!documentData) {
      throw new Error('Document was inserted but no ID was returned')
    }
    
    const documentId = documentData.id
    
    // 2. Insert document version
    const { data: versionData, error: versionError } = await supabase
      .from('document_versions')
      .insert({
        document_id: documentId,
        file_path: filePath,
        file_type: document.file.type,
        version_label: document.versionLabel || 'Initial version',
        uploaded_at: new Date().toISOString()
      })
      .select('id') // Get the version ID
      .single()
    
    if (versionError) {
      throw new Error(`Failed to insert document version: ${versionError.message}`)
    }
    
    if (!versionData) {
      throw new Error('Document version was inserted but no ID was returned')
    }
    
    // 3. Update the document with the current_version_id
    console.log('✅ Document version created with ID:', versionData.id)
    
    const { data: updateData, error: updateError } = await supabase
      .from('documents')
      .update({
        current_version_id: versionData.id
      })
      .eq('id', documentId)
      .select('id, title, current_version_id')
      .single()
    
    if (updateError) {
      console.error('❌ Error updating document with version ID:', updateError)
      throw new Error(`Failed to update document with version ID: ${updateError.message}`)
    }
    
    console.log('✅ Document updated with version ID:', updateData)
    
    // 3. Insert visibility settings (if provided)
    if (document.visibility) {
      const visibilityEntries = []
      
      // Add role types
      if (document.visibility.roleTypes?.length) {
        for (const roleType of document.visibility.roleTypes) {
          visibilityEntries.push({
            document_id: documentId,
            role_type: roleType
          })
        }
      }
      
      // Add teams
      if (document.visibility.teams?.length) {
        for (const team of document.visibility.teams) {
          visibilityEntries.push({
            document_id: documentId,
            team
          })
        }
      }
      
      // Add areas
      if (document.visibility.areas?.length) {
        for (const area of document.visibility.areas) {
          visibilityEntries.push({
            document_id: documentId,
            area
          })
        }
      }
      
      // Add regions
      if (document.visibility.regions?.length) {
        for (const region of document.visibility.regions) {
          visibilityEntries.push({
            document_id: documentId,
            region
          })
        }
      }
      
      // Insert all visibility entries if there are any
      if (visibilityEntries.length > 0) {
        const { error: visibilityError } = await supabase
          .from('document_visibility')
          .insert(visibilityEntries)
        
        if (visibilityError) {
          throw new Error(`Failed to insert document visibility: ${visibilityError.message}`)
        }
      }
    }
    
    // 4. Handle tags if provided
    if (document.tags && document.tags.length > 0) {
      // First, try to find existing tags to avoid duplicates
      const { data: existingTags, error: tagsQueryError } = await supabase
        .from('document_tags')
        .select('id, name')
        .in('name', document.tags)
      
      if (tagsQueryError) {
        throw new Error(`Failed to query existing tags: ${tagsQueryError.message}`)
      }
      
      // Map existing tags by name for easy lookup
      const existingTagsByName = new Map<string, string>()
      existingTags?.forEach(tag => {
        existingTagsByName.set(tag.name, tag.id)
      })
      
      // Create any tags that don't already exist
      const newTags = document.tags.filter(tagName => !existingTagsByName.has(tagName))
      
      // Insert new tags if needed
      if (newTags.length > 0) {
        const tagsToInsert = newTags.map(name => ({ name }))
        const { data: newTagsData, error: newTagsError } = await supabase
          .from('document_tags')
          .insert(tagsToInsert)
          .select('id, name')
        
        if (newTagsError) {
          throw new Error(`Failed to insert new tags: ${newTagsError.message}`)
        }
        
        // Add newly created tags to our map
        newTagsData?.forEach(tag => {
          existingTagsByName.set(tag.name, tag.id)
        })
      }
      
      // Now create relationships between document and all tags
      const tagAssignments = document.tags.map(tagName => ({
        document_id: documentId,
        tag_id: existingTagsByName.get(tagName)
      }))
      
      const { error: tagAssignmentError } = await supabase
        .from('document_tag_assignments')
        .insert(tagAssignments)
      
      if (tagAssignmentError) {
        throw new Error(`Failed to insert tag assignments: ${tagAssignmentError.message}`)
      }
    }
    
    // If we got here, everything succeeded
    return {
      success: true,
      documentId
    }
    
  } catch (error) {
    console.error('Error in insertDocumentWithRelations:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}