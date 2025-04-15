'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
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

export function UploadModal({ onUploadSuccess }: UploadModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { toast } = useToast()

  // Get current user
  const { data: userId } = useQuery({
    queryKey: ['currentUserId'],
    queryFn: async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      return user?.id || ''
    }
  })

  // Fetch categories
  const { data: categories = [], refetch: refetchCategories } = useQuery({
    queryKey: ['documentCategories'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('document_categories')
        .select('id, name')
        .order('name')
      
      if (error) throw new Error(error.message)
      return data || []
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  })

  // Fetch all available tags
  const { data: tagData = [] } = useQuery({
    queryKey: ['documentTags'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('document_tags')
        .select('name')
        .order('name')
      
      if (error) throw new Error(error.message)
      return data || []
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  })

  const allTags = tagData.map(tag => tag.name)

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