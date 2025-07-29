// LTD (Leadership Training Decks) Types

export interface DocumentCustomMetadata {
  id: string
  document_id: string
  metadata_type: string
  presented_by?: string
  meeting_date?: string
  created_at: string
  updated_at: string
  created_by?: string
}

export interface LTDDocument {
  id: string
  title: string
  description?: string
  category: {
    id: string
    name: string
  }
  subcategory: {
    id: string
    name: string
  }
  summary?: string
  tags?: Array<{
    id: string
    name: string
  }>
  uploadedBy?: {
    id: string
    first_name: string
    last_name: string
    email: string
  }
  createdAt: string
  updatedAt: string
  customMetadata?: DocumentCustomMetadata
}

export interface LTDDocumentListResponse {
  success: boolean
  data: LTDDocument[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface CreateMetadataRequest {
  document_id: string
  presented_by?: string
  meeting_date?: string
}

export interface UpdateMetadataRequest {
  id: string
  presented_by?: string
  meeting_date?: string
}

export interface LTDApiError {
  success: false
  error: string
}

// Constants
export const LTD_CONSTANTS = {
  METADATA_TYPE: 'leadership_training_deck',
  CATEGORY_NAME: 'Leadership Training',
  SUBCATEGORY_NAME: 'Decks',
  // These will be the actual IDs from the database
  CATEGORY_ID: '82ef98b3-1c1d-4a8f-9711-9fc11895d22e',
  SUBCATEGORY_ID: '913c204e-2b29-4d1e-b05e-40bb08c569b5'
} as const