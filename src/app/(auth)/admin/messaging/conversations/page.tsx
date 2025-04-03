'use client'

import { AuthGuard } from '@/features/auth/components/AuthGuard'
import { ConversationList } from '@/features/messaging/components/ConversationList'
import { useMessages } from '@/features/messaging/hooks/useMessages'
import { Button } from '@/components/ui/button'
import { PlusCircle, Inbox } from 'lucide-react'
import Link from 'next/link'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { Suspense, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { useRouter } from 'next/navigation'

export default function ConversationsPage() {
  const router = useRouter()
  useMessages()
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(undefined)

  const handleSelectConversation = (userId: string) => {
    setSelectedUserId(userId)
    router.push(`/admin/messaging/conversations/${userId}`)
  }

  return (
    <AuthGuard>
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-semibold">Conversations</h1>
          <Button asChild>
            <Link href="/admin/messaging/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Message
            </Link>
          </Button>
        </div>

        <ResizablePanelGroup direction="horizontal" className="min-h-[600px] border rounded-lg">
          <ResizablePanel defaultSize={30} minSize={25}>
            <Suspense fallback={<Skeleton className="h-full w-full" />}>
              <ConversationList 
                onSelectConversation={handleSelectConversation}
                selectedUserId={selectedUserId}
              />
            </Suspense>
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          <ResizablePanel defaultSize={70}>
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Inbox className="h-12 w-12 mb-4" />
              <h3 className="text-lg font-medium">Select a conversation</h3>
              <p className="text-sm">Choose a conversation from the list to view messages</p>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </AuthGuard>
  )
} 