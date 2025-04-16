'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { UploadForm } from './UploadForm'
import { Button } from '@/components/ui/button'
import { Upload } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface UploadModalProps {
  onUploadSuccess: () => void
}

interface Tag {
  id: string; // Or the correct type for id
  name: string;
}

export function UploadModal({ onUploadSuccess }: UploadModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { toast } = useToast()

  // Get current user using the API route
  const { data: userId } = useQuery({
    queryKey: ['currentUserId'],
    queryFn: async () => {
      const response = await fetch('/api/users/current')
      const result = await response.json()
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch current user')
      }
      
      return result.data.id || ''
    }
  })

  // Fetch categories using the API route
  const { data: categories = [], refetch: refetchCategories } = useQuery({
    queryKey: ['documentCategories'],
    queryFn: async () => {
      const response = await fetch('/api/document-library/categories')
      const result = await response.json()
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch categories')
      }
      
      return result.data || []
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  })

  // Fetch all available tags using the API route
  const { data: tagData = [] } = useQuery<Tag[]>({
    queryKey: ['documentTags'],
    queryFn: async () => {
      const response = await fetch('/api/document-library/tags')
      const result = await response.json()
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch tags')
      }
      
      return result.data || []
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  })

  const allTags = tagData.map((tag: Tag) => tag.name)

  const handleUploadSuccess = () => {
    // Close modal
    setIsOpen(false)
    
    // Trigger callback to refresh documents immediately
    onUploadSuccess()
    
    // Add success toast
    toast({
      title: "Success",
      description: "Document uploaded successfully.",
      variant: "default"
    })
  }
  
  // Pass the success handler to the UploadForm

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Upload className="h-4 w-4" />
          Upload Document
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
        </DialogHeader>
        {userId && (
          <UploadForm 
            categories={categories} 
            allTags={allTags} 
            userId={userId}
            onUploadSuccess={handleUploadSuccess}
            onCategoryCreated={() => refetchCategories()}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}