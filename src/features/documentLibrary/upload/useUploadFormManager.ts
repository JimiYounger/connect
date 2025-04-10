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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return
    
    const newFiles = Array.from(e.target.files)
    setSelectedFiles(prev => [...prev, ...newFiles])
    
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
    // Also remove from selectedFiles array
    const formEntry = documentForms.find(form => form.id === id)
    if (formEntry) {
      setSelectedFiles(prev => prev.filter(file => file !== formEntry.file))
    }
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
    setSelectedFiles([])
  }
  
  return {
    documentForms,
    handleFileChange,
    removeFile,
    updateFormData,
    clearAll
  }
}