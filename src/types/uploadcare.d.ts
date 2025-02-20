// src/types/uploadcare.d.ts
declare module '@uploadcare/react-uploader' {
  import { FC } from 'react'
  
  interface UploaderProps {
    publicKey: string
    onComplete: (fileInfo: { 
      uuid: string; 
      cdnUrl: string; 
      name?: string; 
      size?: number; 
      isImage?: boolean; 
    }) => void
    locale?: string
    previewStep?: boolean
    tabsCss?: Record<string, string | number | Record<string, string | number>>
  }

  export const Uploader: FC<UploaderProps>
}

declare module '@uploadcare/upload-client' {
  export interface UploadcareFile {
    uuid: string
    originalFilename?: string
    mimeType?: string
    size?: number
  }
} 