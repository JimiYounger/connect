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
  const { document, filePath, userId } = input // fileUrl not used locally
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
      
      // If user profile not found, try to create a basic one
      if (userProfileError.message.includes('no rows')) {
        console.log('🔄 Attempting to create a basic user profile for userId:', userId)
        
        // Get current user data using the auth API
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          console.error('❌ Error fetching user data for profile creation:', userError?.message || 'No user data found')
          throw new Error('Failed to get user data for profile creation')
        }
        
        const userEmail = user.email
        
        if (!userEmail) {
          console.error('❌ User has no email address for profile creation')
          throw new Error('User email not available for profile creation')
        }
        
        // Create a basic user profile with minimal information
        const { data: newProfile, error: insertError } = await supabase
          .from('user_profiles')
          .insert({
            id: userId,
            email: userEmail,
            first_name: 'User', // Placeholder
            last_name: user.user_metadata?.name || userEmail.split('@')[0] || 'User',
            airtable_record_id: 'pending-sync', // Required field
            role_type: 'Setter', // Default role type
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            last_airtable_sync: new Date().toISOString()
          })
          .select('id, email')
          .single()
        
        if (insertError) {
          console.error('❌ Failed to create user profile:', insertError.message)
          throw new Error(`Failed to create user profile: ${insertError.message}`)
        }
        
        console.log('✅ Created basic user profile:', newProfile)
        // Don't return here, just continue with the process
      }
    }
    
    if (!userProfile) {
      console.warn('⚠️ User profile not found for userId:', userId)
    } else {
      console.log('✅ User profile found:', userProfile)
    }
  } catch (profileCheckError) {
    console.error('❌ Exception checking user profile:', profileCheckError)
    throw new Error(`Profile check error: ${profileCheckError instanceof Error ? profileCheckError.message : 'Unknown error'}`)
  }
  
  // NOTE: This helper was prepared for future use but is not currently used
  // Prefix with _ to indicate intentionally unused
  const _getFileExtension = (filename: string): string => {
    const parts = filename.split('.')
    return parts.length > 1 ? parts.pop()?.toLowerCase() || '' : ''
  }
  
  // Get the actual user profile ID based on the auth user ID
  const { data: userProfileData, error: userProfileLookupError } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('user_id', userId)
    .single()
    
  if (userProfileLookupError || !userProfileData) {
    console.error('❌ Fatal error: Could not find user profile for auth user:', userId, userProfileLookupError?.message || 'No profile found')
    throw new Error(`Cannot proceed with document upload: No user profile found for this account`)
  }
  
  // Use the actual profile ID for document insertion
  const profileId = userProfileData.id
  console.log('✅ Found user profile ID:', profileId, 'for auth user ID:', userId)
  
  try {
    // Log the document data we're about to insert
    console.log('📝 Attempting to insert document with:', {
      title: document.title,
      category_id: document.categoryId,
      uploaded_by: profileId  // Log the profile ID we're using
    })
    
    // 1. Insert document record
    const { data: documentData, error: documentError } = await supabase
      .from('documents')
      .insert({
        title: document.title,
        description: document.description || null,
        category_id: document.categoryId,
        uploaded_by: profileId, // Use profile ID instead of auth user ID
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
        // Content field will be filled later with actual document text
      })
      .select('id')
      .single()
    
    if (documentError) {
      console.error('❌ Document insert error details:', documentError)
      throw new Error(`Failed to insert document: ${documentError.message || 'Unknown error'}`)
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
      throw new Error(`Failed to insert document version: ${versionError.message || 'Unknown error'}`)
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
      throw new Error(`Failed to update document with version ID: ${updateError.message || 'Unknown error'}`)
    }
    
    console.log('✅ Document updated with version ID:', updateData)
    
    // 3. Insert visibility settings using the new JSONB conditions column
    if (document.visibility && typeof document.visibility === 'object') {
      // Create a single structured conditions object for visibility
      const conditions: Record<string, any> = {}
      
      // Take the first role type (we only support one role type at a time)
      if (document.visibility.roleTypes && Array.isArray(document.visibility.roleTypes) && document.visibility.roleTypes.length) {
        conditions.role_type = document.visibility.roleTypes[0]
      }
      
      // Add arrays for other location-based filters
      if (document.visibility.teams && Array.isArray(document.visibility.teams) && document.visibility.teams.length) {
        conditions.teams = document.visibility.teams
      }
      
      if (document.visibility.areas && Array.isArray(document.visibility.areas) && document.visibility.areas.length) {
        conditions.areas = document.visibility.areas
      }
      
      if (document.visibility.regions && Array.isArray(document.visibility.regions) && document.visibility.regions.length) {
        conditions.regions = document.visibility.regions
      }
      
      // Log the conditions object for debugging
      console.log('📊 Document visibility conditions:', conditions)
      
      // Insert a single visibility record with the conditions JSON
      const { error: visibilityError } = await supabase
        .from('document_visibility')
        .insert({
          document_id: documentId,
          conditions: conditions
        })
      
      if (visibilityError) {
        throw new Error(`Failed to insert document visibility: ${visibilityError.message || 'Unknown error'}`)
      }
    }
    
    // 4. Handle tags if provided
    if (document.tags && Array.isArray(document.tags) && document.tags.length > 0) {
      // First, try to find existing tags to avoid duplicates
      const { data: existingTags, error: tagsQueryError } = await supabase
        .from('document_tags')
        .select('id, name')
        .in('name', document.tags)
      
      if (tagsQueryError) {
        throw new Error(`Failed to query existing tags: ${tagsQueryError.message || 'Unknown error'}`)
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
          throw new Error(`Failed to insert new tags: ${newTagsError.message || 'Unknown error'}`)
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
        throw new Error(`Failed to insert tag assignments: ${tagAssignmentError.message || 'Unknown error'}`)
      }
    }
    
    // If we got here, everything succeeded
    return {
      success: true,
      documentId
    }
    
  } catch (error: unknown) {
    console.error('Error in insertDocumentWithRelations:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}