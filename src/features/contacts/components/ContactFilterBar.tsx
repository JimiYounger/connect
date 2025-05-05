'use client';

import { useState } from 'react';
import { Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Department } from '../types';
import { cn } from '@/lib/utils';
import { X, Check } from 'lucide-react';

interface Tag {
  id: string;
  name: string;
}

interface ContactFilterBarProps {
  departments: Department[];
  tags: Tag[];
  onFilterChange: (filters: {
    searchQuery: string;
    selectedDepartment: string | null;
    selectedTags: string[];
  }) => void;
}

export function ContactFilterBar({
  departments,
  tags,
  onFilterChange,
}: ContactFilterBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isTagsOpen, setIsTagsOpen] = useState(false);

  // Update search query and notify parent
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);
    onFilterChange({
      searchQuery: newValue,
      selectedDepartment,
      selectedTags,
    });
  };

  // Update department and notify parent
  const handleDepartmentChange = (value: string) => {
    const newDepartment = value === "all" ? null : value;
    setSelectedDepartment(newDepartment);
    onFilterChange({
      searchQuery,
      selectedDepartment: newDepartment,
      selectedTags,
    });
  };

  // Update tags and notify parent
  const handleTagToggle = (tagId: string) => {
    const newTags = selectedTags.includes(tagId)
      ? selectedTags.filter((id) => id !== tagId)
      : [...selectedTags, tagId];
    
    setSelectedTags(newTags);
    onFilterChange({
      searchQuery,
      selectedDepartment,
      selectedTags: newTags,
    });
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedDepartment(null);
    setSelectedTags([]);
    onFilterChange({
      searchQuery: '',
      selectedDepartment: null,
      selectedTags: [],
    });
  };

  const selectedTagsCount = selectedTags.length;

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-4 mb-6 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Search input */}
        <div className="md:col-span-6 relative">
          <Label htmlFor="search" className="sr-only">Search</Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
            <Input
              id="search"
              placeholder="Search by name or job title..."
              type="search"
              className="pl-9 border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
        </div>

        {/* Department filter */}
        <div className="md:col-span-3">
          <Label htmlFor="department-filter" className="text-xs mb-1 block text-slate-500">
            Department
          </Label>
          <Select
            value={selectedDepartment || "all"}
            onValueChange={handleDepartmentChange}
          >
            <SelectTrigger id="department-filter" className="bg-white border-slate-200 text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <SelectValue placeholder="All departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All departments</SelectItem>
              {departments.map((department) => (
                <SelectItem key={department.id} value={department.id}>
                  {department.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tags filter (multiselect) */}
        <div className="md:col-span-3">
          <Label htmlFor="tags-filter" className="text-xs mb-1 block text-slate-500">
            Tags
          </Label>
          <Popover open={isTagsOpen} onOpenChange={setIsTagsOpen}>
            <PopoverTrigger asChild>
              <Button
                id="tags-filter"
                variant="outline"
                role="combobox"
                aria-expanded={isTagsOpen}
                className="justify-between w-full bg-white border-slate-200 text-slate-700 hover:bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {selectedTagsCount > 0 ? (
                  <span className="truncate">
                    {selectedTagsCount} {selectedTagsCount === 1 ? 'tag' : 'tags'} selected
                  </span>
                ) : (
                  <span className="text-slate-400">Select tags</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-[200px] md:w-[300px] border-slate-200 bg-white shadow-md">
              <Command className="bg-white">
                <CommandInput placeholder="Search tags..." className="border-b-0 focus:ring-0" />
                <CommandEmpty className="text-center py-3 text-slate-500">No tags found.</CommandEmpty>
                <CommandGroup className="max-h-64 overflow-auto">
                  {tags.map((tag) => {
                    const isSelected = selectedTags.includes(tag.id);
                    return (
                      <CommandItem
                        key={tag.id}
                        value={tag.name}
                        onSelect={() => handleTagToggle(tag.id)}
                        className="cursor-pointer hover:bg-slate-50"
                      >
                        <div className={cn(
                          "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-blue-500",
                          isSelected ? "bg-blue-500 text-white" : "opacity-50"
                        )}>
                          {isSelected && <Check className="h-3 w-3" />}
                        </div>
                        <span>{tag.name}</span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Active filters */}
      {(searchQuery || selectedDepartment || selectedTagsCount > 0) && (
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <Filter className="h-3 w-3" /> Active filters:
          </span>
          
          {selectedDepartment && (
            <Badge variant="secondary" className="flex items-center gap-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200">
              {departments.find(d => d.id === selectedDepartment)?.name}
              <button 
                onClick={() => handleDepartmentChange("all")}
                className="ml-1 rounded-full hover:bg-blue-200"
                aria-label="Remove department filter"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {selectedTags.map((tagId) => {
            const tag = tags.find((t) => t.id === tagId);
            return tag ? (
              <Badge key={tagId} variant="secondary" className="flex items-center gap-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200">
                {tag.name}
                <button 
                  onClick={() => handleTagToggle(tagId)}
                  className="ml-1 rounded-full hover:bg-blue-200"
                  aria-label={`Remove ${tag.name} filter`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ) : null;
          })}
          
          {(searchQuery || selectedDepartment || selectedTagsCount > 0) && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleClearFilters}
              className="h-7 px-2 text-xs text-slate-600 hover:text-blue-700 hover:bg-slate-100"
            >
              Clear all
            </Button>
          )}
        </div>
      )}
    </div>
  );
} 