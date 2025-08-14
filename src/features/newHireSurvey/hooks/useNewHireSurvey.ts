'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import type { NewHireSurveyResponse, Person } from '../lib/types';

interface UseNewHireSurveyOptions {
  enabled?: boolean;
}

interface UseNewHireSurveyReturn {
  data: NewHireSurveyResponse | undefined;
  people: Person[];
  areas: string[];
  isLoading: boolean;
  error: Error | null;
  filteredData: {
    people: Person[];
    areas: string[];
  };
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

async function fetchNewHireSurveyData(): Promise<NewHireSurveyResponse> {
  const response = await fetch('/api/airtable/new-hire');
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.details || `HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response.json();
}

export function useNewHireSurvey(options: UseNewHireSurveyOptions = {}): UseNewHireSurveyReturn {
  const [searchQuery, setSearchQuery] = useState('');
  
  const {
    data,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['newHireSurvey'],
    queryFn: fetchNewHireSurveyData,
    enabled: options.enabled !== false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

  // Memoized filtering based on search query
  const filteredData = useMemo(() => {
    if (!data) return { people: [], areas: [] };
    
    if (!searchQuery.trim()) {
      return {
        people: data.people,
        areas: data.areas,
      };
    }

    const query = searchQuery.toLowerCase().trim();
    const filteredPeople = data.people.filter(person => 
      person.name.toLowerCase().includes(query) ||
      person.area.toLowerCase().includes(query)
    );

    // Get unique areas from filtered people
    const filteredAreas = Array.from(
      new Set(filteredPeople.map(person => person.area))
    ).sort();

    return {
      people: filteredPeople,
      areas: filteredAreas,
    };
  }, [data, searchQuery]);

  return {
    data,
    people: data?.people || [],
    areas: data?.areas || [],
    isLoading,
    error,
    filteredData,
    searchQuery,
    setSearchQuery,
  };
}