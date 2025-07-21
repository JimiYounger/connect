// src/features/purelighttv/types/index.ts

/**
 * PureLightTV Video from Vimeo API
 */
export interface PureLightTVVideo {
  uri: string
  name: string
  description?: string
  duration: number
  created_time: string
  modified_time: string
  release_time?: string
  pictures?: {
    sizes: Array<{
      width: number
      height: number
      link: string
    }>
  }
  player_embed_url: string
  embed?: {
    html: string
  }
  stats?: {
    plays: number
  }
  tags?: Array<{
    name: string
    canonical: string
  }>
}

/**
 * Vimeo API Response for PureLightTV
 */
export interface PureLightTVResponse {
  data: PureLightTVVideo[]
  total: number
  page: number
  per_page: number
  paging: {
    next?: string
    previous?: string
    first: string
    last: string
  }
}

/**
 * Processed video for display
 */
export interface ProcessedPureLightTVVideo {
  id: string
  title: string
  description?: string
  duration: number
  createdAt: string
  modifiedAt: string
  releaseDate?: string
  thumbnailUrl?: string
  embedUrl: string
  embedHtml?: string
  playCount?: number
  tags?: string[]
}

/**
 * PureLightTV Page State
 */
export interface PureLightTVPageState {
  featuredVideo: ProcessedPureLightTVVideo | null
  previousVideos: ProcessedPureLightTVVideo[]
  loading: boolean
  error: string | null
  isHydrated: boolean
}