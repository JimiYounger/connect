'use client'

import React from 'react'
import { FileUploaderRegular } from "@uploadcare/react-uploader/next"
import type { UploadcareFile } from '@uploadcare/upload-client'
import type { FileInfo } from '@/types/files'
import "@uploadcare/react-uploader/core.css"

interface UploaderProps {
  onUpload: (fileInfo: FileInfo) => void
  className?: string
}

export function UploadcareUploader({ onUpload, className }: UploaderProps) {
  if (!process.env.NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY) {
    throw new Error('Missing Uploadcare public key')
  }

  const handleChange = async (files: { successEntries: UploadcareFile[] }) => {
    if (files?.successEntries?.length > 0) {
      const file = files.successEntries[0]
      console.log('File uploaded:', file) // For debugging
      
      // Just pass the file info to the parent component
      const fileInfo: FileInfo = {
        cdnUrl: `https://ucarecdn.com/${file.uuid}/`,
        uuid: file.uuid,
        originalFilename: file.originalFilename || 'untitled',
        mimeType: file.mimeType || 'application/octet-stream',
        size: file.size || 0,
      }
      
      onUpload(fileInfo)
    }
  }

  return (
    <div className={className}>
      <FileUploaderRegular
        pubkey={process.env.NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY}
        onChange={handleChange}
        className="w-full"
      />
    </div>
  )
} 