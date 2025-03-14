import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, isToday, isYesterday, isThisWeek } from 'date-fns';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, 
  User, 
  MessageSquare, 
  AlertCircle, 
  Inbox, 
  CheckCircle2,
  Clock
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { MessageWithDetails } from '@/features/messaging/types';

interface ConversationListProps {
  onSelectConversation: (userId: string) => void;
  selectedUserId?: string;
  className?: string;
}

// Fetch all conversations
const fetchConversations = async (): Promise<Record<string, MessageWithDetails>> => {
  const response = await fetch('/api/messaging/conversations');
  
  if (!response.ok) {
    throw new Error('Failed to fetch conversations');
  }
  
  const data = await response.json();
  return data.conversations || {};
};

export function ConversationList({
  onSelectConversation,
  selectedUserId,
  className
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Fetch conversations
  const { data: conversations, isLoading, isError, error } = useQuery({
    queryKey: ['conversations'],
    queryFn: fetchConversations,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
  
  // Convert conversations object to array and sort by date
  const conversationArray = useMemo(() => {
    if (!conversations) return [];
    
    return Object.entries(conversations)
      .map(([userId, message]) => ({
        userId,
        message,
        recipient: message.is_outbound ? message.recipient : message.sender,
        sender: message.is_outbound ? message.sender : message.recipient,
        timestamp: new Date(message.created_at)
      }))
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [conversations]);
  
  // Filter conversations by search query
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversationArray;
    
    const query = searchQuery.toLowerCase();
    return conversationArray.filter(convo => {
      const recipientName = `${convo.recipient?.first_name || ''} ${convo.recipient?.last_name || ''}`.toLowerCase();
      const content = convo.message.content.toLowerCase();
      
      return recipientName.includes(query) || content.includes(query);
    });
  }, [conversationArray, searchQuery]);
  
  // Format timestamp for display
  const formatTimestamp = (timestamp: Date) => {
    if (isToday(timestamp)) {
      return format(timestamp, 'h:mm a');
    } else if (isYesterday(timestamp)) {
      return 'Yesterday';
    } else if (isThisWeek(timestamp)) {
      return format(timestamp, 'EEEE'); // Day name
    } else {
      return format(timestamp, 'MMM d');
    }
  };
  
  // Get status icon for message
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
      case 'read':
        return <CheckCircle2 className="h-3 w-3 text-green-500" />;
      case 'sent':
        return <CheckCircle2 className="h-3 w-3 text-blue-500" />;
      case 'queued':
      case 'sending':
        return <Clock className="h-3 w-3 text-blue-400" />;
      case 'failed':
        return <AlertCircle className="h-3 w-3 text-red-500" />;
      default:
        return null;
    }
  };
  
  return (
    <Card className={cn("flex flex-col h-full", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Inbox className="h-5 w-5" />
            <span>Conversations</span>
          </CardTitle>
          <Badge variant="outline" className="font-normal">
            {filteredConversations.length}
          </Badge>
        </div>
        <CardDescription>Recent message conversations</CardDescription>
      </CardHeader>
      
      <div className="px-4 pb-2">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <CardContent className="flex-1 p-0 overflow-hidden">
        {isError ? (
          <Alert variant="destructive" className="m-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error instanceof Error ? error.message : 'Failed to load conversations'}
            </AlertDescription>
          </Alert>
        ) : isLoading ? (
          <div className="p-4 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-5/6" />
                </div>
                <Skeleton className="h-3 w-10" />
              </div>
            ))}
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-2" />
            <h3 className="font-medium">No conversations found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {searchQuery ? 'Try a different search term' : 'Start a new conversation to get started'}
            </p>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="py-1">
              {filteredConversations.map((convo) => {
                const isSelected = convo.userId === selectedUserId;
                const hasUnread = !convo.message.is_outbound && convo.message.status !== 'read';
                
                return (
                  <React.Fragment key={convo.userId}>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start px-4 py-3 h-auto",
                        isSelected && "bg-muted",
                        hasUnread && "font-medium"
                      )}
                      onClick={() => onSelectConversation(convo.userId)}
                    >
                      <div className="flex items-start gap-3 w-full">
                        <Avatar className="h-10 w-10 flex-shrink-0">
                          <AvatarImage 
                            src={convo.recipient?.profile_pic_url || undefined} 
                            alt={`${convo.recipient?.first_name || ''} ${convo.recipient?.last_name || ''}`} 
                          />
                          <AvatarFallback>
                            {convo.recipient?.first_name?.[0] || ''}
                            {convo.recipient?.last_name?.[0] || ''}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <span className={cn(
                              "text-sm truncate",
                              hasUnread && "text-primary font-medium"
                            )}>
                              {convo.recipient?.first_name || ''} {convo.recipient?.last_name || 'Unknown'}
                            </span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              {convo.message.is_outbound && getStatusIcon(convo.message.status || '')}
                              {formatTimestamp(convo.timestamp)}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            {convo.message.is_outbound && (
                              <span className="text-xs text-muted-foreground">You: </span>
                            )}
                            <span className={cn(
                              "text-xs truncate text-muted-foreground",
                              hasUnread && "text-foreground font-medium"
                            )}>
                              {convo.message.content}
                            </span>
                          </div>
                          
                          {hasUnread && (
                            <Badge className="mt-1 h-5 px-1.5 bg-primary">New</Badge>
                          )}
                        </div>
                      </div>
                    </Button>
                    <Separator />
                  </React.Fragment>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between pt-4">
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-1"
          onClick={() => {
            // Refresh conversations
            // This will trigger a refetch in React Query
            window.location.reload();
          }}
        >
          <MessageSquare className="h-4 w-4" />
          Refresh
        </Button>
      </CardFooter>
    </Card>
  );
} 