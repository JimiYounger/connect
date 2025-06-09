import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus } from 'lucide-react'
import { AudioUploadForm } from './AudioUploadForm'

interface SeriesOption {
  label: string
  value: string
}

interface UploadModalProps {
  seriesOptions: SeriesOption[]
  currentUserId: string
  buttonLabel?: string
  buttonVariant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive'
  buttonSize?: 'default' | 'sm' | 'lg' | 'icon'
  onUploadSuccess?: (audioFileId: string) => void
}

export function UploadModal({
  seriesOptions,
  currentUserId,
  buttonLabel = 'Upload Audio',
  buttonVariant = 'default',
  buttonSize = 'default',
  onUploadSuccess,
}: UploadModalProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Handle successful upload
  const handleSuccess = (audioFileId: string) => {
    // Close the modal
    setIsOpen(false)
    
    // Call the parent's onUploadSuccess callback if provided
    if (onUploadSuccess) {
      onUploadSuccess(audioFileId)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant={buttonVariant} size={buttonSize}>
          <Plus className="mr-2 h-4 w-4" />
          {buttonLabel}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Upload New Audio</DialogTitle>
          <DialogDescription>
            Add a new audio file to the library. Fill out the form below and click Upload.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <AudioUploadForm
            seriesOptions={seriesOptions}
            currentUserId={currentUserId}
            onSuccess={handleSuccess}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}