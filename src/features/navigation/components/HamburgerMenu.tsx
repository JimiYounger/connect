'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ChevronDown,
  ExternalLink,
  Menu,
} from 'lucide-react'
import { useNavigation } from '@/features/navigation/hooks/useNavigation'
import type { NavigationItemForDisplay } from '../types'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

interface ExpandedState {
  [key: string]: boolean
}

interface HamburgerMenuProps {
  currentUser?: {
    id: string
    email?: string
    roleType?: string
    team?: string
    area?: string
    region?: string
  }
}

export function HamburgerMenu({ currentUser }: HamburgerMenuProps) {
  const router = useRouter()
  const pathname = usePathname()
  const {
    userNavigation,
    isLoadingUserNav,
    logNavigationClick,
  } = useNavigation()

  const [isOpen, setIsOpen] = useState(false)
  const [expanded, setExpanded] = useState<ExpandedState>({})

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // Process dynamic URLs with user context
  const processUrl = (url: string) => {
    if (!currentUser) return url

    const replacements: Record<string, string> = {
      ':userId': currentUser.id,
      ':email': currentUser.email || '',
      ':roleType': currentUser.roleType || '',
      ':team': currentUser.team || '',
      ':area': currentUser.area || '',
      ':region': currentUser.region || ''
    }

    return Object.entries(replacements).reduce(
      (processedUrl, [key, value]) => processedUrl.replace(new RegExp(key, 'g'), value),
      url
    )
  }

  // Handle item click with analytics
  const handleItemClick = async (
    itemId: string,
    url: string,
    isExternal: boolean
  ) => {
    await logNavigationClick(itemId)

    if (isExternal) {
      window.open(url, '_blank', 'noopener,noreferrer')
    } else {
      router.push(url)
    }
  }

  // Toggle expanded state for an item
  const toggleExpanded = (itemId: string) => {
    setExpanded((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }))
  }

  // Render a navigation item
  const renderNavigationItem = (
    item: NavigationItemForDisplay,
    depth = 0
  ) => {
    const processedUrl = processUrl(item.processedUrl)
    const isActive = pathname === processedUrl
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expanded[item.id]

    return (
      <div key={item.id} className={cn('flex flex-col', depth > 0 && 'ml-4')}>
        <div
          className={cn(
            'flex items-center gap-2 rounded-md transition-colors',
            isActive
              ? 'bg-accent text-accent-foreground'
              : 'hover:bg-accent/50',
            depth > 0 ? 'p-2' : 'p-3'
          )}
        >
          {hasChildren ? (
            <CollapsibleTrigger
              onClick={() => toggleExpanded(item.id)}
              className={cn(
                'flex flex-1 items-center gap-2',
                isActive && 'font-medium'
              )}
            >
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="h-4 w-4" />
              </motion.div>
              <span>{item.title}</span>
            </CollapsibleTrigger>
          ) : (
            <button
              onClick={() => handleItemClick(item.id, processedUrl, item.isExternal)}
              className={cn(
                'flex flex-1 items-center gap-2',
                isActive && 'font-medium'
              )}
            >
              <span>{item.title}</span>
              {item.isExternal && (
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          )}
        </div>

        {hasChildren && (
          <Collapsible open={isExpanded}>
            <CollapsibleContent className="space-y-1 mt-1">
              {item.children?.map((child: NavigationItemForDisplay) => 
                renderNavigationItem(child, depth + 1)
              )}
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    )
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-5rem)]">
          <div className="p-2">
            {isLoadingUserNav ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : userNavigation && userNavigation.length > 0 ? (
              <div className="space-y-1">
                {userNavigation.map((item) => renderNavigationItem(item))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No navigation items available
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
} 