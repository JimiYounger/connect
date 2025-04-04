// src/features/homepage/components/Navigation/NavigationItem.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronRight, ExternalLink } from 'lucide-react'
import type { NavigationItem as NavigationItemType } from '@/features/content/types'
import { cn } from '@/lib/utils'
import { useAuth } from '@/features/auth/context/auth-context'
import { useProfile } from '@/features/users/hooks/useProfile'
import { processDynamicUrl } from '@/features/widgets/components/widget-renderer'

interface NavigationItemProps {
  item: NavigationItemType
  childItems?: NavigationItemType[]
  renderItems?: (items: NavigationItemType[]) => React.ReactNode
  onNavigate: () => void
  depth?: number
}

export function NavigationItem({
  item,
  childItems = [],
  renderItems,
  onNavigate,
  depth = 0
}: NavigationItemProps) {
  const [expanded, setExpanded] = useState(false)
  const hasChildren = childItems && childItems.length > 0
  
  // Get user data for dynamic URLs
  const { session } = useAuth()
  const { profile } = useProfile(session)
  
  // Process the URL with user data
  const processedUrl = processDynamicUrl(item.url, profile)

  const handleClick = () => {
    if (hasChildren) {
      setExpanded(!expanded)
    } else {
      onNavigate()
    }
  }

  const content = (
    <div
      className={cn(
        "flex items-center justify-between p-6 bg-zinc-900 text-white rounded-[14px] cursor-pointer hover:bg-zinc-800 transition-colors",
        depth > 0 && "ml-4"
      )}
      onClick={handleClick}
    >
      <div className="flex-1">
        <span className="font-medium text-lg">{item.title}</span>
        {item.description && (
          <p className="text-sm text-zinc-400 mt-1">{item.description}</p>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        {item.is_external && (
          <ExternalLink className="h-5 w-5 text-zinc-500" />
        )}
        <div className="h-8 w-8 bg-white rounded-full flex items-center justify-center">
          <ChevronRight 
            className={cn(
              "h-5 w-5 text-black transition-transform",
              expanded && hasChildren && "transform rotate-90"
            )} 
          />
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      {item.is_external ? (
        <a 
          href={processedUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          onClick={onNavigate}
          className="block"
        >
          {content}
        </a>
      ) : (
        <Link 
          href={processedUrl}
          onClick={!hasChildren ? onNavigate : undefined}
          className="block"
        >
          {content}
        </Link>
      )}
      
      {hasChildren && expanded && renderItems && (
        <div className="mt-4 space-y-4">
          {renderItems(childItems)}
        </div>
      )}
    </div>
  )
}