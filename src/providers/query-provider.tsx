'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState, useEffect } from 'react'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 1,
        refetchOnWindowFocus: false
      }
    }
  }))

  useEffect(() => {
    console.log('QueryProvider initialized');
    
    // Debug listener for query cache
    const unsubscribe = queryClient.getQueryCache().subscribe(event => {
      if (event.type === 'added') {
        console.log('Query added:', event.query.getQueryKey());
      } else if (event.type === 'updated') {
        console.log('Query updated:', event.query.getQueryKey(), 'Status:', event.query.getState().status);
      } else if (event.type === 'removed') {
        console.log('Query removed:', event.query.getQueryKey());
      }
    })
    
    return () => {
      unsubscribe();
      console.log('QueryProvider cleanup');
    }
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  )
} 