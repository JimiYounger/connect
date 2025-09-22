'use client';

import { useState, useMemo } from 'react';
import { MobileInput } from '@/components/ui/mobile-input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { X, Search } from 'lucide-react';
import Image from 'next/image';
import type { UserProfile } from '../../types';

interface PeopleMultiSelectProps {
  users: UserProfile[];
  targetArea: string | null;
  selectedUserIds: string[];
  onChange: (userIds: string[]) => void;
  placeholder?: string;
  includeTextArea?: boolean;
  textValue?: string;
  onTextChange?: (text: string) => void;
  textPlaceholder?: string;
}

export function PeopleMultiSelect({
  users,
  targetArea,
  selectedUserIds,
  onChange,
  placeholder = "Search for team members...",
  includeTextArea = false,
  textValue = "",
  onTextChange,
  textPlaceholder = "Add additional details or plans..."
}: PeopleMultiSelectProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter users based on search and target area
  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) {
      // No search term: show users from target area only
      if (targetArea) {
        return users.filter(user => user.area === targetArea);
      }
      return users;
    }

    // With search term: search all users
    const term = searchTerm.toLowerCase();
    return users.filter(user => {
      const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
      const email = user.email.toLowerCase();
      const team = user.team?.toLowerCase() || '';
      const area = user.area?.toLowerCase() || '';

      return fullName.includes(term) ||
             email.includes(term) ||
             team.includes(term) ||
             area.includes(term);
    });
  }, [users, searchTerm, targetArea]);

  // Get selected users for display
  const selectedUsers = users.filter(user => selectedUserIds.includes(user.id));

  const handleUserSelect = (user: UserProfile) => {
    if (selectedUserIds.includes(user.id)) {
      // Remove user
      onChange(selectedUserIds.filter(id => id !== user.id));
    } else {
      // Add user
      onChange([...selectedUserIds, user.id]);
    }
    setSearchTerm(''); // Clear search after selection
  };

  const handleRemoveUser = (userId: string) => {
    onChange(selectedUserIds.filter(id => id !== userId));
  };

  return (
    <div className="space-y-4">
      {/* Selected Users */}
      {selectedUsers.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Selected:</label>
          <div className="flex flex-wrap gap-2">
            {selectedUsers.map(user => (
              <Badge key={user.id} variant="secondary" className="pr-1 pl-1 flex items-center gap-2">
                {user.user_key && (
                  <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
                    <Image
                      src={`https://plpower.link/${user.user_key}.pic`}
                      alt={`${user.first_name} ${user.last_name}`}
                      width={24}
                      height={24}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <span className="truncate">{user.first_name} {user.last_name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="min-h-[32px] min-w-[32px] p-0 ml-1 hover:bg-gray-200 touch-manipulation flex-shrink-0"
                  onClick={() => handleRemoveUser(user.id)}
                  mobileOptimized
                >
                  <X className="h-4 w-4" />
                </Button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10 pointer-events-none" />
        <MobileInput
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
          inputMode="text"
          autoComplete="off"
          mobileOptimized
        />
      </div>


      {/* User List */}
      <div className="border rounded-md max-h-60 overflow-y-auto touch-manipulation [-webkit-overflow-scrolling:touch]">
        {filteredUsers.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {searchTerm ? 'No users found matching your search' : 'No users available'}
          </div>
        ) : (
          <div className="divide-y">
            {filteredUsers.map(user => (
              <button
                key={user.id}
                type="button"
                className={`w-full min-h-[44px] p-4 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation [-webkit-tap-highlight-color:transparent] ${
                  selectedUserIds.includes(user.id) ? 'bg-blue-50 border-l-4' : ''
                }`}
                style={selectedUserIds.includes(user.id) ? {
                  borderLeftColor: '#61B2DC'
                } : undefined}
                onClick={() => handleUserSelect(user)}
              >
                <div className="flex items-center gap-3">
                  {user.user_key && (
                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                      <Image
                        src={`https://plpower.link/${user.user_key}.pic`}
                        alt={`${user.first_name} ${user.last_name}`}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-base truncate">
                      {user.first_name} {user.last_name}
                    </div>
                    <div className="text-sm text-gray-500 mt-1 truncate">
                      {user.area && user.team ? `${user.area} - ${user.team}` : user.area || user.team || 'No team assigned'}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Optional Text Area */}
      {includeTextArea && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Additional details:
          </label>
          <Textarea
            value={textValue}
            onChange={(e) => onTextChange?.(e.target.value)}
            placeholder={textPlaceholder}
            className="min-h-[100px] resize-none text-base touch-manipulation [-webkit-tap-highlight-color:transparent]"
          />
        </div>
      )}
    </div>
  );
}