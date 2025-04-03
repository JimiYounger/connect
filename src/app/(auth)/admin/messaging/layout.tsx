'use client'

import { AuthGuard } from '@/features/auth/components/AuthGuard'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ErrorBoundary } from 'react-error-boundary'
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

function ErrorFallback() {
  return (
    <Alert variant="destructive" className="my-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        Something went wrong loading this page. Please try refreshing.
      </AlertDescription>
    </Alert>
  )
}

export default function MessagingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const tabs = [
    { label: 'Dashboard', path: '/admin/messaging' },
    { label: 'Conversations', path: '/admin/messaging/conversations' },
    { label: 'New Message', path: '/admin/messaging/new' },
    { label: 'Settings', path: '/admin/messaging/settings' },
  ]

  return (
    <AuthGuard>
      <div className="space-y-6 p-6">
        <div className="space-y-0.5">
          <h2 className="text-2xl font-bold tracking-tight">Messaging</h2>
          <p className="text-muted-foreground">
            Manage and send messages to employees
          </p>
        </div>

        <Tabs defaultValue={pathname} className="w-full">
          <TabsList className="mb-6">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.path}
                value={tab.path === '/admin/messaging' ? tab.path : tab.path.startsWith(pathname) ? pathname : tab.path}
                asChild
              >
                <Link href={tab.path}>{tab.label}</Link>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <ErrorBoundary FallbackComponent={ErrorFallback}>
          {children}
        </ErrorBoundary>
      </div>
    </AuthGuard>
  )
} 