// my-app/src/features/contacts/components/ContactForm.tsx

'use client';

import { Loader2, RefreshCw, X, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useContactForm } from '../hooks/useContactForm';
import { useState } from 'react';

interface ContactFormProps {
  contactId?: string;
  onGoogleSync?: (data: any) => void;
}

export default function ContactForm({ contactId, onGoogleSync }: ContactFormProps) {
  const {
    form,
    departments,
    tags,
    isSyncing,
    isSubmitting,
    isLoading,
    isCreatingTag,
    syncWithGoogle,
    createTag,
    onSubmit
  } = useContactForm(contactId, onGoogleSync);
  
  const [tagSearchValue, setTagSearchValue] = useState('');
  const [tagPopoverOpen, setTagPopoverOpen] = useState(false);
  
  const selectedTagIds = form.watch('selectedTagIds');
  const selectedTags = tags.filter(tag => selectedTagIds.includes(tag.id));
  
  const toggleTag = (tagId: string) => {
    const currentSelectedTagIds = form.getValues('selectedTagIds');
    const newSelectedTagIds = currentSelectedTagIds.includes(tagId)
      ? currentSelectedTagIds.filter(id => id !== tagId)
      : [...currentSelectedTagIds, tagId];
    
    form.setValue('selectedTagIds', newSelectedTagIds);
  };
  
  const handleCreateTag = async () => {
    if (!tagSearchValue.trim()) return;
    
    const tagId = await createTag(tagSearchValue.trim());
    if (tagId) {
      // Add the new tag to selected tags
      const currentSelectedTagIds = form.getValues('selectedTagIds');
      form.setValue('selectedTagIds', [...currentSelectedTagIds, tagId]);
      setTagSearchValue('');
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          {/* First Name */}
          <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name*</FormLabel>
                <FormControl>
                  <Input placeholder="First name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Last Name */}
          <FormField
            control={form.control}
            name="last_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name*</FormLabel>
                <FormControl>
                  <Input placeholder="Last name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Google Sync Button */}
          <div className="flex justify-end">
            <Button
              type="button"
              onClick={syncWithGoogle}
              disabled={
                isSyncing || 
                !form.getValues('first_name') || 
                !form.getValues('last_name')
              }
              variant="outline"
              className="w-full md:w-auto"
            >
              {isSyncing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Sync with Google
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Profile Image URL (Hidden) */}
        <FormField
          control={form.control}
          name="profile_image_url"
          render={({ field }) => (
            <FormItem className="hidden">
              <FormControl>
                <Input type="hidden" {...field} value={field.value || ''} />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Email */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="email@example.com" {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Phone */}
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone</FormLabel>
              <FormControl>
                <Input type="tel" placeholder="+1 (555) 123-4567" {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Job Title */}
        <FormField
          control={form.control}
          name="job_title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Job Title</FormLabel>
              <FormControl>
                <Input placeholder="Job Title" {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Department */}
        <FormField
          control={form.control}
          name="department_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Department</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                value={field.value || ''}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a department" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {departments.map((department) => (
                    <SelectItem key={department.id} value={department.id}>
                      {department.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Tags Field */}
        <FormField
          control={form.control}
          name="selectedTagIds"
          render={() => (
            <FormItem>
              <FormLabel>Tags</FormLabel>
              <div className="space-y-2">
                <Popover open={tagPopoverOpen} onOpenChange={setTagPopoverOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <div className="flex">
                        <Button
                          type="button"
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between relative",
                            !selectedTagIds.length && "text-muted-foreground"
                          )}
                          onClick={(e) => {
                            e.preventDefault();
                            setTagPopoverOpen(true);
                          }}
                        >
                          <span>
                            {selectedTagIds.length > 0
                              ? `${selectedTagIds.length} tag${selectedTagIds.length > 1 ? 's' : ''} selected`
                              : "Select tags"}
                          </span>
                          <Search className="h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </div>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <div className="flex items-center border-b px-3">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <CommandInput 
                          placeholder="Search tags..." 
                          value={tagSearchValue}
                          onValueChange={setTagSearchValue}
                          className="flex-1 border-0 focus:ring-0"
                        />
                        {tagSearchValue && (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-8 px-2 text-xs"
                            onClick={handleCreateTag}
                            disabled={isCreatingTag || !tagSearchValue.trim()}
                          >
                            {isCreatingTag ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Plus className="h-3 w-3" />
                            )}
                          </Button>
                        )}
                      </div>
                      <CommandList>
                        <CommandEmpty className="py-3 text-center text-sm">
                          No tags found
                          
                          {tagSearchValue && (
                            <div className="mt-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="mx-auto flex items-center"
                                onClick={handleCreateTag}
                                disabled={isCreatingTag}
                              >
                                {isCreatingTag ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <Plus className="mr-2 h-4 w-4" />
                                )}
                                Create &quot;{tagSearchValue}&quot; tag
                              </Button>
                            </div>
                          )}
                        </CommandEmpty>
                        
                        <CommandGroup heading="Available Tags" className="max-h-60 overflow-auto">
                          {tags
                            .filter(tag => 
                              tagSearchValue 
                                ? tag.name.toLowerCase().includes(tagSearchValue.toLowerCase())
                                : true
                            )
                            .map((tag) => (
                              <CommandItem
                                key={tag.id}
                                value={tag.name}
                                onSelect={() => {
                                  toggleTag(tag.id);
                                }}
                              >
                                <div
                                  className={cn(
                                    "mr-2 h-4 w-4 rounded-sm border border-primary",
                                    selectedTagIds.includes(tag.id)
                                      ? "bg-primary text-primary-foreground"
                                      : "opacity-50 [&_svg]:invisible"
                                  )}
                                >
                                  {selectedTagIds.includes(tag.id) && (
                                    <span className="flex h-full items-center justify-center text-xs">✓</span>
                                  )}
                                </div>
                                <span>{tag.name}</span>
                              </CommandItem>
                            ))}
                        </CommandGroup>
                        
                        {tagSearchValue && 
                         tags.length > 0 && 
                         tags.filter(tag => tag.name.toLowerCase().includes(tagSearchValue.toLowerCase())).length === 0 && (
                          <div className="p-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="w-full justify-start"
                              onClick={handleCreateTag}
                              disabled={isCreatingTag}
                            >
                              {isCreatingTag ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Plus className="mr-2 h-4 w-4" />
                              )}
                              Create &quot;{tagSearchValue}&quot; tag
                            </Button>
                          </div>
                        )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                
                {/* Display selected tags */}
                {selectedTags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selectedTags.map(tag => (
                      <Badge key={tag.id} variant="secondary" className="px-2 py-1">
                        {tag.name}
                        <button
                          type="button"
                          className="ml-1 rounded-full outline-none focus:ring-2"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleTag(tag.id);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        {/* Can Text Toggle */}
        <FormField
          control={form.control}
          name="can_text"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel>Allow SMS</FormLabel>
                <FormDescription>
                  Whether this contact can receive text messages
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Company ID - Read only after sync */}
          <FormField
            control={form.control}
            name="company_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company ID</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Company ID" 
                    {...field} 
                    value={field.value || ''} 
                    readOnly={!!field.value}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Google User ID - Read only after sync */}
          <FormField
            control={form.control}
            name="google_user_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Google User ID</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Google User ID" 
                    {...field} 
                    value={field.value || ''} 
                    readOnly={!!field.value}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Location */}
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Input placeholder="Location" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Timezone */}
          <FormField
            control={form.control}
            name="timezone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Timezone</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  value={field.value || ''}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a timezone" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="America/Adak">Hawaii-Aleutian Time (HST)</SelectItem>
                    <SelectItem value="America/Anchorage">Alaska Time (AKT)</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                    <SelectItem value="America/Phoenix">Arizona Time (No DST)</SelectItem>
                    <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                    <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                    <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Submit Button */}
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {contactId ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            contactId ? 'Update Contact' : 'Create Contact'
          )}
        </Button>
      </form>
    </Form>
  );
} 