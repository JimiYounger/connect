export interface StyleConfig {
  size?: 'small' | 'medium' | 'large' | 'wide'
  shape?: 'square' | 'rectangle' | 'circle'
  bgColor?: string
  theme?: 'default' | 'gradient' | 'accent' | 'studio'
  order?: number
  background?: {
    color?: string
    gradient?: string
    image?: string
  }
}

export interface DashboardItemStyleConfig {
  style_config: StyleConfig | null
}

export interface LayoutConfig {
  desktop: {
    columns: number
    gap: number
  }
  mobile: {
    columns: number
    gap: number
  }
}

export interface DashboardConfig {
  id: string
  layout_config: LayoutConfig
  // ... other fields
} 