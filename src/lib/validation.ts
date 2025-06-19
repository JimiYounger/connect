// src/lib/validation.ts

import { z } from 'zod'

/**
 * Validation schemas for video library API endpoints
 */

// UUID validation for IDs
export const uuidSchema = z.string().uuid('Invalid ID format')

// Video list parameters validation
export const videoListParamsSchema = z.object({
  video_category_id: z.string().uuid().optional(),
  video_subcategory_id: z.string().uuid().optional(),
  video_series_id: z.string().uuid().optional(),
  tags: z.array(z.string().min(1).max(50)).max(10).optional(),
  admin_selected: z.boolean().optional(),
  library_status: z.enum(['pending', 'processing', 'completed', 'error', 'approved', 'rejected', 'archived']).optional(),
  searchQuery: z.string().min(1).max(200).optional(),
  page: z.number().int().min(1).max(1000).optional(),
  limit: z.number().int().min(1).max(1000).optional()
})

// Video update parameters validation
export const videoUpdateParamsSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  categoryId: z.string().uuid().optional(),
  subcategoryId: z.string().uuid().optional(),
  tags: z.array(z.string().min(1).max(50)).max(20).optional(),
  libraryStatus: z.enum(['pending', 'approved', 'rejected', 'archived']).optional(),
  permissions: z.object({
    roleTypes: z.array(z.string()).optional(),
    teams: z.array(z.string()).optional(),
    areas: z.array(z.string()).optional(),
    regions: z.array(z.string()).optional()
  }).optional(),
  publicSharingEnabled: z.boolean().optional(),
  customThumbnailUrl: z.string().url().max(500).optional(),
  thumbnailSource: z.enum(['vimeo', 'upload', 'url']).optional()
})

/**
 * Sanitization functions
 */

// Sanitize text input to prevent XSS
export function sanitizeText(input: string): string {
  return input
    .trim()
    // Remove potentially dangerous HTML tags
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    // Limit length
    .substring(0, 2000)
}

// Sanitize search query
export function sanitizeSearchQuery(query: string): string {
  return query
    .trim()
    // Remove SQL injection attempts
    .replace(/[';\"\\]/g, '')
    // Remove excessive whitespace
    .replace(/\s+/g, ' ')
    // Limit length
    .substring(0, 200)
}

/**
 * Validation helper functions
 */

// Validate and sanitize video list parameters
export function validateVideoListParams(params: any) {
  const result = videoListParamsSchema.safeParse(params)
  
  if (!result.success) {
    throw new Error(`Invalid parameters: ${result.error.errors.map(e => e.message).join(', ')}`)
  }
  
  // Sanitize string fields
  const sanitized = { ...result.data }
  if (sanitized.searchQuery) {
    sanitized.searchQuery = sanitizeSearchQuery(sanitized.searchQuery)
  }
  if (sanitized.tags) {
    sanitized.tags = sanitized.tags.map(tag => sanitizeText(tag))
  }
  
  return sanitized
}

// Validate and sanitize video update parameters
export function validateVideoUpdateParams(params: any) {
  const result = videoUpdateParamsSchema.safeParse(params)
  
  if (!result.success) {
    throw new Error(`Invalid parameters: ${result.error.errors.map(e => e.message).join(', ')}`)
  }
  
  // Sanitize string fields
  const sanitized = { ...result.data }
  if (sanitized.title) {
    sanitized.title = sanitizeText(sanitized.title)
  }
  if (sanitized.description) {
    sanitized.description = sanitizeText(sanitized.description)
  }
  if (sanitized.tags) {
    sanitized.tags = sanitized.tags.map(tag => sanitizeText(tag))
  }
  
  return sanitized
}

// Validate UUID
export function validateUUID(id: string, fieldName: string = 'ID'): string {
  const result = uuidSchema.safeParse(id)
  
  if (!result.success) {
    throw new Error(`Invalid ${fieldName}: must be a valid UUID`)
  }
  
  return result.data
}