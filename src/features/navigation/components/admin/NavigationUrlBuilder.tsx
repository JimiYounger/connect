// my-app/src/features/navigation/components/admin/NavigationUrlBuilder.tsx

'use client'

import { useState } from 'react'
import { useAuth } from '@/features/auth/context/auth-context'
import { useProfile } from '@/features/users/hooks/useProfile'
import { Button } from '@/components/ui/button'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import type { UserProfile } from '@/features/users/types'

interface NavigationUrlBuilderProps {
  onSelect: (placeholder: string) => void
  currentUser?: UserProfile | null
  isExternal?: boolean
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
  { id: 'id', label: 'User ID', placeholder: '{{user.id}}' },
];

// Create a type-safe way to access profile fields
const getProfileValue = (profile: any, fieldId: string): string => {
  if (!profile) return '';
  
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
    case 'id': return profile.id || '';
    default: return '';
  }
};

export function NavigationUrlBuilder({
  onSelect,
  currentUser,
  isExternal = false
}: NavigationUrlBuilderProps) {
  const [activeTab, setActiveTab] = useState('fields')
  
  // Get current user data for preview
  const { session } = useAuth()
  const { profile } = useProfile(session)
  
  // Use passed currentUser or fetched profile
  const userData = currentUser || profile

  // Insert field
  const insertField = (placeholder: string) => {
    // We don't want to URL encode the placeholders themselves
    onSelect(placeholder)
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="fields">Insert User Fields</TabsTrigger>
          <TabsTrigger value="preview">Field Preview</TabsTrigger>
        </TabsList>
        
        <TabsContent value="fields" className="border rounded-md p-4 mt-2">
          <div className="space-y-4">
            {isExternal && (
              <div className="text-sm text-muted-foreground pb-2 border-b">
                Note: Fields will be URL-encoded for external URLs
              </div>
            )}
            <div className="grid grid-cols-3 gap-2">
              {USER_FIELDS.map((field) => (
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
          </div>
        </TabsContent>
        
        <TabsContent value="preview" className="mt-2">
          <Card>
            <CardContent className="pt-4">
              <Label className="text-sm text-muted-foreground mb-2 block">
                Available fields with {userData ? `${userData.first_name}'s` : 'user'} data:
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {USER_FIELDS.map((field) => (
                  <div key={field.id} className="flex justify-between items-center p-2 bg-muted rounded-md">
                    <span className="text-sm font-medium">{field.label}:</span>
                    <code className="text-xs bg-background px-2 py-1 rounded">
                      {userData ? getProfileValue(userData, field.id) : 'N/A'}
                    </code>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}