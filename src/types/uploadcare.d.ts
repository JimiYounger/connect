// src/types/uploadcare.d.ts
declare module '@uploadcare/react-uploader' {
  import { FC } from 'react'
  
  interface UploaderProps {
    publicKey: string
    onComplete: (fileInfo: any) => void
    locale?: string
    previewStep?: boolean
    tabsCss?: Record<string, any>
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