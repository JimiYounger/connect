'use client'

import { AuthGuard } from '@/features/auth/components/AuthGuard'
import { ConversationView } from '@/features/messaging/components/ConversationView'
import { ConversationList } from '@/features/messaging/components/ConversationList'
import { useMessages } from '@/features/messaging/hooks/useMessages'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { Suspense, useEffect, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'

export default function ConversationPage({
  params,
}: {
  params: { userId: string }
}) {
  const { userId } = params
  const router = useRouter()
  const { toast } = useToast()
  const [isInvalidUser, setIsInvalidUser] = useState(false)
  
  const { error } = useMessages({ userId })

  useEffect(() => {
    if (error) {
      toast({
        variant: "destructive",
        title: "Error loading conversation",
        description: typeof error === 'string' 
          ? error 
          : "Could not load the conversation. Please try again.",
      })
      setIsInvalidUser(true)
    }
  }, [error, toast])

  const handleBack = () => {
    router.push('/admin/messaging/conversations')
  }

  if (isInvalidUser) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px]">
        <h3 className="text-lg font-medium mb-2">User not found</h3>
        <p className="text-muted-foreground mb-4">This conversation doesn&apos;t exist or you don&apos;t have permission to view it.</p>
        <Button asChild>
          <Link href="/admin/messaging/conversations">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to conversations
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <AuthGuard>
      <div className="flex flex-col space-y-4">
        <div className="flex items-center">
          <Button variant="ghost" asChild className="mr-4">
            <Link href="/admin/messaging/conversations">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <h1 className="text-xl font-semibold">Conversation</h1>
        </div>

        <ResizablePanelGroup direction="horizontal" className="min-h-[600px] border rounded-lg">
          <ResizablePanel defaultSize={30} minSize={25}>
            <Suspense fallback={<Skeleton className="h-full w-full" />}>
              <ConversationList 
                onSelectConversation={(selectedUserId) => {
                  router.push(`/admin/messaging/conversations/${selectedUserId}`)
                }}
                selectedUserId={userId}
              />
            </Suspense>
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          <ResizablePanel defaultSize={70}>
            <Suspense fallback={<Skeleton className="h-full w-full" />}>
              <ConversationView 
                userId={userId}
                onBack={handleBack}
              />
            </Suspense>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </AuthGuard>
  )
} 