export interface FileInfo {
  cdnUrl: string
  uuid: string
  originalFilename: string
  mimeType: string
  size: number
}

export interface StoredFile extends FileInfo {
  id: string
  created_at: string
  user_id: string
} 