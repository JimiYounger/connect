'use client';

import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, Users, AlertCircle } from 'lucide-react';
import { Navigation } from '@/features/homepage/components/Navigation/Navigation';
import { AreaAccordion } from '../components/AreaAccordion';
import { useNewHireSurvey } from '../hooks/useNewHireSurvey';
import { useAuth } from '@/features/auth/context/auth-context';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export function NewHireSurveyPage() {
  const { session } = useAuth();
  const {
    isLoading,
    error,
    filteredData,
    searchQuery,
    setSearchQuery,
  } = useNewHireSurvey();

  // Hydration safety: ensure we're client-side before rendering dynamic content
  const [isHydrated, setIsHydrated] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Hydration check - this only runs on client-side
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Add scroll listener for navigation bar effect
  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      if (offset > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Show loading until hydration is complete - prevents SSR/client mismatch
  if (!isHydrated || !session) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      {/* Navigation wrapper */}
      <div 
        className={cn(
          "navigation-wrapper sticky top-0 z-50 transition-colors duration-200 bg-black text-white",
          scrolled ? 'bg-opacity-90 backdrop-blur-sm' : 'bg-opacity-100'
        )} 
        style={{ marginBottom: '-2px' }}
      >
        {/* Menu positioned like in HomePage */}
        <div 
          className="absolute nav-menu-positioner" 
          style={{ 
            left: '18px',
            top: '12px'
          }}
        >
          <Navigation />
        </div>
        
        {/* Add some padding to prevent content overlap */}
        <div style={{ height: '70px' }} />
      </div>

      <div className="container mx-auto px-4 py-6 max-w-4xl flex-1">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-blue-900 rounded-xl">
            <Users className="h-8 w-8 text-blue-400" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              New Hire Surveys
            </h1>
            <p className="text-gray-300 text-lg">
              View and analyze new hire survey responses by area
            </p>
          </div>
        </div>

        <div className="relative max-w-lg">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            placeholder="Search by name or area..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 py-3 text-base border-2 border-gray-600 bg-gray-800 text-white placeholder:text-gray-400 focus:border-blue-500 rounded-lg w-full"
          />
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-8 border-2 border-red-200">
          <AlertCircle className="h-5 w-5" />
          <AlertDescription className="text-base font-medium">
            Failed to load survey data: {error.message}
          </AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <>
          {searchQuery && (
            <div className="mb-6 p-4 bg-blue-950 border border-blue-800 rounded-lg">
              <div className="text-base text-blue-200 font-medium">
                {filteredData.people.length === 0 ? (
                  <span>No results found for &quot;{searchQuery}&quot;</span>
                ) : (
                  <span>
                    Found {filteredData.people.length} people 
                    {filteredData.areas.length > 0 && (
                      <span> across {filteredData.areas.length} areas</span>
                    )}
                    <span> matching &quot;{searchQuery}&quot;</span>
                  </span>
                )}
              </div>
            </div>
          )}

          <AreaAccordion 
            areas={filteredData.areas} 
            people={filteredData.people}
          />
        </>
      )}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="border-2 border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Skeleton className="h-7 w-40" />
              <Skeleton className="h-6 w-10" />
            </div>
            <Skeleton className="h-5 w-5" />
          </div>
          <div className="space-y-4">
            {[1, 2].map((j) => (
              <div key={j} className="border border-gray-200 rounded-lg p-5 border-l-4 border-l-gray-300">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-9 w-24" />
                </div>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-4/5" />
                    <Skeleton className="h-12 w-3/5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}