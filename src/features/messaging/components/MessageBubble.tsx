import React from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { MessageStatus } from '@/features/messaging/types';

interface MessageBubbleProps {
  content: string;
  timestamp: string;
  isOutbound: boolean;
  status?: MessageStatus;
  errorMessage?: string | null;
  senderName?: string;
  senderAvatar?: string;
  showSender?: boolean;
}

export function MessageBubble({
  content,
  timestamp,
  isOutbound,
  status,
  errorMessage,
  senderName,
  senderAvatar,
  showSender = false
}: MessageBubbleProps) {
  // Format timestamp
  const messageDate = new Date(timestamp);
  const formattedTime = format(messageDate, 'h:mm a');
  
  let formattedDate = format(messageDate, 'MMM d, yyyy');
  if (isToday(messageDate)) {
    formattedDate = 'Today';
  } else if (isYesterday(messageDate)) {
    formattedDate = 'Yesterday';
  }
  
  // Get status icon and color
  const getStatusIcon = () => {
    if (!status) return null;
    
    switch (status) {
      case MessageStatus.PENDING:
        return <Clock className="h-3 w-3 text-gray-400" />;
      case MessageStatus.SENT:
        return <CheckCircle className="h-3 w-3 text-blue-500" />;
      case MessageStatus.DELIVERED:
        return <CheckCircle2 className="h-3 w-3 text-green-500" />;
      case MessageStatus.READ:
        return <CheckCircle2 className="h-3 w-3 text-green-600" />;
      case MessageStatus.FAILED:
        return <XCircle className="h-3 w-3 text-red-500" />;
      default:
        return null;
    }
  };
  
  // Get status text
  const getStatusText = () => {
    if (!status) return '';
    
    switch (status) {
      case MessageStatus.PENDING:
        return 'Pending';
      case MessageStatus.SENT:
        return 'Sent';
      case MessageStatus.DELIVERED:
        return 'Delivered';
      case MessageStatus.READ:
        return 'Read';
      case MessageStatus.FAILED:
        return `Failed: ${errorMessage || 'Unknown error'}`;
      default:
        return '';
    }
  };
  
  return (
    <div className={cn(
      "flex w-full max-w-[85%] mb-2",
      isOutbound ? "ml-auto justify-end" : "mr-auto justify-start"
    )}>
      {!isOutbound && showSender && (
        <div className="flex-shrink-0 mr-2 mt-1">
          <Avatar className="h-8 w-8">
            <AvatarImage src={senderAvatar} alt={senderName || 'User'} />
            <AvatarFallback>
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        </div>
      )}
      
      <div className={cn(
        "flex flex-col",
        isOutbound ? "items-end" : "items-start"
      )}>
        {!isOutbound && showSender && senderName && (
          <span className="text-xs text-muted-foreground mb-1 ml-1">
            {senderName}
          </span>
        )}
        
        <div className={cn(
          "rounded-lg py-2 px-3 break-words",
          isOutbound 
            ? "bg-primary text-primary-foreground rounded-br-none" 
            : "bg-muted rounded-bl-none"
        )}>
          <div className="whitespace-pre-wrap">{content}</div>
        </div>
        
        <div className="flex items-center mt-1 text-xs text-muted-foreground">
          <span className="mx-1">{formattedTime}</span>
          <span className="mx-1 text-xs">•</span>
          <span className="mx-1">{formattedDate}</span>
          
          {isOutbound && status && (
            <>
              <span className="mx-1 text-xs">•</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1">
                      {getStatusIcon()}
                      <span className="text-xs">
                        {status === MessageStatus.FAILED ? 'Failed' : ''}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <p>{getStatusText()}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </>
          )}
        </div>
        
        {isOutbound && status === MessageStatus.FAILED && errorMessage && (
          <div className="flex items-center mt-1 text-xs text-red-500">
            <AlertCircle className="h-3 w-3 mr-1" />
            <span className="truncate max-w-[250px]">{errorMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
} 