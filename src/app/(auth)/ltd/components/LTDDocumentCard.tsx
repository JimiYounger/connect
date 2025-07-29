'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MetadataEditForm } from './MetadataEditForm'
import { 
  FileText, 
  Calendar, 
  User, 
  ExternalLink, 
  Edit3, 
  Loader2,
  Tag,
  Share2
} from 'lucide-react'
import { LTDDocument } from '@/features/ltd/types'

interface LTDDocumentCardProps {
  document: LTDDocument
  isEditMode: boolean
  isUpdating: boolean
  onDocumentClick: (documentId: string) => void
  onUpdateMetadata: (documentId: string, metadata: { presented_by?: string; meeting_date?: string }) => Promise<any>
  onDeleteMetadata: (metadataId: string, documentId: string) => Promise<void>
}

export function LTDDocumentCard({
  document,
  isEditMode,
  isUpdating,
  onDocumentClick,
  onUpdateMetadata,
  onDeleteMetadata
}: LTDDocumentCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied' | 'error'>('idle')

  const handleEdit = () => {
    setIsEditing(true)
    setError(null)
  }

  const handleSave = async (metadata: { presented_by?: string; meeting_date?: string }) => {
    try {
      setError(null)
      await onUpdateMetadata(document.id, metadata)
      setIsEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes')
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setError(null)
  }

  const handleDelete = async () => {
    if (!document.customMetadata?.id) return
    
    try {
      setError(null)
      await onDeleteMetadata(document.customMetadata.id, document.id)
      setIsEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete metadata')
    }
  }

  const handleShare = async () => {
    try {
      setShareStatus('idle')
      const documentUrl = `${window.location.origin}/api/document-library/view/${document.id}`

      if (navigator.share) {
        await navigator.share({
          title: document.title,
          text: `Check out this Leadership Training Deck: ${document.title}`,
          url: documentUrl,
        })
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(documentUrl)
        setShareStatus('copied')
        setTimeout(() => setShareStatus('idle'), 2000)
      } else {
        // Fallback for browsers that don't support sharing or clipboard
        setShareStatus('error')
        setTimeout(() => setShareStatus('idle'), 2000)
      }
    } catch (err) {
      // User cancelled share or clipboard failed
      console.error('Share failed:', err)
      setShareStatus('error')
      setTimeout(() => setShareStatus('idle'), 2000)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return null
    try {
      return new Date(dateString).toLocaleDateString()
    } catch {
      return dateString
    }
  }

  return (
    <Card className="relative overflow-hidden transition-all duration-200 hover:shadow-lg group bg-white border border-gray-200">
      {isUpdating && (
        <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-10 flex items-center justify-center">
          <div className="flex items-center gap-2 text-sm text-black bg-white px-3 py-2 rounded-md shadow-sm border border-gray-200">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Updating...</span>
          </div>
        </div>
      )}

      <div className="p-6">
        {/* Document Title - Clickable */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 gap-2">
          <button
            onClick={() => onDocumentClick(document.id)}
            className="flex items-start gap-3 text-left hover:bg-gray-50 -m-2 p-2 rounded-md transition-colors group flex-1"
          >
            <FileText className="h-5 w-5 text-gray-500 group-hover:text-black mt-0.5 flex-shrink-0 transition-colors" />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-black group-hover:text-blue-600 transition-colors leading-tight">
                {document.title}
              </h3>
              {document.description && (
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {document.description}
                </p>
              )}
            </div>
            <ExternalLink className="h-4 w-4 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5 flex-shrink-0" />
          </button>

          {/* Edit Button for Admin */}
          {isEditMode && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleEdit}
              disabled={isUpdating}
              className="gap-2 self-start sm:ml-2"
            >
              <Edit3 className="h-4 w-4" />
              <span className="hidden sm:inline">Edit</span>
            </Button>
          )}
        </div>

        {/* Document Metadata Display/Edit */}
        {isEditing ? (
          <MetadataEditForm
            initialData={{
              presented_by: document.customMetadata?.presented_by || '',
              meeting_date: document.customMetadata?.meeting_date || ''
            }}
            onSave={handleSave}
            onCancel={handleCancel}
            onDelete={document.customMetadata?.id ? handleDelete : undefined}
            isLoading={isUpdating}
          />
        ) : (
          <div className="space-y-3">
            {/* Presented By */}
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">Presented by:</span>
              <span className="font-medium text-black">
                {document.customMetadata?.presented_by || (
                  <span className="text-gray-500 italic">Not specified</span>
                )}
              </span>
            </div>

            {/* Meeting Date */}
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">Meeting date:</span>
              <span className="font-medium text-black">
                {formatDate(document.customMetadata?.meeting_date) || (
                  <span className="text-gray-500 italic">Not specified</span>
                )}
              </span>
            </div>

            {/* Tags */}
            {document.tags && document.tags.length > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-start gap-2 text-sm">
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Tag className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">Tags:</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {document.tags.map((tag) => (
                    <Badge key={tag.id} variant="secondary" className="text-xs">
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Share Button - Bottom Right */}
            <div className="flex justify-end pt-3 border-t border-gray-200">
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                disabled={isUpdating}
                className="gap-2"
              >
                <Share2 className="h-4 w-4" />
                <span className="text-xs">
                  {shareStatus === 'copied' ? 'Copied!' : shareStatus === 'error' ? 'Error' : 'Share'}
                </span>
              </Button>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}
      </div>
    </Card>
  )
}