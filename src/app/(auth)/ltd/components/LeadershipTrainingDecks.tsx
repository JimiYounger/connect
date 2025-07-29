'use client'

import { useState, useEffect, useCallback } from 'react'
import { AdminToggle } from './AdminToggle'
import { LTDDocumentCard } from './LTDDocumentCard'
import { Card } from '@/components/ui/card'
import { FileText, Loader2 } from 'lucide-react'
import { LTDDocument, LTDDocumentListResponse, LTDApiError } from '@/features/ltd/types'

interface LeadershipTrainingDecksProps {
  profile: {
    id: string
    first_name: string
    last_name: string
    role_type?: string
  }
}

export function LeadershipTrainingDecks({ profile }: LeadershipTrainingDecksProps) {
  const [documents, setDocuments] = useState<LTDDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [updating, setUpdating] = useState<string | null>(null) // Track which document is being updated

  const isAdmin = profile.role_type?.toLowerCase() === 'admin'

  // Fetch documents
  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/ltd/documents')
      const data: LTDDocumentListResponse | LTDApiError = await response.json()
      
      if (!data.success) {
        throw new Error((data as LTDApiError).error || 'Failed to fetch documents')
      }
      
      setDocuments((data as LTDDocumentListResponse).data)
    } catch (err) {
      console.error('Error fetching LTD documents:', err)
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }, [])

  // Update document metadata
  const updateMetadata = useCallback(async (
    documentId: string, 
    metadata: { presented_by?: string; meeting_date?: string }
  ) => {
    try {
      setUpdating(documentId)
      
      const response = await fetch('/api/ltd/metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          document_id: documentId,
          ...metadata
        })
      })
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update metadata')
      }
      
      // Update the document in the local state
      setDocuments(prev => prev.map(doc => 
        doc.id === documentId 
          ? { ...doc, customMetadata: result.data }
          : doc
      ))
      
      return result.data
    } catch (err) {
      console.error('Error updating metadata:', err)
      throw err
    } finally {
      setUpdating(null)
    }
  }, [])

  // Delete document metadata
  const deleteMetadata = useCallback(async (metadataId: string, documentId: string) => {
    try {
      setUpdating(documentId)
      
      const response = await fetch(`/api/ltd/metadata/${metadataId}`, {
        method: 'DELETE'
      })
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete metadata')
      }
      
      // Remove the metadata from the document in local state
      setDocuments(prev => prev.map(doc => 
        doc.id === documentId 
          ? { ...doc, customMetadata: undefined }
          : doc
      ))
    } catch (err) {
      console.error('Error deleting metadata:', err)
      throw err
    } finally {
      setUpdating(null)
    }
  }, [])

  // Handle document click - redirect to document viewer
  const handleDocumentClick = useCallback((documentId: string) => {
    window.open(`/api/document-library/view/${documentId}`, '_blank')
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading documents...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="p-6 bg-white border border-gray-200">
        <div className="text-center">
          <div className="text-red-600 mb-2 font-medium">Error loading documents</div>
          <div className="text-sm text-gray-600 mb-4">{error}</div>
          <button
            onClick={fetchDocuments}
            className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
          >
            Try Again
          </button>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Admin Toggle */}
      {isAdmin && (
        <div className="flex justify-end">
          <AdminToggle 
            isEditMode={isEditMode}
            onToggle={setIsEditMode}
          />
        </div>
      )}

      {/* Documents List */}
      {documents.length === 0 ? (
        <Card className="p-12 bg-white border border-gray-200">
          <div className="text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2 text-black">No Leadership Training Decks Found</h3>
            <p className="text-gray-600">
              There are currently no documents in the Leadership Training &gt; Decks category.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4">
          {documents.map((document) => (
            <LTDDocumentCard
              key={document.id}
              document={document}
              isEditMode={isEditMode && isAdmin}
              isUpdating={updating === document.id}
              onDocumentClick={handleDocumentClick}
              onUpdateMetadata={updateMetadata}
              onDeleteMetadata={deleteMetadata}
            />
          ))}
        </div>
      )}
    </div>
  )
}