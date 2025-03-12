// src/features/homepage/components/Dashboard/DashboardWidget.tsx
'use client'

import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import type { DashboardWidget as DashboardWidgetType } from '@/features/content/types'
import { cn } from '@/lib/utils'
import { WidgetShape } from '@/features/widgets/types'

interface DashboardWidgetProps {
  widget: DashboardWidgetType
}

export function DashboardWidget({ widget }: DashboardWidgetProps) {
  // Extract properties from widget
  const {
    name,
    description,
    shape,
    size_ratio,
    config
  } = widget

  // Get url and is_external from configuration if available
  const url = config?.redirectUrl || ''
  const isExternal = url.startsWith('http') || url.startsWith('https')

  // Set color based on widget configuration or default to a teal color
  const backgroundColor = config?.styles?.backgroundColor || '#4DB6AC'
  
  // Determine size classes based on widget size_ratio
  let sizeClasses = 'aspect-square'
  if (size_ratio === '2:1') {
    sizeClasses = 'aspect-[2/1]'
  } else if (size_ratio === '1:2') {
    sizeClasses = 'aspect-[1/2]'
  }
  
  // Convert shape to className
  let shapeClass = 'rounded-3xl' // Default
  if (shape === WidgetShape.SQUARE) {
    shapeClass = 'rounded-lg'
  }
  
  const content = (
    <div 
      className={cn(
        'relative flex flex-col justify-between p-4 overflow-hidden transition-transform hover:scale-[1.02]',
        sizeClasses,
        shapeClass
      )}
      style={{ backgroundColor }}
    >
      <div>
        <h3 className="font-bold text-xl text-white">{name}</h3>
        {description && (
          <p className="text-white/80 text-sm mt-1 line-clamp-2">{description}</p>
        )}
      </div>
      
      {isExternal && (
        <div className="absolute top-3 right-3">
          <ExternalLink className="h-4 w-4 text-white/70" />
        </div>
      )}
    </div>
  )
  
  // Wrap in appropriate link container
  if (isExternal && url) {
    return (
      <a 
        href={url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="block"
      >
        {content}
      </a>
    )
  }
  
  if (url) {
    return (
      <Link href={url} className="block">
        {content}
      </Link>
    )
  }
  
  return content
}