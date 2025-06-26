'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ChevronDown,
  ExternalLink,
  Link as LinkIcon,
  MonitorPlay,
  Trash2 as TrashIcon,
} from 'lucide-react'
import { useNavigation } from '@/features/navigation/hooks/useNavigation'
import type { NavigationItemWithChildren } from '../types'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface NavigationItemProps {
  item: NavigationItemWithChildren
  processUrl?: (url: string) => string
  depth?: number
  className?: string
  showTooltips?: boolean
  isDraggable?: boolean
  onClick?: (itemId: string) => void
  onDelete?: (itemId: string) => void
}

export function NavigationItem({
  item,
  processUrl = (url) => url,
  depth = 0,
  className,
  showTooltips = false,
  isDraggable = false,
  onClick,
  onDelete,
}: NavigationItemProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { logNavigationClick } = useNavigation()
  const [isExpanded, setIsExpanded] = useState(false)

  const processedUrl = processUrl(item.url)
  const isActive = pathname === processedUrl
  const hasChildren = item.children && item.children.length > 0
  const isIframe = item.open_in_iframe

  // Handle navigation logic
  const handleNavigation = async () => {
    if (onClick) {
      onClick(item.id)
      return
    }

    await logNavigationClick(item.id)

    if (item.is_external) {
      window.open(processedUrl, '_blank', 'noopener,noreferrer')
    } else if (isIframe) {
      console.log('Open in iframe:', processedUrl)
    } else {
      router.push(processedUrl)
    }
  }

  // Handle mouse click
  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    await handleNavigation()
  }

  // Handle keyboard interaction
  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      await handleNavigation()
    }
  }

  // Get the appropriate icon for the item type
  const ItemIcon = item.is_external
    ? ExternalLink
    : isIframe
    ? MonitorPlay
    : hasChildren
    ? undefined
    : LinkIcon

  const content = (
    <div
      className={cn(
        'group flex items-center gap-2 rounded-md transition-colors w-full',
        isActive
          ? 'bg-accent text-accent-foreground'
          : 'hover:bg-accent/50',
        depth > 0 ? 'p-2' : 'p-3',
        className
      )}
    >
      <div className="flex-1 flex items-center gap-2">
        {hasChildren ? (
          <CollapsibleTrigger
            onClick={(e) => {
              e.stopPropagation()
              setIsExpanded(!isExpanded)
            }}
            className="flex items-center gap-2"
          >
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="h-4 w-4" />
            </motion.div>
          </CollapsibleTrigger>
        ) : ItemIcon ? (
          <ItemIcon className="h-4 w-4 text-muted-foreground" />
        ) : null}
        
        <span className={cn('flex-1', isActive && 'font-medium')}>
          {item.title}
        </span>

        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(item.id)
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <TrashIcon className="h-4 w-4 text-muted-foreground hover:text-destructive" />
          </button>
        )}
      </div>
    </div>
  )

  const wrappedContent = showTooltips ? (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {content}
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>{item.description || item.title}</p>
          {item.is_external && <p className="text-xs text-muted-foreground">Opens in new tab</p>}
          {isIframe && <p className="text-xs text-muted-foreground">Opens in panel</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ) : content

  return (
    <div className={cn('flex flex-col', depth > 0 && 'ml-4')}>
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={cn(
          'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          isDraggable && 'cursor-move'
        )}
      >
        {wrappedContent}
      </div>

      {hasChildren && (
        <Collapsible open={isExpanded}>
          <CollapsibleContent className="space-y-1 mt-1">
            {item.children?.map((child: NavigationItemWithChildren) => (
              <NavigationItem
                key={child.id}
                item={child}
                processUrl={processUrl}
                depth={depth + 1}
                showTooltips={showTooltips}
                isDraggable={isDraggable}
                onClick={onClick}
                onDelete={onDelete}
              />
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  )
} 