import React, { useState, useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { AlertCircle, Send } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { SegmentCounter } from '@/features/messaging/components/SegmentCounter';
import { VariableSelector } from '@/features/messaging/components/VariableSelector';
import { calculateMessageSegments } from '@/features/messaging/services/twilio-service';
import { MessageSegmentInfo } from '@/features/messaging/types';

interface MessageComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSend?: () => void;
  disabled?: boolean;
  error?: string;
  maxLength?: number;
  placeholder?: string;
  showVariableSelector?: boolean;
  showSegmentCounter?: boolean;
  showSendButton?: boolean;
  templateVariables?: Record<string, string>;
  onTemplateVariablesChange?: (variables: Record<string, string>) => void;
}

export function MessageComposer({
  value,
  onChange,
  onSend,
  disabled = false,
  error,
  maxLength = 1600,
  placeholder = 'Type your message here...',
  showVariableSelector = true,
  showSegmentCounter = true,
  showSendButton = true,
  templateVariables = {},
  onTemplateVariablesChange
}: MessageComposerProps) {
  const [segmentInfo, setSegmentInfo] = useState<MessageSegmentInfo>({
    content: value,
    segmentCount: 1,
    characterCount: 0,
    remainingCharacters: 160,
    isOverLimit: false
  });
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Update segment info when message content changes
  useEffect(() => {
    try {
      const info = calculateMessageSegments(value);
      setSegmentInfo(info);
    } catch (error) {
      console.error('Error calculating message segments:', error);
    }
  }, [value]);
  
  // Handle text change
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    
    // Check if over max length
    if (maxLength && newValue.length > maxLength) {
      return;
    }
    
    onChange(newValue);
  };
  
  // Insert variable at cursor position
  const insertVariable = (variable: string) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    const newValue = value.substring(0, start) + variable + value.substring(end);
    onChange(newValue);
    
    // Set cursor position after the inserted variable
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + variable.length, start + variable.length);
    }, 0);
  };
  
  // Handle send button click
  const handleSend = () => {
    if (onSend && !disabled && value.trim() && !segmentInfo.isOverLimit) {
      onSend();
    }
  };
  
  // Handle keyboard shortcut (Ctrl+Enter or Cmd+Enter to send)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="message">Message</Label>
        <div className="relative">
          <Textarea
            ref={textareaRef}
            id="message"
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className={`min-h-[120px] resize-y ${segmentInfo.isOverLimit ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
            aria-invalid={segmentInfo.isOverLimit || !!error}
          />
          
          {showSegmentCounter && (
            <div className="absolute bottom-2 right-2">
              <SegmentCounter
                segmentCount={segmentInfo.segmentCount}
                characterCount={segmentInfo.characterCount}
                remainingCharacters={segmentInfo.remainingCharacters}
                isOverLimit={segmentInfo.isOverLimit}
              />
            </div>
          )}
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
        {showVariableSelector && (
          <div className="w-full sm:w-auto">
            <VariableSelector 
              onSelectVariable={insertVariable}
              templateVariables={templateVariables}
              onTemplateVariablesChange={onTemplateVariablesChange}
            />
          </div>
        )}
        
        <div className="flex gap-2 ml-auto">
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={() => onChange('')}
            disabled={disabled || !value.trim()}
          >
            Clear
          </Button>
          
          {showSendButton && (
            <Button
              type="button"
              size="sm"
              onClick={handleSend}
              disabled={disabled || !value.trim() || segmentInfo.isOverLimit}
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              Send
            </Button>
          )}
        </div>
      </div>
      
      {segmentInfo.isOverLimit && (
        <Alert variant="destructive" className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Message too long</AlertTitle>
          <AlertDescription>
            Your message exceeds the maximum length of {maxLength} characters.
            Please shorten your message to ensure it can be sent properly.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
} 