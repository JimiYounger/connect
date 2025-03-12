'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { UploadcareUploader } from '@/components/uploadcare-uploader'
import { useFiles } from '@/hooks/use-files'
import type { FileInfo } from '@/types/files'

interface ImageUploadProps {
  value?: string | null
  onChange: (url: string, fileId?: string) => void
  className?: string
}

export function ImageUpload({ value, onChange, className }: ImageUploadProps) {
  const [_isUploading, setIsUploading] = useState(false)
  const { saveFile } = useFiles()

  const handleUpload = async (fileInfo: FileInfo) => {
    try {
      setIsUploading(true)
      
      // Save the file to our database
      console.log('Saving file to database:', fileInfo);
      const storedFile = await saveFile(fileInfo)
      console.log('File saved to database, received ID:', storedFile?.id);
      
      // Pass both the CDN URL and the file ID to the parent component
      if (storedFile) {
        console.log('Passing file ID to parent component:', storedFile.id);
        onChange(fileInfo.cdnUrl, storedFile.id)
      } else {
        // Fallback in case file saving fails
        console.log('No stored file returned, passing only URL');
        onChange(fileInfo.cdnUrl)
      }
    } catch (error) {
      console.error('Error uploading image:', error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemove = () => {
    onChange('', undefined)
  }

  return (
    <div className={className}>
      {value ? (
        <div className="relative w-full rounded-lg border bg-background">
          <div 
            className="relative w-full rounded-lg overflow-hidden"
            style={{ paddingTop: '56.25%' }} // 16:9 aspect ratio
          >
            <Image
              src={value}
              alt="Uploaded image"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 z-10"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <UploadcareUploader
          onUpload={handleUpload}
          className="w-full"
        />
      )}
    </div>
  )
} 