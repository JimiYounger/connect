// my-app/src/features/documentLibrary/upload/useUploadFormManager.ts

import { useState, ChangeEvent } from 'react'

type DocumentFormData = {
  selectedTags: string[]
}

export type DocumentForm = {
  id: string
  file: File
  data: DocumentFormData
}

export function useUploadFormManager() {
  const [documentForms, setDocumentForms] = useState<DocumentForm[]>([])
  
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return
    
    const newFiles = Array.from(e.target.files)
    
    // Create a form entry for each new file
    const newFormEntries = newFiles.map(file => ({
      id: `${file.name}-${Date.now()}`,
      file,
      data: {
        selectedTags: []
      }
    }))
    
    setDocumentForms(prev => [...prev, ...newFormEntries])
  }

  const removeFile = (id: string) => {
    setDocumentForms(prev => prev.filter(form => form.id !== id))
  }
  
  const updateFormData = (id: string, update: Partial<DocumentFormData>) => {
    setDocumentForms(prev => 
      prev.map(form => 
        form.id === id ? { ...form, data: { ...form.data, ...update } } : form
      )
    )
  }
  
  const clearAll = () => {
    setDocumentForms([])
  }
  
  return {
    documentForms,
    handleFileChange,
    removeFile,
    updateFormData,
    clearAll
  }
}