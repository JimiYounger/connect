'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/features/auth/context/auth-context'
import { useProfile } from '@/features/users/hooks/useProfile'
import { usePermissions } from '@/features/permissions/hooks/usePermissions'
import { Loader2, LineChart, Activity, AlertOctagon, ImageIcon, MessageSquare, Settings, Users, BookText, Menu, X, Home, Video, Search, BarChart3 } from 'lucide-react'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { UserProfileNav } from "@/features/users/components/UserProfileNav"
import { cn } from '@/lib/utils'

interface AdminLayoutProps {
  children: React.ReactNode
}

const navItems = [
  { name: "Home", icon: Home, href: "/home" },
  { name: "Dashboards", icon: LineChart, href: "/admin/dashboards" },
  { name: "Widgets", icon: Settings, href: "/admin/widgets" },
  { name: "Navigation", icon: Users, href: "/admin/navigation" },
  { name: "Messaging", icon: MessageSquare, href: "/admin/messaging" },
  { name: "Carousel", icon: ImageIcon, href: "/admin/carousel" },
  { name: "Documents", icon: BookText, href: "/admin/document-library" },
  { name: "Videos", icon: Video, href: "/admin/video-library" },
  { name: "Analytics", icon: BarChart3, href: "/admin/analytics" },
  { name: "Video Search Test", icon: Search, href: "/admin/video-library/search-test" },
  { name: "Activities", icon: Activity, href: "/admin/activities" },
  { name: "Errors", icon: AlertOctagon, href: "/admin/errors" },
]

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { session, loading } = useAuth()
  const { profile, isLoading: isProfileLoading } = useProfile(session)
  const { can, isLoading: isPermissionLoading } = usePermissions(profile)
  const [hasAdminAccess, setHasAdminAccess] = useState<boolean | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    let isMounted = true

    if (profile && !isPermissionLoading) {
      can('admin:access' as any).then((result) => {
        if (isMounted) {
          setHasAdminAccess(result)
        }
      })
    }

    return () => {
      isMounted = false
    }
  }, [profile, isPermissionLoading, can])

  // Show loading state while initializing
  if (loading.initializing || loading.any) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  // Check if user is authenticated
  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You must be signed in to access this area.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Show loading state while checking permissions
  if (isProfileLoading || isPermissionLoading || hasAdminAccess === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  // Show unauthorized state if no admin access
  if (!hasAdminAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertTitle>Unauthorized</AlertTitle>
          <AlertDescription>
            You do not have permission to access the admin area.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Render admin content if all checks pass
  return (
    <div className="min-h-screen flex flex-col bg-white text-black admin-layout">
      <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur-sm">
        <div className="container mx-auto flex h-auto min-h-16 flex-col md:flex-row md:items-center justify-between px-4 py-2">
          <div className="flex items-center justify-between">
            <Link href="/admin" className="flex items-center gap-2">
              <Image src="/connect.png" alt="Connect Logo" width={32} height={32} />
              <span className="font-semibold text-lg">Connect Admin</span>
            </Link>
            
            {/* Mobile menu button */}
            <Button 
              variant="outline" 
              size="icon" 
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              <span className="sr-only">Toggle menu</span>
            </Button>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex md:flex-1 items-center justify-end">
            <ul className="flex flex-wrap gap-x-1 lg:gap-x-3">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link 
                    href={item.href} 
                    className="flex items-center gap-1 md:gap-1.5 rounded-md px-2 lg:px-3 py-2 text-xs lg:text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 whitespace-nowrap"
                  >
                    <item.icon className="h-3.5 w-3.5 lg:h-4 lg:w-4 flex-shrink-0" />
                    <span>{item.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
            
            {profile && (
              <div className="ml-3 lg:ml-4">
                <UserProfileNav profile={profile} />
              </div>
            )}
          </nav>
        </div>
        
        {/* Mobile Navigation */}
        <div className={cn(
          "md:hidden overflow-hidden transition-all duration-300",
          mobileMenuOpen ? "max-h-[500px] border-t border-gray-200" : "max-h-0"
        )}>
          <nav className="container mx-auto px-4 py-2">
            <ul className="grid grid-cols-2 gap-2">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link 
                    href={item.href} 
                    className="flex items-center gap-2 rounded-md p-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>
      
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}