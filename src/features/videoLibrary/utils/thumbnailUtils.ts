/**
 * Utility functions for handling video thumbnails based on thumbnail source
 */

export type ThumbnailSource = 'vimeo' | 'upload' | 'url'

export interface VideoThumbnailData {
  thumbnailSource?: ThumbnailSource
  customThumbnailUrl?: string
  vimeoThumbnailUrl?: string
}

/**
 * Get the correct thumbnail URL based on the thumbnail source
 */
export function getVideoThumbnailUrl(video: VideoThumbnailData): string {
  const { thumbnailSource, customThumbnailUrl, vimeoThumbnailUrl } = video
  
  switch (thumbnailSource) {
    case 'upload':
    case 'url':
      return customThumbnailUrl || vimeoThumbnailUrl || ''
    case 'vimeo':
    default:
      return vimeoThumbnailUrl || ''
  }
}

/**
 * Get a description of the thumbnail source for display purposes
 */
export function getThumbnailSourceLabel(thumbnailSource?: ThumbnailSource): string {
  switch (thumbnailSource) {
    case 'upload':
      return 'Custom Upload'
    case 'url':
      return 'External URL'
    case 'vimeo':
    default:
      return 'Vimeo'
  }
}