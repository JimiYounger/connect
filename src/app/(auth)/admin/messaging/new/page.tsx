'use client'

import { AuthGuard } from '@/features/auth/components/AuthGuard'
import { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { RecipientSelector, RecipientFilter } from '@/features/messaging/components/RecipientSelector'
import { MessageComposer } from '@/features/messaging/components/MessageComposer'
import { ArrowLeft, Send } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { useMessages } from '@/features/messaging/hooks/useMessages'

export default function NewMessagePage() {
  const router = useRouter()
  const { toast } = useToast()
  
  console.log('[NewMessagePage] Initializing component');
  
  // Log the useMessages hook to see what's available
  const messagesHook = useMessages();
  console.log('[NewMessagePage] useMessages hook:', messagesHook);
  
  const { sendMessage, sendBulkMessage } = messagesHook;
  
  const [activeTab, setActiveTab] = useState('individual')
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([])
  const [messageContent, setMessageContent] = useState('')
  const [isSending, setIsSending] = useState(false)
  
  // For RecipientSelector - initialize with empty arrays for multi-select
  const [filter, setFilter] = useState<RecipientFilter>({
    roleTypes: [],
    teams: [],
    areas: [],
    regions: []
  })
  
  // Log state changes
  useEffect(() => {
    console.log('[NewMessagePage] Active tab changed:', activeTab);
  }, [activeTab]);
  
  useEffect(() => {
    console.log('[NewMessagePage] Selected recipients changed:', selectedRecipients);
  }, [selectedRecipients]);
  
  useEffect(() => {
    console.log('[NewMessagePage] Filter changed:', filter);
  }, [filter]);
  
  // Handle preview request from RecipientSelector
  const handlePreviewRequest = useCallback(() => {
    console.log('[NewMessagePage] Preview requested with filter:', filter);
    // This would typically fetch recipients based on the filter
    // For now, we'll just use a placeholder
    
    // In a real implementation, you would call an API to get recipients based on the filter
    // For now, we'll just set some dummy recipient IDs
    if (activeTab === 'individual') {
      setSelectedRecipients(['user-123']);
    } else {
      setSelectedRecipients(['user-123', 'user-456', 'user-789']);
    }
  }, [filter, activeTab])
  
  // Prefix unused function with underscore
  const _handleSelectionChange = useCallback((selectedIds: string[]) => {
    console.log('[NewMessagePage] Selection changed:', selectedIds);
    setSelectedRecipients(selectedIds);
  }, [])

  const handleSendMessage = async () => {
    console.log('[NewMessagePage] Sending message:', {
      activeTab,
      selectedRecipients,
      messageContent
    });
    
    if (!messageContent.trim()) {
      toast({
        variant: "destructive",
        title: "Message required",
        description: "Please enter a message to send.",
      })
      return
    }

    if (selectedRecipients.length === 0) {
      toast({
        variant: "destructive",
        title: "Recipient required",
        description: "Please select at least one recipient.",
      })
      return
    }

    setIsSending(true)

    try {
      if (activeTab === 'individual') {
        // Send to single recipient
        console.log('[NewMessagePage] Sending individual message to:', selectedRecipients[0]);
        await sendMessage({
          recipientId: selectedRecipients[0],
          content: messageContent
        })
        toast({
          title: "Message sent",
          description: "Your message has been sent successfully.",
        })
        router.push(`/admin/messaging/conversations/${selectedRecipients[0]}`)
      } else {
        // Send to multiple recipients
        console.log('[NewMessagePage] Sending bulk message to:', selectedRecipients);
        await sendBulkMessage({
          recipientIds: selectedRecipients,
          content: messageContent
        })
        toast({
          title: "Messages sent",
          description: `Your message has been sent to ${selectedRecipients.length} recipients.`,
        })
        router.push('/admin/messaging/conversations')
      }
    } catch (error) {
      console.error('[NewMessagePage] Error sending message:', error);
      toast({
        variant: "destructive",
        title: "Failed to send message",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
      })
    } finally {
      setIsSending(false)
    }
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
          <h1 className="text-xl font-semibold">New Message</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create a new message</CardTitle>
            <CardDescription>
              Send messages to individual employees or groups based on filters
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="individual" className="w-full" onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="individual">Individual Message</TabsTrigger>
                <TabsTrigger value="bulk">Bulk Message</TabsTrigger>
              </TabsList>
              
              <TabsContent value="individual">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Select Recipient</h3>
                    {/* Using RecipientSelector with its expected props */}
                    <RecipientSelector 
                      filter={filter}
                      onChange={(newFilter) => {
                        console.log('[NewMessagePage] RecipientSelector onChange:', newFilter);
                        setFilter(newFilter);
                      }}
                      onPreviewRequest={() => {
                        console.log('[NewMessagePage] RecipientSelector onPreviewRequest called');
                        handlePreviewRequest();
                      }}
                    />
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-2">Message</h3>
                    <MessageComposer 
                      value={messageContent}
                      onChange={(value) => {
                        console.log('[NewMessagePage] MessageComposer onChange:', value.length > 50 ? value.substring(0, 50) + '...' : value);
                        setMessageContent(value);
                      }}
                      placeholder="Type your message here..."
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="bulk">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Select Recipients</h3>
                    {/* Using RecipientSelector with its expected props */}
                    <RecipientSelector 
                      filter={filter}
                      onChange={(newFilter) => {
                        console.log('[NewMessagePage] RecipientSelector onChange (bulk):', newFilter);
                        setFilter(newFilter);
                      }}
                      onPreviewRequest={() => {
                        console.log('[NewMessagePage] RecipientSelector onPreviewRequest called (bulk)');
                        handlePreviewRequest();
                      }}
                    />
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-2">Message</h3>
                    <MessageComposer 
                      value={messageContent}
                      onChange={(value) => {
                        console.log('[NewMessagePage] MessageComposer onChange (bulk):', value.length > 50 ? value.substring(0, 50) + '...' : value);
                        setMessageContent(value);
                      }}
                      placeholder="Type your message here..."
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" asChild>
              <Link href="/admin/messaging/conversations">Cancel</Link>
            </Button>
            <Button 
              onClick={handleSendMessage} 
              disabled={isSending || !messageContent.trim() || selectedRecipients.length === 0}
            >
              {isSending ? "Sending..." : "Send Message"}
              {!isSending && <Send className="ml-2 h-4 w-4" />}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </AuthGuard>
  )
} 