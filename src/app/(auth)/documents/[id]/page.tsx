'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, ArrowLeft, Download, FileText } from 'lucide-react';

type DocumentDetails = {
  id: string;
  title: string;
};

function CustomPDFViewer({ url }: { url: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!url) return;
    
    console.log('CustomPDFViewer: Setting up iframe with URL', url);
    setIsLoading(true);
    setError(null);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      console.log('CustomPDFViewer: Loading is taking longer than expected');
    }, 8000);
    
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'pdf-error') {
        console.error('PDF iframe reported error:', event.data.message);
        setError(event.data.message || 'An error occurred in the PDF viewer.');
        setIsLoading(false);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      }
      
      if (event.data?.type === 'pdf-loaded') {
        console.log('PDF iframe reported successful load');
        setIsLoading(false);
        setError(null);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
     
  }, [url]);

  const handleIframeLoad = () => {
    console.log('CustomPDFViewer: iframe onLoad triggered');
  };
  
  const handleIframeError = (e: React.SyntheticEvent<HTMLIFrameElement, Event>) => {
    console.error('CustomPDFViewer: iframe failed to load', e);
    if (!error) {
      setError('Failed to load the document viewer iframe.');
    }
    setIsLoading(false);
  };
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-muted/30 text-center p-4">
        <AlertCircle className="h-10 w-10 mb-3 text-destructive" />
        <h3 className="font-medium mb-1 text-destructive">Error Loading Document</h3>
        <p className="text-sm text-muted-foreground max-w-sm">{error}</p>
      </div>
    );
  }

  const iframeSrc = `/api/document-library/pdf-viewer?url=${encodeURIComponent(url)}`;

  return (
    <div className="w-full h-full relative bg-muted/10">
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-10">
          <FileText className="h-10 w-10 mb-3 text-muted-foreground animate-pulse" />
          <p className="text-sm text-muted-foreground">Loading document...</p>
        </div>
      )}
      
      <iframe
        ref={iframeRef}
        src={iframeSrc}
        className={`w-full h-full border-0 transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        onLoad={handleIframeLoad}
        onError={handleIframeError}
        allow="fullscreen"
        title={document?.title || 'Document Viewer'}
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
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchDocumentBaseInfo = async () => {
      if (!documentId) return;
      
      try {
        setIsLoading(true);
        setError(null);
        setDocumentUrl(null);
        
        const supabase = createClient();
        
        const { data: documentData, error: documentError } = await supabase
          .from('documents')
          .select(`id, title`)
          .eq('id', documentId)
          .single();
        
        if (documentError) throw new Error(`Document fetch error: ${documentError.message}`);
        if (!documentData) throw new Error('Document not found.');

        setDocument({ id: documentData.id, title: documentData.title });

        const response = await fetch(`/api/document-library/get-secure-url/${documentId}`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to get document URL: ${response.status}`);
        }
        const data = await response.json();
        if (!data.url) {
           throw new Error('Secure URL not provided by the API.');
        }
        setDocumentUrl(data.url);

      } catch (err) {
        console.error('Error fetching document data or URL:', err);
        setError(err instanceof Error ? err.message : 'Failed to load document information');
        setDocument(null);
        setDocumentUrl(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDocumentBaseInfo();
  }, [documentId]);
  
  const handleDownloadDocument = useCallback(() => {
    if (!documentId) return;
    window.open(`/api/document-library/download/${documentId}`, '_blank');
  }, [documentId]);
  
  const handleGoBack = useCallback(() => {
    router.back();
  }, [router]);
  
  if (isLoading) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-background p-4">
         <div className="absolute top-0 left-0 right-0 p-3 flex justify-between items-center">
            <Skeleton className="h-9 w-20" /> 
            <Skeleton className="h-9 w-28" /> 
         </div>
         <FileText className="h-12 w-12 mb-4 text-muted-foreground animate-pulse" />
         <p className="text-sm text-muted-foreground">Loading document details...</p>
      </div>
    );
  }
  
  if (error && !documentUrl) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-background p-4 text-center">
        <div className="absolute top-0 left-0 p-3">
           <Button variant="outline" size="sm" onClick={handleGoBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
           </Button>
        </div>
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
        <h2 className="text-lg font-semibold mb-2 text-destructive">Error Loading Document</h2>
        <p className="text-muted-foreground mb-6 max-w-md">{error}</p>
        <Button onClick={handleGoBack} variant="secondary">Go Back</Button>
      </div>
    );
  }
  
  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      <header className="flex-shrink-0 h-14 px-4 py-2 border-b bg-background/95 backdrop-blur-sm z-20">
         <div className="flex items-center justify-between h-full">
           <Button variant="outline" size="sm" onClick={handleGoBack}>
             <ArrowLeft className="mr-1.5 h-4 w-4" />
             Back
           </Button>
           
           <h1 className="text-sm font-medium text-muted-foreground truncate hidden sm:block mx-4 flex-1 text-center">
             {document?.title || 'Document'}
           </h1>

           <Button 
              variant="default"
              size="sm" 
              onClick={handleDownloadDocument}
              disabled={!documentUrl}
           >
              <Download className="mr-1.5 h-4 w-4" />
              Download
           </Button>
         </div>
      </header>
      
      <main className="flex-grow overflow-hidden relative">
        {documentUrl ? (
          <CustomPDFViewer url={documentUrl} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full bg-muted/30 text-center p-4">
             <AlertCircle className="h-10 w-10 mb-3 text-destructive" />
             <h3 className="font-medium mb-1 text-destructive">Could not load document</h3>
             <p className="text-sm text-muted-foreground">The document URL could not be retrieved.</p>
          </div>
        )}
      </main>
    </div>
  );
} 