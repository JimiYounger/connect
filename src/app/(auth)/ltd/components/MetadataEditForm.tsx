'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Save, X, Trash2, Loader2 } from 'lucide-react'

interface MetadataEditFormProps {
  initialData: {
    presented_by: string
    meeting_date: string
  }
  onSave: (data: { presented_by?: string; meeting_date?: string }) => Promise<void>
  onCancel: () => void
  onDelete?: () => Promise<void>
  isLoading: boolean
}

export function MetadataEditForm({
  initialData,
  onSave,
  onCancel,
  onDelete,
  isLoading
}: MetadataEditFormProps) {
  const [presentedBy, setPresentedBy] = useState(initialData.presented_by)
  const [meetingDate, setMeetingDate] = useState(initialData.meeting_date)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleSave = async () => {
    const data: { presented_by?: string; meeting_date?: string } = {}
    
    if (presentedBy.trim()) {
      data.presented_by = presentedBy.trim()
    }
    
    if (meetingDate) {
      data.meeting_date = meetingDate
    }

    await onSave(data)
  }

  const handleDelete = async () => {
    if (!onDelete) return
    
    const confirmed = window.confirm(
      'Are you sure you want to delete this metadata? This action cannot be undone.'
    )
    
    if (confirmed) {
      setIsDeleting(true)
      try {
        await onDelete()
      } finally {
        setIsDeleting(false)
      }
    }
  }

  const hasChanges = 
    presentedBy !== initialData.presented_by || 
    meetingDate !== initialData.meeting_date

  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-md border border-gray-200">
      <div className="space-y-3">
        {/* Presented By Field */}
        <div className="space-y-1">
          <Label htmlFor="presented-by" className="text-sm font-medium text-black">
            Presented by
          </Label>
          <Input
            id="presented-by"
            type="text"
            value={presentedBy}
            onChange={(e) => setPresentedBy(e.target.value)}
            placeholder="Enter presenter name"
            disabled={isLoading}
            className="w-full bg-white border-gray-300"
          />
        </div>

        {/* Meeting Date Field */}
        <div className="space-y-1">
          <Label htmlFor="meeting-date" className="text-sm font-medium text-black">
            Meeting date
          </Label>
          <Input
            id="meeting-date"
            type="date"
            value={meetingDate}
            onChange={(e) => setMeetingDate(e.target.value)}
            disabled={isLoading}
            className="w-full bg-white border-gray-300"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-3 border-t gap-2">
        <div className="flex items-center gap-2 order-2 sm:order-1">
          <Button
            onClick={handleSave}
            disabled={isLoading || !hasChanges}
            size="sm"
            className="gap-2 flex-1 sm:flex-none"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save
          </Button>
          
          <Button
            onClick={onCancel}
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="gap-2 flex-1 sm:flex-none"
          >
            <X className="h-4 w-4" />
            Cancel
          </Button>
        </div>

        {/* Delete Button */}
        {onDelete && (
          <Button
            onClick={handleDelete}
            disabled={isLoading || isDeleting}
            variant="outline"
            size="sm"
            className="gap-2 text-destructive hover:text-destructive order-1 sm:order-2 w-full sm:w-auto"
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Delete
          </Button>
        )}
      </div>
    </div>
  )
}