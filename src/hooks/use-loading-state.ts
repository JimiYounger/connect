// src/hooks/use-loading-state.ts

import { useMemo } from 'react'

interface LoadingState {
  isLoading: boolean
  message: string | null
}

export function useLoadingState(
  conditions: { [key: string]: boolean },
  messages: { [key: string]: string }
): LoadingState {
  return useMemo(() => {
    // Find the first loading condition
    const loadingKey = Object.entries(conditions).find(([_, isLoading]) => isLoading)?.[0]

    return {
      isLoading: !!loadingKey,
      message: loadingKey ? messages[loadingKey] : null
    }
  }, [conditions, messages])
}