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
import { useToast } from '@/hooks/use-toast';

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
const fetchRecipients = async (filter: RecipientFilter): Promise<{ recipients: Recipient[], totalCount: number }> => {
  console.log('[MessageDashboard] Fetching recipients with filter:', JSON.stringify(filter, null, 2));
  
  // Check if any filters are applied
  const hasFilters = filter.roleTypes.length > 0 || 
                     filter.teams.length > 0 || 
                     filter.areas.length > 0 || 
                     filter.regions.length > 0;
  
  // If no filters are applied, return an empty array to prevent fetching all users
  if (!hasFilters) {
    console.log('[MessageDashboard] No filters applied, returning empty array');
    return { recipients: [], totalCount: 0 };
  }
  
  try {
    // Create a simple filter object with just the arrays
    const apiFilter = {
      roleTypes: filter.roleTypes || [],
      teams: filter.teams || [],
      areas: filter.areas || [],
      regions: filter.regions || []
    };

    console.log('[MessageDashboard] API filter:', JSON.stringify(apiFilter, null, 2));

    // Use POST request with JSON body
    const response = await fetch('/api/messaging/recipients/preview', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filter: apiFilter,
        limit: 100 // Use a reasonable limit
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (_e) {
        errorData = { error: errorText || 'Failed to fetch recipients' };
      }
      console.error('[MessageDashboard] Error fetching recipients:', errorData);
      throw new Error(errorData.error || 'Failed to fetch recipients');
    }
    
    const data = await response.json();
    console.log(`[MessageDashboard] Received ${data.recipients?.length || 0} recipients out of ${data.totalCount || 0} total`);
    return { 
      recipients: data.recipients || [], 
      totalCount: data.totalCount || 0 
    };
  } catch (error) {
    console.error('[MessageDashboard] Error in fetchRecipients:', error);
    throw error;
  }
};

export function MessageDashboard() {
  const [activeTab, setActiveTab] = useState('inbox');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [bulkMessage, setBulkMessage] = useState('');
  const [selectedRecipients, setSelectedRecipients] = useState<Recipient[]>([]);
  const [recipientFilter, setRecipientFilter] = useState<RecipientFilter>({
    roleTypes: ['Admin'], // Default to Admin role type for testing
    teams: [],
    areas: [],
    regions: []
  });
  const [showRecipientSelector, setShowRecipientSelector] = useState(true); // Show selector by default for testing
  const [sendingBulkMessage, setSendingBulkMessage] = useState(false);
  const [bulkMessageError, setBulkMessageError] = useState<string | undefined>(undefined);
  const [bulkMessageSuccess, setBulkMessageSuccess] = useState<string | null>(null);
  const { toast } = useToast();
  
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
    data: recipientsData = { recipients: [], totalCount: 0 },
    isLoading: isLoadingRecipients,
    refetch: refetchRecipients,
    isError: isRecipientsError,
    error: recipientsError
  } = useQuery({
    queryKey: ['recipients', recipientFilter],
    queryFn: () => fetchRecipients(recipientFilter),
    enabled: false, // Don't fetch automatically, only when preview is requested
  });
  
  // Extract recipients and totalCount from the data
  const recipients = recipientsData.recipients;
  const totalRecipientCount = recipientsData.totalCount;
  
  // Automatically trigger preview request when component mounts
  useEffect(() => {
    console.log('[MessageDashboard] Component mounted');
    // We're disabling the automatic fetch on mount to prevent potential issues
    // If you want to enable it later, uncomment the code below
    /*
    // Set a timeout to allow the component to fully render
    const timer = setTimeout(() => {
      refetchRecipients();
    }, 1000);
    
    return () => clearTimeout(timer);
    */
  }, []); // Empty dependency array means this only runs once on mount
  
  // Update selected recipients when recipients data changes
  useEffect(() => {
    console.log('[MessageDashboard] Recipients data changed:', recipients.length);
    
    if (isRecipientsError) {
      console.error('[MessageDashboard] Error fetching recipients:', recipientsError);
      toast({
        variant: "destructive",
        title: "Error fetching recipients",
        description: recipientsError instanceof Error ? recipientsError.message : "An unexpected error occurred",
      });
      return;
    }
    
    // Only update if we have recipients
    if (recipients.length > 0) {
      // Check if the recipients are actually different before updating state
      const currentIds = selectedRecipients.map(r => r.id).sort().join(',');
      const newIds = recipients.map(r => r.id).sort().join(',');
      
      // Only update if the IDs are different
      if (currentIds !== newIds) {
        setSelectedRecipients(recipients);
        console.log('[MessageDashboard] Selected recipients updated:', recipients.length);
        
        // Show toast with total count information
        const countMessage = totalRecipientCount > recipients.length 
          ? `Found ${recipients.length} recipients (showing ${recipients.length} of ${totalRecipientCount} total)`
          : `Found ${recipients.length} recipients matching your filters`;
          
        toast({
          title: "Recipients found",
          description: countMessage,
        });
      }
    } else if (recipients.length === 0 && selectedRecipients.length > 0) {
      // Only clear selected recipients if we had some before
      setSelectedRecipients([]);
      console.log('[MessageDashboard] No recipients found for the current filter');
      toast({
        variant: "default",
        title: "No recipients found",
        description: "No recipients match your current filters. Try adjusting your criteria.",
      });
    }
  }, [recipients, isRecipientsError, recipientsError, toast, selectedRecipients, totalRecipientCount]);
  
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
      console.log('Selected recipient IDs:', recipientIds);
      console.log('Selected recipients details:', selectedRecipients);
      
      // Use the new bulk-send endpoint with correct payload structure
      const requestBody = {
        content: bulkMessage.trim(),
        recipientIds: recipientIds,
        templateVariables: {}
      };
      
      console.log('Sending request to /api/messaging/bulk-send:', JSON.stringify(requestBody, null, 2));
      
      const response = await fetch('/api/messaging/bulk-send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      // Log raw response
      const responseText = await response.text();
      console.log('Response status:', response.status);
      console.log('Response text:', responseText);
      
      // Parse the response back to JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (_e) {
        throw new Error(`Invalid JSON response: ${responseText}`);
      }
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send bulk message');
      }
      
      // Reset form
      setBulkMessage('');
      setSelectedRecipients([]);
      setRecipientFilter({
        roleTypes: ['Admin'],
        teams: [],
        areas: [],
        regions: []
      });
      
      // Show success message even with partial success
      if (data.bulkMessageId) {
        // We have a valid bulkMessageId, so some messages were processed
        if (data.error && data.successCount) {
          // Show partial success message
          setBulkMessageSuccess(`Message partially sent: ${data.successCount} recipient(s) processed. ${data.error}`);
        } else {
          // Show regular success message
          setBulkMessageSuccess(`Message sent to ${data.successCount || 0} recipient(s)`);
        }
      } else {
        // Something went wrong but response was OK
        throw new Error(data.error || 'Failed to process bulk message');
      }
      
      // Refetch unread count
      refetchUnreadCount();
    } catch (error) {
      console.error('Error sending bulk message:', error);
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
                      onPreviewRequest={() => refetchRecipients()}
                      disabled={isLoadingRecipients}
                    />
                    
                    {/* Show loading state when fetching recipients */}
                    {isLoadingRecipients && (
                      <div className="mt-4 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mr-2" />
                        <span>Fetching recipients...</span>
                      </div>
                    )}
                    
                    {/* Show recipient count when available */}
                    {!isLoadingRecipients && recipients.length > 0 && (
                      <Alert className="mt-4">
                        <AlertTitle>Recipients Found</AlertTitle>
                        <AlertDescription>
                          Found {recipients.length} recipients matching your filters
                          {totalRecipientCount > recipients.length && ` (showing ${recipients.length} of ${totalRecipientCount} total)`}.
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {/* Show no recipients message when none found */}
                    {!isLoadingRecipients && recipients.length === 0 && recipientFilter.roleTypes.length + recipientFilter.teams.length + recipientFilter.areas.length + recipientFilter.regions.length > 0 && (
                      <Alert className="mt-4" variant="destructive">
                        <AlertTitle>No Recipients Found</AlertTitle>
                        <AlertDescription>
                          No recipients match your current filters. Try adjusting your criteria.
                        </AlertDescription>
                      </Alert>
                    )}
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
                      setRecipientFilter({
                        roleTypes: ['Admin'],
                        teams: [],
                        areas: [],
                        regions: []
                      });
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