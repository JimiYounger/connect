// src/app/(test)/semantic-search/page.tsx

'use client';

import { useState, useEffect, useCallback } from 'react';
import { SemanticSearch, SearchResult } from '@/features/documentLibrary/search';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';

export default function SemanticSearchTestPage() {
  // Memoize state to prevent re-renders
  const [lastResults, setLastResults] = useState<SearchResult[]>([]);
  const [resultCount, setResultCount] = useState(0);
  const [autoFocus, setAutoFocus] = useState(true);
  const [selectedTab, setSelectedTab] = useState('default');
  
  // Memoize the callback to prevent re-renders
  const handleResults = useCallback((results: SearchResult[]) => {
    setLastResults(results);
    setResultCount(results.length);
  }, []);
  
  // Example filter configurations - Define outside component or memoize
  const filterConfigs = {
    default: {},
    roles: { role_type: 'Closer' },
    tags: { tags: ['Proposal', 'Update'] },
    combined: { role_type: 'Closer', tags: ['Proposal', 'Update'] }
  };

  return (
    <main className="mx-auto max-w-7xl py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold">🔍 Semantic Search Test</h1>
          <p className="text-muted-foreground mt-2">
            This page demonstrates the SemanticSearch component with different configurations.
          </p>
        </div>
        
        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>Testing Information</AlertTitle>
          <AlertDescription>
            This component connects to the <code className="bg-muted px-1 py-0.5 rounded">/api/document-library/search</code> API 
            endpoint. Make sure your backend is properly configured and running.
          </AlertDescription>
        </Alert>
        
        <div className="flex flex-wrap gap-4 mb-2">
          <div className="flex items-center space-x-2">
            <Switch 
              id="autofocus" 
              checked={autoFocus} 
              onCheckedChange={setAutoFocus} 
            />
            <Label htmlFor="autofocus">AutoFocus Search</Label>
          </div>
          
          <Badge variant="outline" className="ml-auto">
            Results: {resultCount}
          </Badge>
        </div>
        
        <Tabs defaultValue={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="default">Default</TabsTrigger>
            <TabsTrigger value="roles">Role Filter</TabsTrigger>
            <TabsTrigger value="tags">Tag Filter</TabsTrigger>
            <TabsTrigger value="combined">Combined Filters</TabsTrigger>
          </TabsList>
          
          {/* Render only the active tab content */}
          {selectedTab === 'default' && (
            <TabsContent value="default">
              <Card>
                <CardHeader>
                  <CardTitle>Default Configuration</CardTitle>
                  <CardDescription>
                    Basic search with no filters applied.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SemanticSearch
                    placeholder="Search document library..."
                    autoFocus={autoFocus}
                    matchThreshold={0.5}
                    matchCount={10}
                    initialSortBy="similarity"
                    onResults={handleResults}
                    filters={filterConfigs.default}
                    className="mb-4"
                    key="search-default"
                  />
                </CardContent>
              </Card>
            </TabsContent>
          )}
          
          {selectedTab === 'roles' && (
            <TabsContent value="roles">
              <Card>
                <CardHeader>
                  <CardTitle>Role-Based Filtering</CardTitle>
                  <CardDescription>
                    Search filtered by user role (Closer).
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SemanticSearch
                    placeholder="Search for Closer-specific documents..."
                    autoFocus={autoFocus}
                    matchThreshold={0.5}
                    matchCount={10}
                    initialSortBy="similarity"
                    onResults={handleResults}
                    filters={filterConfigs.roles}
                    className="mb-4"
                    key="search-roles"
                  />
                </CardContent>
              </Card>
            </TabsContent>
          )}
          
          {selectedTab === 'tags' && (
            <TabsContent value="tags">
              <Card>
                <CardHeader>
                  <CardTitle>Tag-Based Filtering</CardTitle>
                  <CardDescription>
                    Search filtered by document tags (Proposal, Update).
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SemanticSearch
                    placeholder="Search for proposal & update documents..."
                    autoFocus={autoFocus}
                    matchThreshold={0.6}
                    matchCount={5}
                    initialSortBy="created_at"
                    onResults={handleResults}
                    filters={filterConfigs.tags}
                    className="mb-4"
                    key="search-tags"
                  />
                </CardContent>
              </Card>
            </TabsContent>
          )}
          
          {selectedTab === 'combined' && (
            <TabsContent value="combined">
              <Card>
                <CardHeader>
                  <CardTitle>Combined Filters</CardTitle>
                  <CardDescription>
                    Search with both role and tag filters applied.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SemanticSearch
                    placeholder="Search for Closer proposals & updates..."
                    autoFocus={autoFocus}
                    matchThreshold={0.7}
                    matchCount={5}
                    initialSortBy="title"
                    onResults={handleResults}
                    filters={filterConfigs.combined}
                    className="mb-4"
                    key="search-combined"
                  />
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
        
        <Separator className="my-4" />
        
        <Card>
          <CardHeader>
            <CardTitle>Last Search Results</CardTitle>
            <CardDescription>
              Displays the most recent search results via the onResults callback.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {lastResults.length > 0 ? (
              <ScrollArea className="h-48 rounded-md border p-4">
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify(lastResults, null, 2)}
                </pre>
              </ScrollArea>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Perform a search to see results here
              </div>
            )}
          </CardContent>
        </Card>
        
        <div className="p-4 bg-muted/40 rounded-lg">
          <h3 className="font-medium mb-2">Component Properties</h3>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li><strong>placeholder</strong>: Customizable search input placeholder</li>
            <li><strong>autoFocus</strong>: Automatically focus search input on render</li>
            <li><strong>filters</strong>: Object containing filter criteria</li>
            <li><strong>matchThreshold</strong>: Minimum similarity score (0-1)</li>
            <li><strong>matchCount</strong>: Maximum number of results to return</li>
            <li><strong>initialSortBy</strong>: Initial sort order (similarity, created_at, title)</li>
            <li><strong>onResults</strong>: Callback function when results are received</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
