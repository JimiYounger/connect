'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, ArrowLeft, Download, ExternalLink, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type DocumentDetails = {
  id: string;
  title: string;
  description: string | null;
  category: { id: string; name: string } | null;
  subcategory: { id: string; name: string } | null;
  tags: Array<{ id: string; name: string }>;
  uploadedBy: { first_name: string; last_name: string } | null;
  createdAt: string;
  updatedAt: string;
};

function CustomPDFViewer({ url }: { url: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url) return;
    
    console.log('CustomPDFViewer: Setting up iframe with URL', url);
    setIsLoading(true);
    
    // Create timeout for loading feedback
    const timeout = setTimeout(() => {
      console.log('CustomPDFViewer: Loading is taking longer than expected');
      // We won't set error yet, just log it
    }, 5000);
    
    // Set up message handler to receive errors from the iframe
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'pdf-error') {
        console.error('PDF iframe reported error:', event.data.message);
        setError(event.data.message);
        setIsLoading(false);
      }
      
      if (event.data?.type === 'pdf-loaded') {
        console.log('PDF iframe reported successful load');
        setIsLoading(false);
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
      clearTimeout(timeout);
    };
  }, [url]);

  // Handle iframe load event
  const handleIframeLoad = () => {
    console.log('CustomPDFViewer: iframe onLoad triggered');
    // We'll continue showing loading until we get a specific message
    // from the iframe or encounter an error
  };
  
  const handleIframeError = (e: React.SyntheticEvent<HTMLIFrameElement, Event>) => {
    console.error('CustomPDFViewer: iframe failed to load', e);
    setError('Failed to load the document viewer');
    setIsLoading(false);
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <h3 className="font-medium mb-2 text-destructive">Error Loading Document</h3>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
          <div className="text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
            <p className="text-sm text-muted-foreground">Loading document...</p>
          </div>
        </div>
      )}
      
      <iframe
        ref={iframeRef}
        src={`/api/document-library/pdf-viewer?url=${encodeURIComponent(url)}`}
        className="w-full h-full border-0"
        onLoad={handleIframeLoad}
        onError={handleIframeError}
        allow="fullscreen"
      />
    </div>
  );
}

export default function DocumentViewPage() {
  const params = useParams();
  const router = useRouter();
  const documentId = params.id as string;
  
  const [document, setDocument] = useState<DocumentDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fullscreenView, setFullscreenView] = useState(false);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchDocumentDetails = async () => {
      if (!documentId) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const supabase = createClient();
        
        // Fetch basic document info
        const { data: documentData, error: documentError } = await supabase
          .from('documents')
          .select(`
            id,
            title,
            description,
            category:document_categories!documents_document_category_id_fkey(id, name),
            subcategory:document_subcategories!documents_document_subcategory_id_fkey(id, name),
            created_at,
            updated_at,
            user_profiles:uploaded_by(first_name, last_name)
          `)
          .eq('id', documentId)
          .single();
        
        if (documentError) throw new Error(documentError.message);
        
        // Fetch document tags
        const { data: tagData, error: tagError } = await supabase
          .from('document_tag_assignments')
          .select(`
            document_tags (id, name)
          `)
          .eq('document_id', documentId);
        
        if (tagError) throw new Error(tagError.message);
        
        // Format document data
        const formattedDocument: DocumentDetails = {
          id: documentData.id,
          title: documentData.title,
          description: documentData.description,
          category: documentData.category,
          subcategory: documentData.subcategory,
          tags: tagData.map(tag => tag.document_tags),
          uploadedBy: documentData.user_profiles,
          createdAt: documentData.created_at,
          updatedAt: documentData.updated_at
        };
        
        setDocument(formattedDocument);
      } catch (err) {
        console.error('Error fetching document:', err);
        setError(err instanceof Error ? err.message : 'Failed to load document');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDocumentDetails();
  }, [documentId]);
  
  useEffect(() => {
    // Get the document URL for embedding
    if (documentId) {
      const getDocumentUrl = async () => {
        try {
          // Create a token or get any authentication headers required
          const response = await fetch(`/api/document-library/get-secure-url/${documentId}`);
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Failed to get document URL: ${response.status}`);
          }
          
          const data = await response.json();
          setDocumentUrl(data.url);
        } catch (err) {
          console.error('Error getting document URL:', err);
          setError(err instanceof Error ? err.message : 'Failed to get document URL');
        }
      };
      
      getDocumentUrl();
    }
  }, [documentId]);
  
  // Use a callback to ensure the function reference is stable
  const toggleFullscreen = useCallback(() => {
    setFullscreenView(prevState => !prevState);
  }, []);

  // Handle keyboard events for fullscreen
  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined') return;

    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && fullscreenView) {
        setFullscreenView(false);
      }
    };

    if (fullscreenView) {
      window.addEventListener('keydown', handleEscKey);
    }

    return () => {
      window.removeEventListener('keydown', handleEscKey);
    };
  }, [fullscreenView]);

  const handleViewDocument = () => {
    toggleFullscreen();
  };
  
  const handleDownloadDocument = () => {
    // Download the document
    window.open(`/api/document-library/download/${documentId}`, '_blank');
  };
  
  const handleGoBack = () => {
    router.back();
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="mb-6">
          <Button variant="ghost" onClick={handleGoBack} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Skeleton className="h-8 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            
            <div className="flex gap-2 mt-4">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-16" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Button variant="ghost" onClick={handleGoBack} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        
        <div className="text-center py-8">
          <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">Could not load document</h2>
          <p className="text-muted-foreground mb-6">The document could not be loaded. It may have been deleted or you may not have permission to view it.</p>
          <Button onClick={handleGoBack}>Go Back</Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`container mx-auto p-4 max-w-6xl ${fullscreenView ? 'overflow-hidden' : ''}`}>
      {/* Fullscreen overlay (only when fullscreen is active) */}
      {fullscreenView && (
        <div 
          className="fixed inset-0 bg-background/95 z-[100] flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setFullscreenView(false)}
        >
          <div className="relative w-full max-w-6xl h-[90vh] rounded-lg shadow-xl border bg-card">
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => setFullscreenView(false)}
              className="absolute bottom-4 right-4 z-10 shadow-md"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Exit Fullscreen
            </Button>
            
            {documentUrl ? (
              <CustomPDFViewer url={documentUrl} />
            ) : error ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
                  <h3 className="font-medium mb-2 text-destructive">Error Loading Document</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {error}
                  </p>
                  <Button variant="outline" onClick={handleDownloadDocument}>
                    Try Direct Download
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Loading document...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Regular content (visible only when not in fullscreen mode) */}
      {!fullscreenView && (
        <>
          <div className="mb-4">
            <Button variant="ghost" onClick={handleGoBack} className="mb-2">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">{document?.title}</h1>
            {document?.category && (
              <div className="text-sm text-muted-foreground mt-1">
                {document.category.name}
                {document.subcategory && ` > ${document.subcategory.name}`}
              </div>
            )}
          </div>
          
          <Card className="shadow-md">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <CardTitle className="text-xl">Document Details</CardTitle>
                  <CardDescription>
                    Last updated {formatDistanceToNow(new Date(document?.updatedAt || ''))} ago
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleDownloadDocument}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                  <Button 
                    onClick={handleViewDocument}
                    variant="default"
                    className="bg-primary hover:bg-primary/90"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Fullscreen
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-2">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Document metadata sidebar */}
                <div className="lg:col-span-1 space-y-4">
                  {document?.description && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Description</h3>
                      <p className="text-sm">{document.description}</p>
                    </div>
                  )}
                  
                  {document?.tags && document.tags.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Tags</h3>
                      <div className="flex flex-wrap gap-1">
                        {document.tags.map(tag => (
                          <Badge key={tag.id} variant="secondary">
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <Separator className="my-3" />
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <h3 className="text-xs font-medium text-muted-foreground mb-1">Uploaded by</h3>
                      <p>
                        {document?.uploadedBy 
                          ? `${document.uploadedBy.first_name} ${document.uploadedBy.last_name}`
                          : 'Unknown'}
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-xs font-medium text-muted-foreground mb-1">Created</h3>
                      <p>{new Date(document?.createdAt || '').toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
                
                {/* Document viewer - now takes 3/4 of the width on larger screens */}
                <div className="lg:col-span-3">
                  {/* Document viewer (non-fullscreen mode) */}
                  <div className="h-[70vh] min-h-[500px] border rounded-md relative">
                    {documentUrl ? (
                      <CustomPDFViewer url={documentUrl} />
                    ) : error ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
                          <h3 className="font-medium mb-2 text-destructive">Error Loading Document</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            {error}
                          </p>
                          <Button variant="outline" onClick={handleDownloadDocument}>
                            Try Direct Download
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">Loading document...</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="border-t pt-4 text-center text-xs text-muted-foreground">
              Document ID: {document?.id}
            </CardFooter>
          </Card>
        </>
      )}
    </div>
  );
} 