// my-app/src/features/documentLibrary/viewer/types.ts
/**
 * Type definitions for Document Library Viewer
 */

// Document category
export interface DocumentCategory {
  id: string;
  name: string;
}

// Document tag
export interface DocumentTag {
  id: string;
  name: string;
}

// User who uploaded the document
export interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

// Processed document with all required info
export interface Document {
  id: string;
  title: string;
  description: string | null;
  category: DocumentCategory | null;
  subcategory: DocumentCategory | null;
  contentPreview: string | null;
  tags: DocumentTag[];
  uploadedBy: UserProfile | null;
  createdAt: string;
  updatedAt: string;
  chunksCount: number;
}

// Filter parameters for document list
export interface DocumentFilters {
  document_category_id?: string;
  document_subcategory_id?: string;
  tags?: string[];
  uploadedBy?: string;
  searchQuery?: string;
  page?: number;
  limit?: number;
}

// Pagination info
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// API response from document list endpoint
export interface DocumentListResponse {
  success: boolean;
  data: Document[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  error?: string;
}