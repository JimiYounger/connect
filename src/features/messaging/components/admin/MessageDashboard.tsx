import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  ResizableHandle, 
  ResizablePanel, 
  ResizablePanelGroup 
} from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  Users, 
  Send, 
  Settings, 
  RefreshCw,
  Inbox,
  PlusCircle
} from 'lucide-react';
import { ConversationList } from '../../components/ConversationList';
import { ConversationView } from '../../components/ConversationView';
import { RecipientSelector, RecipientFilter } from '../../components/RecipientSelector';
import { MessageComposer } from '../../components/MessageComposer';
import { SegmentCounter } from '../../components/SegmentCounter';
import { calculateMessageSegments } from '../../services/twilio-service';
import { Recipient } from '../../types';

// Fetch unread message count
const fetchUnreadCount = async (): Promise<number> => {
  const response = await fetch('/api/messaging/unread-count');
  
  if (!response.ok) {
    throw new Error('Failed to fetch unread count');
  }
  
  const data = await response.json();
  return data.count || 0;
};

// Fetch recipients based on filter
const fetchRecipients = async (filter: RecipientFilter): Promise<Recipient[]> => {
  const queryParams = new URLSearchParams();
  
  if (filter.roleType) {
    queryParams.append('roleType', filter.roleType);
  }
  
  if (filter.team) {
    queryParams.append('team', filter.team);
  }
  
  if (filter.area) {
    queryParams.append('area', filter.area);
  }
  
  if (filter.region) {
    queryParams.append('region', filter.region);
  }
  
  const response = await fetch(`/api/messaging/recipients?${queryParams.toString()}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch recipients');
  }
  
  const data = await response.json();
  return data.recipients || [];
};

export function MessageDashboard() {
  const [activeTab, setActiveTab] = useState('inbox');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [bulkMessage, setBulkMessage] = useState('');
  const [selectedRecipients, setSelectedRecipients] = useState<Recipient[]>([]);
  const [recipientFilter, setRecipientFilter] = useState<RecipientFilter>({});
  const [showRecipientSelector, setShowRecipientSelector] = useState(false);
  const [sendingBulkMessage, setSendingBulkMessage] = useState(false);
  const [bulkMessageError, setBulkMessageError] = useState<string | undefined>(undefined);
  const [bulkMessageSuccess, setBulkMessageSuccess] = useState<string | null>(null);
  
  // Calculate message segments for bulk message
  const segmentInfo = calculateMessageSegments(bulkMessage);
  
  // Fetch unread message count
  const { 
    data: unreadCount = 0, 
    refetch: refetchUnreadCount
  } = useQuery({
    queryKey: ['unreadCount'],
    queryFn: fetchUnreadCount,
    refetchInterval: 60000, // Refetch every minute
  });
  
  // Fetch recipients based on filter
  const {
    data: recipients = [],
    isLoading: isLoadingRecipients,
    refetch: refetchRecipients
  } = useQuery({
    queryKey: ['recipients', recipientFilter],
    queryFn: () => fetchRecipients(recipientFilter),
    enabled: false, // Don't fetch automatically, only when preview is requested
  });
  
  // Handle preview request
  const handlePreviewRequest = () => {
    refetchRecipients();
    setSelectedRecipients(recipients);
  };
  
  // Update selected recipients when recipients data changes
  useEffect(() => {
    if (recipients.length > 0) {
      setSelectedRecipients(recipients);
    }
  }, [recipients]);
  
  // Handle sending bulk message
  const handleSendBulkMessage = async () => {
    if (!bulkMessage.trim() || selectedRecipients.length === 0) {
      setBulkMessageError('Please enter a message and select at least one recipient');
      return;
    }
    
    if (segmentInfo.isOverLimit) {
      setBulkMessageError('Message exceeds maximum length');
      return;
    }
    
    try {
      setSendingBulkMessage(true);
      setBulkMessageError(undefined);
      setBulkMessageSuccess(null);
      
      const recipientIds = selectedRecipients.map(recipient => recipient.id);
      
      const response = await fetch('/api/messaging/bulk-send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: bulkMessage.trim(),
          recipientIds,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send bulk message');
      }
      
      const data = await response.json();
      
      // Reset form
      setBulkMessage('');
      setSelectedRecipients([]);
      setRecipientFilter({});
      setBulkMessageSuccess(`Message sent to ${data.successCount || 0} recipients`);
      
      // Refetch unread count
      refetchUnreadCount();
    } catch (error) {
      setBulkMessageError(error instanceof Error ? error.message : 'Failed to send bulk message');
    } finally {
      setSendingBulkMessage(false);
    }
  };
  
  // Handle back button in conversation view
  const handleBackToInbox = () => {
    setSelectedUserId(null);
  };
  
  // Handle new message button
  const handleNewMessage = () => {
    setActiveTab('bulk');
    setShowRecipientSelector(true);
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MessageSquare className="h-6 w-6" />
          <span>Messaging Dashboard</span>
        </h1>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-1"
            onClick={() => refetchUnreadCount()}
          >
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          
          <Button 
            variant="default" 
            size="sm" 
            className="gap-1"
            onClick={handleNewMessage}
          >
            <PlusCircle className="h-4 w-4" />
            <span className="hidden sm:inline">New Message</span>
          </Button>
        </div>
      </div>
      
      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col"
      >
        <div className="border-b px-4">
          <TabsList className="h-12">
            <TabsTrigger value="inbox" className="flex items-center gap-2">
              <Inbox className="h-4 w-4" />
              <span>Inbox</span>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 px-1.5">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="bulk" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              <span>Bulk Message</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="inbox" className="flex-1 p-0 m-0">
          {selectedUserId ? (
            <ConversationView 
              userId={selectedUserId} 
              onBack={handleBackToInbox}
              className="h-full border-0 shadow-none"
            />
          ) : (
            <ResizablePanelGroup direction="horizontal" className="h-full">
              <ResizablePanel defaultSize={30} minSize={25} maxSize={40}>
                <ConversationList 
                  onSelectConversation={(userId) => setSelectedUserId(userId)}
                  selectedUserId={selectedUserId || undefined}
                  className="h-full border-0 shadow-none rounded-none"
                />
              </ResizablePanel>
              
              <ResizableHandle withHandle />
              
              <ResizablePanel defaultSize={70}>
                <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                  <div className="p-6 rounded-full bg-muted mb-6">
                    <MessageSquare className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h2 className="text-xl font-semibold mb-2">Select a conversation</h2>
                  <p className="text-muted-foreground max-w-md mb-6">
                    Choose a conversation from the list to view messages and respond to users.
                  </p>
                  <Button 
                    variant="outline" 
                    className="gap-2"
                    onClick={handleNewMessage}
                  >
                    <PlusCircle className="h-4 w-4" />
                    Start a new conversation
                  </Button>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          )}
        </TabsContent>
        
        <TabsContent value="bulk" className="flex-1 p-4 m-0 overflow-auto">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Bulk Message
                </h2>
                <p className="text-muted-foreground">
                  Send a message to multiple recipients at once. Select recipients and compose your message below.
                </p>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-base font-medium mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Recipients
                </h3>
                
                <div className="mb-4">
                  {selectedRecipients.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {selectedRecipients.map(recipient => (
                          <Badge key={recipient.id} variant="secondary" className="gap-1 py-1.5">
                            {recipient.firstName} {recipient.lastName}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4 ml-1 p-0"
                              onClick={() => {
                                setSelectedRecipients(selectedRecipients.filter(r => r.id !== recipient.id));
                              }}
                            >
                              <span className="sr-only">Remove</span>
                              ×
                            </Button>
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {selectedRecipients.length} recipient{selectedRecipients.length !== 1 ? 's' : ''} selected
                        </span>
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0"
                          onClick={() => setShowRecipientSelector(true)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0"
                          onClick={() => setSelectedRecipients([])}
                        >
                          Clear all
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => setShowRecipientSelector(true)}
                      className="gap-2"
                    >
                      <Users className="h-4 w-4" />
                      Select Recipients
                    </Button>
                  )}
                </div>
                
                {showRecipientSelector && (
                  <div className="border rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium">Select Recipients</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowRecipientSelector(false)}
                      >
                        Done
                      </Button>
                    </div>
                    <RecipientSelector
                      filter={recipientFilter}
                      onChange={setRecipientFilter}
                      onPreviewRequest={handlePreviewRequest}
                      disabled={isLoadingRecipients}
                    />
                  </div>
                )}
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-base font-medium flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Message
                  </h3>
                  <SegmentCounter
                    segmentCount={segmentInfo.segmentCount}
                    characterCount={segmentInfo.characterCount}
                    remainingCharacters={segmentInfo.remainingCharacters}
                    isOverLimit={segmentInfo.isOverLimit}
                  />
                </div>
                
                <MessageComposer
                  value={bulkMessage}
                  onChange={setBulkMessage}
                  onSend={handleSendBulkMessage}
                  disabled={sendingBulkMessage || selectedRecipients.length === 0}
                  error={bulkMessageError}
                  placeholder="Type your message here..."
                  showVariableSelector={true}
                  showSegmentCounter={false}
                />
                
                {bulkMessageSuccess && (
                  <Alert className="mt-4">
                    <AlertTitle>Success</AlertTitle>
                    <AlertDescription>{bulkMessageSuccess}</AlertDescription>
                  </Alert>
                )}
                
                <div className="mt-6 flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setBulkMessage('');
                      setSelectedRecipients([]);
                      setRecipientFilter({});
                      setBulkMessageError(undefined);
                      setBulkMessageSuccess(null);
                    }}
                    disabled={sendingBulkMessage}
                  >
                    Clear
                  </Button>
                  <Button
                    onClick={handleSendBulkMessage}
                    disabled={
                      sendingBulkMessage || 
                      !bulkMessage.trim() || 
                      selectedRecipients.length === 0 ||
                      segmentInfo.isOverLimit
                    }
                    className="gap-2"
                  >
                    <Send className="h-4 w-4" />
                    {sendingBulkMessage ? 'Sending...' : 'Send Message'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="settings" className="flex-1 p-4 m-0 overflow-auto">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Messaging Settings
                </h2>
                <p className="text-muted-foreground">
                  Configure messaging preferences and notification settings.
                </p>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-center h-40">
                <p className="text-muted-foreground">
                  Settings panel coming soon...
                </p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 