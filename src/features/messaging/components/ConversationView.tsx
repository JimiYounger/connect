import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Phone, 
  Mail, 
  AlertCircle, 
  ArrowLeft,
  BellOff,
  MoreVertical,
  RefreshCw
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { MessageBubble } from './MessageBubble';
import { MessageComposer } from './MessageComposer';
import { MessageWithDetails, MessageStatus } from '@/features/messaging/types';

interface ConversationViewProps {
  userId: string;
  onBack?: () => void;
  className?: string;
}

// Fetch conversation history with a specific user
const fetchConversationHistory = async (userId: string): Promise<MessageWithDetails[]> => {
  const response = await fetch(`/api/messaging/conversations/${userId}?markAsRead=true`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch conversation history');
  }
  
  const data = await response.json();
  return data.messages || [];
};

// Fetch user profile
const fetchUserProfile = async (userId: string): Promise<any> => {
  const response = await fetch(`/api/users/${userId}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch user profile');
  }
  
  const data = await response.json();
  return data.user || null;
};

// Send a message
const sendMessage = async ({ userId, content }: { userId: string; content: string }): Promise<any> => {
  const response = await fetch('/api/messaging/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      recipientId: userId,
      content,
    }),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to send message');
  }
  
  return response.json();
};

// Check if user has opted out
const checkOptOutStatus = async (userId: string): Promise<boolean> => {
  const response = await fetch(`/api/messaging/opt-out?userId=${userId}`);
  
  if (!response.ok) {
    throw new Error('Failed to check opt-out status');
  }
  
  const data = await response.json();
  return data.optedOut || false;
};

export function ConversationView({
  userId,
  onBack,
  className
}: ConversationViewProps) {
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  
  // Fetch conversation history
  const { 
    data: messages, 
    isLoading: isLoadingMessages, 
    isError: isMessagesError,
    error: messagesError,
    refetch: refetchMessages
  } = useQuery({
    queryKey: ['conversation', userId],
    queryFn: () => fetchConversationHistory(userId),
    refetchInterval: 15000, // Refetch every 15 seconds
  });
  
  // Fetch user profile
  const { 
    data: userProfile, 
    isLoading: isLoadingProfile,
    isError: isProfileError,
    error: profileError
  } = useQuery({
    queryKey: ['userProfile', userId],
    queryFn: () => fetchUserProfile(userId),
  });
  
  // Check opt-out status
  const { 
    data: optedOut,
    isLoading: isLoadingOptOut
  } = useQuery({
    queryKey: ['optOutStatus', userId],
    queryFn: () => checkOptOutStatus(userId),
  });
  
  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: sendMessage,
    onSuccess: () => {
      // Clear message input
      setMessage('');
      // Clear any previous errors
      setError(null);
      // Refetch conversation to show new message
      queryClient.invalidateQueries({ queryKey: ['conversation', userId] });
      // Also invalidate the conversations list
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (error) => {
      setError(error instanceof Error ? error.message : 'Failed to send message');
    },
  });
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current && messages?.length) {
      const scrollArea = scrollAreaRef.current;
      scrollArea.scrollTop = scrollArea.scrollHeight;
    }
  }, [messages]);
  
  // Group messages by date
  const groupedMessages = React.useMemo(() => {
    if (!messages) return [];
    
    const groups: { date: string; messages: MessageWithDetails[] }[] = [];
    let currentDate = '';
    let currentGroup: MessageWithDetails[] = [];
    
    // Sort messages by created_at
    const sortedMessages = [...messages].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    
    sortedMessages.forEach(message => {
      const messageDate = format(new Date(message.created_at), 'yyyy-MM-dd');
      
      if (messageDate !== currentDate) {
        if (currentGroup.length > 0) {
          groups.push({ date: currentDate, messages: currentGroup });
        }
        currentDate = messageDate;
        currentGroup = [message];
      } else {
        currentGroup.push(message);
      }
    });
    
    if (currentGroup.length > 0) {
      groups.push({ date: currentDate, messages: currentGroup });
    }
    
    return groups;
  }, [messages]);
  
  // Handle send message
  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    sendMessageMutation.mutate({
      userId,
      content: message.trim()
    });
  };
  
  // Format date for display
  const formatDateHeader = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, 'EEEE, MMMM d, yyyy');
  };
  
  // Handle opt-out toggle
  const handleOptOutToggle = async () => {
    try {
      const response = await fetch('/api/messaging/opt-out', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          optedOut: !optedOut,
          reason: optedOut ? 'Admin re-enabled messaging' : 'Admin disabled messaging'
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update opt-out status');
      }
      
      // Refetch opt-out status
      queryClient.invalidateQueries({ queryKey: ['optOutStatus', userId] });
    } catch (error) {
      console.error('Error updating opt-out status:', error);
      setError(error instanceof Error ? error.message : 'Failed to update opt-out status');
    }
  };
  
  const isLoading = isLoadingMessages || isLoadingProfile;
  const isError = isMessagesError || isProfileError;
  const errorMessage = messagesError instanceof Error ? messagesError.message : 
                       profileError instanceof Error ? profileError.message : 
                       'An error occurred';
  
  return (
    <Card className={cn("flex flex-col h-full", className)}>
      <CardHeader className="pb-2 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {onBack && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 mr-1" 
                onClick={onBack}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            
            {isLoading ? (
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div>
                  <Skeleton className="h-4 w-32 mb-1" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage 
                    src={userProfile?.profile_pic_url || undefined} 
                    alt={`${userProfile?.first_name || ''} ${userProfile?.last_name || ''}`} 
                  />
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                
                <div>
                  <CardTitle className="text-base">
                    {userProfile?.first_name || ''} {userProfile?.last_name || 'Unknown'}
                  </CardTitle>
                  <CardDescription className="text-xs flex items-center gap-1">
                    {userProfile?.role_type || 'User'}
                    {userProfile?.team && ` • ${userProfile.team}`}
                  </CardDescription>
                </div>
              </div>
            )}
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Options</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              {!isLoading && userProfile?.phone && (
                <DropdownMenuItem className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>{userProfile.phone}</span>
                </DropdownMenuItem>
              )}
              
              {!isLoading && userProfile?.email && (
                <DropdownMenuItem className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>{userProfile.email}</span>
                </DropdownMenuItem>
              )}
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem 
                className="flex items-center gap-2 text-destructive focus:text-destructive"
                onClick={handleOptOutToggle}
                disabled={isLoadingOptOut}
              >
                <BellOff className="h-4 w-4" />
                <span>{optedOut ? 'Enable messaging' : 'Disable messaging'}</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                className="flex items-center gap-2"
                onClick={() => refetchMessages()}
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh conversation</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 p-0 overflow-hidden">
        {isError ? (
          <Alert variant="destructive" className="m-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : isLoading ? (
          <div className="p-4 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div 
                key={i} 
                className={cn(
                  "flex max-w-[80%] mb-4",
                  i % 2 === 0 ? "ml-auto" : "mr-auto"
                )}
              >
                <Skeleton className={cn(
                  "h-16 rounded-lg",
                  i % 2 === 0 ? "w-48" : "w-64"
                )} />
              </div>
            ))}
          </div>
        ) : messages?.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <div className="p-4 rounded-full bg-muted mb-4">
              <User className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium">No messages yet</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
              Send a message to start a conversation with {userProfile?.first_name || 'this user'}
            </p>
          </div>
        ) : (
          <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {groupedMessages.map((group, groupIndex) => (
                <div key={group.date} className="space-y-2">
                  <div className="flex items-center justify-center my-4">
                    <Separator className="flex-grow" />
                    <span className="mx-2 text-xs text-muted-foreground">
                      {formatDateHeader(group.date)}
                    </span>
                    <Separator className="flex-grow" />
                  </div>
                  
                  {group.messages.map((msg, msgIndex) => (
                    <MessageBubble
                      key={msg.id}
                      content={msg.content}
                      timestamp={msg.created_at}
                      isOutbound={msg.is_outbound}
                      status={msg.status as MessageStatus | undefined}
                      errorMessage={msg.error_message}
                      senderName={msg.is_outbound ? undefined : `${msg.sender?.first_name || ''} ${msg.sender?.last_name || ''}`}
                      senderAvatar={msg.is_outbound ? undefined : msg.sender?.profile_pic_url || undefined}
                      showSender={!msg.is_outbound && groupIndex === 0 && msgIndex === 0}
                    />
                  ))}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
      
      <CardFooter className="p-4 border-t">
        {optedOut ? (
          <Alert className="w-full">
            <BellOff className="h-4 w-4" />
            <AlertTitle>Messaging disabled</AlertTitle>
            <AlertDescription>
              This user has opted out of receiving messages.
              <Button 
                variant="link" 
                className="p-0 h-auto text-xs"
                onClick={handleOptOutToggle}
              >
                Enable messaging
              </Button>
            </AlertDescription>
          </Alert>
        ) : (
          <div className="w-full">
            <MessageComposer
              value={message}
              onChange={setMessage}
              onSend={handleSendMessage}
              disabled={sendMessageMutation.isPending}
              error={error || undefined}
              placeholder={`Message ${userProfile?.first_name || 'user'}...`}
              showVariableSelector={true}
              showSegmentCounter={true}
            />
          </div>
        )}
      </CardFooter>
    </Card>
  );
} 