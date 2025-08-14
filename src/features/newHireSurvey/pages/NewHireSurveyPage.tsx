'use client';

import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, Users, AlertCircle } from 'lucide-react';
import { AreaAccordion } from '../components/AreaAccordion';
import { useNewHireSurvey } from '../hooks/useNewHireSurvey';

export function NewHireSurveyPage() {
  const {
    isLoading,
    error,
    filteredData,
    searchQuery,
    setSearchQuery,
  } = useNewHireSurvey();

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Users className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              New Hire Surveys
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              View and analyze new hire survey responses by area
            </p>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name or area..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load survey data: {error.message}
          </AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <>
          {searchQuery && (
            <div className="mb-4 text-sm text-gray-600">
              {filteredData.people.length === 0 ? (
                <span>No results found for &quot;{searchQuery}&quot;</span>
              ) : (
                <span>
                  Found {filteredData.people.length} people 
                  {filteredData.areas.length > 0 && (
                    <span> across {filteredData.areas.length} areas</span>
                  )}
                  {searchQuery && <span> matching &quot;{searchQuery}&quot;</span>}
                </span>
              )}
            </div>
          )}

          <AreaAccordion 
            areas={filteredData.areas} 
            people={filteredData.people}
          />
        </>
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-5 w-8" />
            </div>
            <Skeleton className="h-4 w-4" />
          </div>
          <div className="space-y-3">
            {[1, 2].map((j) => (
              <div key={j} className="border border-gray-100 rounded-lg p-3">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-8 w-20" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}