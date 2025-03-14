import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, UserCheck, UserX, Phone, Mail } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { RecipientFilter } from './RecipientSelector';

// Recipient type definition
interface Recipient {
  id: string;
  name: string;
  email: string;
  phone: string;
  roleType: string;
  team?: string;
  area?: string;
  region?: string;
  optedOut: boolean;
  avatarUrl?: string;
}

// Response type for the preview API
interface RecipientsPreviewResponse {
  recipients: Recipient[];
  totalCount: number;
}

// Props for the RecipientPreview component
interface RecipientPreviewProps {
  filter: RecipientFilter;
  onSelectionChange?: (selectedIds: string[]) => void;
  limit?: number;
}

// Fetch recipients preview based on filter
const fetchRecipientsPreview = async (filter: RecipientFilter, page: number, limit: number): Promise<RecipientsPreviewResponse> => {
  const response = await fetch('/api/messaging/recipients/preview', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      filter,
      limit,
      offset: (page - 1) * limit
    }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch recipients preview');
  }
  
  return response.json();
};

// Fetch total count of recipients matching the filter
const fetchRecipientsCount = async (filter: RecipientFilter): Promise<number> => {
  const response = await fetch('/api/messaging/recipients/count', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ filter }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch recipients count');
  }
  
  const data = await response.json();
  return data.count || 0;
};

export function RecipientPreview({ 
  filter, 
  onSelectionChange,
  limit = 10
}: RecipientPreviewProps) {
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  
  // Fetch recipients preview
  const recipientsQuery = useQuery<RecipientsPreviewResponse>({
    queryKey: ['recipientsPreview', filter, page, limit],
    queryFn: () => fetchRecipientsPreview(filter, page, limit),
    placeholderData: (previousData) => previousData,
  });
  
  // Fetch total count
  const countQuery = useQuery<number>({
    queryKey: ['recipientsCount', filter],
    queryFn: () => fetchRecipientsCount(filter),
  });
  
  // Use useMemo to memoize the recipients array
  const recipients = useMemo(() => 
    recipientsQuery.data?.recipients || [], 
    [recipientsQuery.data?.recipients]
  );
  
  const totalCount = useMemo(() => 
    countQuery.data || 0, 
    [countQuery.data]
  );
  
  const totalPages = useMemo(() => 
    Math.ceil(totalCount / limit), 
    [totalCount, limit]
  );
  
  // Handle selection of all recipients on current page
  const handleSelectAllChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setSelectAll(checked);
    
    if (checked) {
      const currentPageIds = recipients.map((recipient: Recipient) => recipient.id);
      const newSelectedIds = [...selectedIds];
      
      currentPageIds.forEach((id: string) => {
        if (!newSelectedIds.includes(id)) {
          newSelectedIds.push(id);
        }
      });
      
      setSelectedIds(newSelectedIds);
      if (onSelectionChange) onSelectionChange(newSelectedIds);
    } else {
      const currentPageIds = recipients.map((recipient: Recipient) => recipient.id);
      const newSelectedIds = selectedIds.filter(id => !currentPageIds.includes(id));
      
      setSelectedIds(newSelectedIds);
      if (onSelectionChange) onSelectionChange(newSelectedIds);
    }
  };
  
  // Handle selection of individual recipient
  const handleRecipientSelection = (id: string, checked: boolean) => {
    let newSelectedIds;
    
    if (checked) {
      newSelectedIds = [...selectedIds, id];
    } else {
      newSelectedIds = selectedIds.filter(selectedId => selectedId !== id);
    }
    
    setSelectedIds(newSelectedIds);
    if (onSelectionChange) onSelectionChange(newSelectedIds);
    
    // Update selectAll state based on if all current page items are selected
    const currentPageIds = recipients.map((recipient: Recipient) => recipient.id);
    const allCurrentSelected = currentPageIds.every((id: string) => newSelectedIds.includes(id));
    setSelectAll(allCurrentSelected);
  };
  
  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setPage(newPage);
      setSelectAll(false);
    }
  };
  
  // Reset page when filter changes
  useEffect(() => {
    setPage(1);
  }, [filter]);
  
  // Check if all recipients on current page are selected
  useEffect(() => {
    if (recipients.length > 0) {
      const currentPageIds = recipients.map((recipient: Recipient) => recipient.id);
      const allCurrentSelected = currentPageIds.every((id: string) => selectedIds.includes(id));
      setSelectAll(allCurrentSelected);
    }
  }, [recipients, selectedIds]);
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Recipients Preview</span>
          {!recipientsQuery.isLoading && !countQuery.isLoading && (
            <Badge variant="secondary" className="ml-2">
              {totalCount} {totalCount === 1 ? 'recipient' : 'recipients'} match filters
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Preview and select recipients based on your filters
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {recipientsQuery.isError || countQuery.isError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load recipients. Please try again.
            </AlertDescription>
          </Alert>
        ) : recipientsQuery.isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : recipients.length === 0 ? (
          <div className="text-center py-8">
            <UserX className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-lg font-semibold">No recipients found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Try adjusting your filters to find recipients
            </p>
          </div>
        ) : (
          <>
            <ScrollArea className="h-[350px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAllChange}
                        className="rounded border-gray-300"
                        aria-label="Select all recipients"
                      />
                    </TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recipients.map((recipient: Recipient) => (
                    <TableRow key={recipient.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(recipient.id)}
                          onChange={(e) => handleRecipientSelection(recipient.id, e.target.checked)}
                          className="rounded border-gray-300"
                          aria-label={`Select ${recipient.name}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarImage src={recipient.avatarUrl} alt={recipient.name} />
                            <AvatarFallback>
                              {recipient.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{recipient.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {[
                                recipient.roleType,
                                recipient.team,
                                recipient.area,
                                recipient.region
                              ].filter(Boolean).join(' • ')}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center text-sm">
                            <Phone className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                            {recipient.phone}
                          </div>
                          <div className="flex items-center text-sm">
                            <Mail className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                            {recipient.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {recipient.optedOut ? (
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <UserX className="h-3 w-3" />
                            Opted Out
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="flex items-center gap-1 bg-green-100 text-green-800">
                            <UserCheck className="h-3 w-3" />
                            Active
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
            
            {totalPages > 1 && (
              <Pagination className="mt-4">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => handlePageChange(page - 1)}
                      className={page === 1 ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    // Show pages around current page
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    
                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          onClick={() => handlePageChange(pageNum)}
                          isActive={pageNum === page}
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => handlePageChange(page + 1)}
                      className={page === totalPages ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between border-t pt-4">
        <div className="text-sm text-muted-foreground">
          {selectedIds.length > 0 ? (
            <span>
              <strong>{selectedIds.length}</strong> {selectedIds.length === 1 ? 'recipient' : 'recipients'} selected
            </span>
          ) : (
            <span>No recipients selected</span>
          )}
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSelectedIds([]);
            setSelectAll(false);
            if (onSelectionChange) onSelectionChange([]);
          }}
          disabled={selectedIds.length === 0}
        >
          Clear Selection
        </Button>
      </CardFooter>
    </Card>
  );
} 