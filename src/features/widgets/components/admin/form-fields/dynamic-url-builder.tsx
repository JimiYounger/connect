// my-app/src/features/widgets/components/admin/form-fields/dynamic-url-builder.tsx

'use client'

import { useState, useRef } from 'react';
import { useAuth } from '@/features/auth/context/auth-context';
import { useProfile } from '@/features/users/hooks/useProfile';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

interface DynamicUrlBuilderProps {
  value: string;
  onChange: (value: string) => void;
}

// Define the user profile fields that can be inserted
const USER_FIELDS = [
  { id: 'email', label: 'Email', placeholder: '{{user.email}}' },
  { id: 'airtable_record_id', label: 'Airtable ID', placeholder: '{{user.airtable_record_id}}' },
  { id: 'salesforce_id', label: 'Salesforce ID', placeholder: '{{user.salesforce_id}}' },
  { id: 'phone', label: 'Phone', placeholder: '{{user.phone}}' },
  { id: 'first_name', label: 'First Name', placeholder: '{{user.first_name}}' },
  { id: 'last_name', label: 'Last Name', placeholder: '{{user.last_name}}' },
  { id: 'team', label: 'Team', placeholder: '{{user.team}}' },
  { id: 'area', label: 'Area', placeholder: '{{user.area}}' },
  { id: 'region', label: 'Region', placeholder: '{{user.region}}' },
  { id: 'role', label: 'Role', placeholder: '{{user.role}}' },
  { id: 'role_type', label: 'Role Type', placeholder: '{{user.role_type}}' },
  { id: 'user_key', label: 'User Key', placeholder: '{{user.user_key}}' },
];

// Create a type-safe way to access profile fields
const getProfileValue = (profile: any, fieldId: string): string => {
  if (!profile) return '';
  
  // Type-safe field access using a switch statement
  switch (fieldId) {
    case 'email': return profile.email || '';
    case 'airtable_record_id': return profile.airtable_record_id || '';
    case 'salesforce_id': return profile.salesforce_id || '';
    case 'phone': return profile.phone || '';
    case 'first_name': return profile.first_name || '';
    case 'last_name': return profile.last_name || '';
    case 'team': return profile.team || '';
    case 'area': return profile.area || '';
    case 'region': return profile.region || '';
    case 'role': return profile.role || '';
    case 'role_type': return profile.role_type || '';
    case 'user_key': return profile.user_key || '';
    default: return '';
  }
};

export function DynamicUrlBuilder({ value, onChange }: DynamicUrlBuilderProps) {
  const [activeTab, setActiveTab] = useState('fields');
  const [cursorPosition, setCursorPosition] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Get current user data for preview
  const { session } = useAuth();
  const { profile } = useProfile(session);
  
  // Track cursor position
  const handleInputFocus = () => {
    if (inputRef.current) {
      setCursorPosition(inputRef.current.selectionStart);
    }
  };
  
  const handleInputClick = () => {
    if (inputRef.current) {
      setCursorPosition(inputRef.current.selectionStart);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    if (inputRef.current) {
      setCursorPosition(inputRef.current.selectionStart);
    }
  };
  
  // Insert field at cursor position
  const insertField = (placeholder: string) => {
    if (cursorPosition !== null) {
      const newValue = 
        value.substring(0, cursorPosition) + 
        placeholder + 
        value.substring(cursorPosition);
      
      onChange(newValue);
      
      // Set focus back to input and update cursor position
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          const newPosition = cursorPosition + placeholder.length;
          inputRef.current.setSelectionRange(newPosition, newPosition);
          setCursorPosition(newPosition);
        }
      }, 0);
    } else {
      // If no cursor position, append to end
      onChange(value + placeholder);
    }
  };
  
  // Generate preview URL with actual user data
  const generatePreviewUrl = () => {
    if (!profile) return value;
    
    let previewUrl = value;
    
    USER_FIELDS.forEach(field => {
      const placeholder = field.placeholder;
      const fieldValue = getProfileValue(profile, field.id); // Use the type-safe function
      
      // Replace all occurrences of the placeholder with the actual value
      previewUrl = previewUrl.replace(
        new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), 
        encodeURIComponent(fieldValue)
      );
    });
    
    return previewUrl;
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Input
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onClick={handleInputClick}
          placeholder="https://example.com/?param="
          className="flex-1"
        />
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="fields" type="button">User Fields</TabsTrigger>
          <TabsTrigger value="preview" type="button">URL Preview</TabsTrigger>
        </TabsList>
        
        <TabsContent value="fields" className="border rounded-md p-4">
          <div className="grid grid-cols-3 gap-2">
            {USER_FIELDS.map(field => (
              <Button
                key={field.id}
                variant="outline"
                size="sm"
                type="button"
                onClick={() => insertField(field.placeholder)}
                className="justify-start"
              >
                {field.label}
              </Button>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="preview">
          <Card>
            <CardContent className="pt-4">
              <Label className="text-sm text-muted-foreground mb-2 block">
                Preview with your data:
              </Label>
              <div className="p-3 bg-muted rounded-md overflow-x-auto">
                <code className="text-sm whitespace-pre-wrap break-all">
                  {generatePreviewUrl()}
                </code>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 