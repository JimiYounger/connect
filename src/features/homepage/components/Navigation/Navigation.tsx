// src/features/homepage/components/Navigation/Navigation.tsx
'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useUserNavigation } from '@/features/content/hooks/useUserContent'
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetTitle } from '@/components/ui/sheet'
import { ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/features/auth/context/auth-context'
import { useProfile } from '@/features/users/hooks/useProfile'
import { processDynamicUrl } from '@/features/widgets/components/widget-renderer'

// Pre-fetch the image by creating a reference
const connectLogoUrl = '/connect.png';
if (typeof window !== 'undefined') {
  const img = new window.Image();
  img.src = connectLogoUrl;
}

interface NavigationProps {
  className?: string
}

export function Navigation({ className }: NavigationProps) {
  const [open, setOpen] = useState(false)
  const [_imageLoaded, setImageLoaded] = useState(false)
  const { data: navigationItems = [], isLoading, error } = useUserNavigation()
  const [currentLevel, setCurrentLevel] = useState<'parent' | 'child'>('parent')
  const [currentParentItem, setCurrentParentItem] = useState<typeof navigationItems[0] | null>(null)
  
  // Get user data for dynamic URLs
  const { session } = useAuth()
  const { profile } = useProfile(session)
  
  // Determine if we're using light theme based on className
  const isLightTheme = className?.includes('invert')
  
  // Preload the image when component mounts
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const img = new window.Image();
      img.src = connectLogoUrl;
      img.onload = () => setImageLoaded(true);
    }
  }, []);
  
  // Group items by their parent_id
  const groupedItems = navigationItems.reduce<Record<string, typeof navigationItems>>(
    (acc, item) => {
      const parentId = item.parent_id || 'root'
      if (!acc[parentId]) {
        acc[parentId] = []
      }
      acc[parentId].push(item)
      return acc
    },
    {}
  )
  
  // Sort items within each group by order_index
  Object.keys(groupedItems).forEach(key => {
    groupedItems[key].sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
  })
  
  // Determine which items to show based on current level
  const rootItems = groupedItems['root'] || []
  const childItems = currentParentItem ? (groupedItems[currentParentItem.id] || []) : []
  
  // Current items to display based on navigation level
  const currentItems = currentLevel === 'parent' ? rootItems : childItems

  // Navigate to children view
  const handleNavigateToChildren = (item: typeof navigationItems[0]) => {
    setCurrentParentItem(item)
    setCurrentLevel('child')
  }

  // Navigate back to parent level
  const handleBackToParent = () => {
    setCurrentLevel('parent')
    setCurrentParentItem(null)
  }

  // Use a more specific approach to remove the X button
  useEffect(() => {
    if (open) {
      // Remove the close button repeatedly to ensure it's gone
      const removeCloseButton = () => {
        // Target the specific button with these exact classes
        const closeButton = document.querySelector('button.absolute.right-4.top-4.rounded-sm.opacity-70');
        if (closeButton) {
          closeButton.remove();
          console.log('Close button removed');
        }
      };
      
      // Try to remove it immediately
      removeCloseButton();
      
      // Then keep checking and removing for a short period to ensure it's gone
      const interval = setInterval(removeCloseButton, 100);
      
      // Stop checking after 1 second
      const timeout = setTimeout(() => {
        clearInterval(interval);
      }, 1000);
      
      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button 
          className={cn(
            "flex flex-col items-center justify-center", 
            "bg-transparent", 
            "focus:outline-none",
            className
          )}
          style={{
            width: '30px',
            height: '21px',
          }}
          aria-label="Open navigation menu"
        >
          {/* Three lines with 6px spacing */}
          <span className={cn("w-[30px] h-[3px] mb-[6px]", isLightTheme ? "bg-black" : "bg-white")}></span>
          <span className={cn("w-[30px] h-[3px] mb-[6px]", isLightTheme ? "bg-black" : "bg-white")}></span>
          <span className={cn("w-[30px] h-[3px]", isLightTheme ? "bg-black" : "bg-white")}></span>
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 bg-black text-white border-0" style={{ width: '409px' }}>
        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        <style jsx global>{`
          button.absolute.right-4.top-4.rounded-sm.opacity-70 {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            pointer-events: none !important;
          }
        `}</style>
        
        <div className="flex flex-col h-full">
          <div className="relative" style={{ paddingTop: '124px', paddingLeft: '57px', paddingRight: '72px' }}>
            <div className="font-bold text-2xl">
              {currentLevel === 'child' ? (
                <div className="text-2xl">{currentParentItem?.title || 'Navigation'}</div>
              ) : (
                <Image
                  src={connectLogoUrl}
                  alt="Connect"
                  width={216}
                  height={61}
                  priority
                  loading="eager"
                  onLoadingComplete={() => setImageLoaded(true)}
                />
              )}
            </div>
            <SheetClose className="rounded-full custom-close absolute" style={{ right: '72px', top: '72px' }}>
              <div className="h-8 w-8 bg-white rounded-full flex items-center justify-center">
                <ChevronLeft className="h-5 w-5 text-black" />
              </div>
            </SheetClose>
          </div>
          <div className="overflow-y-auto flex-grow" style={{ paddingTop: '42px', paddingLeft: '38px', paddingRight: '37px' }}>
            {currentLevel === 'child' && (
              <button
                className="flex items-center mb-6 text-white"
                onClick={handleBackToParent}
              >
                <ChevronLeft className="h-5 w-5 mr-2" />
                <span>Back</span>
              </button>
            )}
          
            {isLoading ? (
              <div className="flex items-center justify-center min-h-[200px]">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
                  <p className="mt-4 text-zinc-400">Loading navigation...</p>
                </div>
              </div>
            ) : error ? (
              <div className="p-6 text-center text-red-400">Error loading navigation</div>
            ) : currentItems.length === 0 ? (
              <div className="p-6 text-center text-zinc-400">
                {currentLevel === 'child' ? 'No child items found' : 'No navigation items found'}
              </div>
            ) : (
              <nav className="space-y-[13px]">
                {currentItems.map((item) => {
                  const hasChildren = groupedItems[item.id]?.length > 0;
                  
                  const onClick = () => {
                    if (hasChildren) {
                      // Navigate to children instead of the URL
                      handleNavigateToChildren(item);
                    } else if (item.is_external) {
                      // Process the URL with user profile data
                      const processedUrl = processDynamicUrl(item.url, profile);
                      window.open(processedUrl, '_blank');
                      setOpen(false);
                    } else {
                      // Also process the URL for internal links
                      const processedUrl = processDynamicUrl(item.url, profile);
                      window.location.href = processedUrl;
                      setOpen(false);
                    }
                  };
                  
                  return (
                    <div 
                      key={item.id}
                      className="flex items-center justify-between bg-zinc-900 text-white rounded-[14px] cursor-pointer hover:bg-zinc-800 transition-colors"
                      style={{ 
                        width: '334px', 
                        height: '74px',
                        padding: '0 37px 0 38px' 
                      }}
                      onClick={onClick}
                    >
                      <div className="flex items-center">
                        <div className="font-medium text-lg">
                          {item.title}
                        </div>
                      </div>
                      <div className="h-8 w-8 bg-white rounded-full flex items-center justify-center">
                        <ChevronLeft className="h-5 w-5 text-black rotate-180" />
                      </div>
                    </div>
                  );
                })}
              </nav>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}